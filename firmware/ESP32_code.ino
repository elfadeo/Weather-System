#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

// --- IMPORTANT: CREDENTIALS MOVED TO SEPARATE FILE ---
// Create a file named "secrets.h" and define your credentials there.
#include "secrets.h"

// --- FIREBASE AUTH USER (create in Firebase Authentication -> Users) ---
#define USER_EMAIL "ponce.rn952@s.msumain.edu.ph" // <-- CHANGE THIS
#define USER_PASSWORD "Norhaina091402"            // <-- CHANGE THIS

// --- FIREBASE AUTH USER ---
#define USER_EMAIL "ponce.rn952@s.msumain.edu.ph"
#define USER_PASSWORD "Norhaina091402"

// --- SENSOR CONFIGURATION ---
#define DHT_SENSOR_PIN 5
#define DHT_SENSOR_TYPE DHT22
#define RAIN_SENSOR_PIN 36

// --- DEVICE LOCATION ---
#define DEVICE_LATITUDE 8.07841
#define DEVICE_LONGITUDE 124.21014

// --- ENHANCED SETTINGS ---
#define WIFI_RETRY_DELAY 500
#define WIFI_MAX_RETRIES 20
#define FIREBASE_RETRY_ATTEMPTS 3
#define SENSOR_SAMPLES 3 // Number of samples to average

// --- GLOBAL OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht_sensor(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);

// --- TIMING ---
unsigned long sendDataPrevMillis = 0;
unsigned long dataSendInterval = 5000;
unsigned long wifiCheckPrevMillis = 0;
unsigned long wifiCheckInterval = 30000; // Check WiFi every 30 seconds

// --- RAINFALL ACCUMULATION ---
float hourly_mm = 0.0;
float daily_mm = 0.0;
unsigned long rainLastMillis = 0;
int lastResetHour = -1;
int lastResetDay = -1;

// --- ERROR TRACKING ---
int consecutiveErrors = 0;
const int MAX_CONSECUTIVE_ERRORS = 10;

// --- TOKEN STATUS CALLBACK ---
void tokenStatusCallback(TokenInfo info)
{
  if (info.status == token_status_ready)
  {
    Serial.println("✓ Firebase token is ready, streaming data will begin shortly.");
  }
  else
  {
    Serial.printf("✗ Firebase token status: %s\n", info.error.message.c_str());
  }
}

// --- WIFI CONNECTION WITH RETRY ---
bool connectToWiFi()
{
  if (WiFi.status() == WL_CONNECTED)
    return true;

  Serial.println("\n--- Connecting to Wi-Fi ---");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES)
  {
    Serial.print(".");
    delay(WIFI_RETRY_DELAY);
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println();
    Serial.print("✓ Connected with IP: ");
    Serial.println(WiFi.localIP());
    Serial.printf("Signal Strength: %d dBm\n", WiFi.RSSI());
    Serial.println();
    return true;
  }
  else
  {
    Serial.println("\n✗ WiFi connection failed!");
    return false;
  }
}

// --- IMPROVED SENSOR READING WITH AVERAGING ---
float readTemperatureAvg()
{
  float sum = 0;
  int validReadings = 0;

  for (int i = 0; i < SENSOR_SAMPLES; i++)
  {
    float temp = dht_sensor.readTemperature();
    if (!isnan(temp))
    {
      sum += temp;
      validReadings++;
    }
    delay(100);
  }

  return (validReadings > 0) ? (sum / validReadings) : NAN;
}

float readHumidityAvg()
{
  float sum = 0;
  int validReadings = 0;

  for (int i = 0; i < SENSOR_SAMPLES; i++)
  {
    float hum = dht_sensor.readHumidity();
    if (!isnan(hum))
    {
      sum += hum;
      validReadings++;
    }
    delay(100);
  }

  return (validReadings > 0) ? (sum / validReadings) : NAN;
}

int readRainSensorAvg()
{
  long sum = 0;
  for (int i = 0; i < SENSOR_SAMPLES; i++)
  {
    sum += analogRead(RAIN_SENSOR_PIN);
    delay(50);
  }
  return sum / SENSOR_SAMPLES;
}

// --- RAINFALL RESET LOGIC ---
void checkAndResetRainfall()
{
  time_t now = time(nullptr);
  if (now < 24 * 3600)
    return; // Time not synced yet

  struct tm timeinfo;
  localtime_r(&now, &timeinfo);

  // Hourly reset
  if (timeinfo.tm_hour != lastResetHour)
  {
    if (lastResetHour != -1) // Don't log on first run
    {
      Serial.printf("\n[RESET] Hourly rainfall: %.2f mm\n", hourly_mm);
    }
    hourly_mm = 0.0;
    lastResetHour = timeinfo.tm_hour;
  }

  // Daily reset at midnight
  if (timeinfo.tm_mday != lastResetDay)
  {
    if (lastResetDay != -1) // Don't log on first run
    {
      Serial.printf("\n[RESET] Daily rainfall: %.2f mm\n", daily_mm);
    }
    daily_mm = 0.0;
    lastResetDay = timeinfo.tm_mday;
  }
}

// --- FIREBASE SEND WITH RETRY ---
bool sendToFirebaseWithRetry(String path, FirebaseJson *json, bool isPush)
{
  for (int attempt = 1; attempt <= FIREBASE_RETRY_ATTEMPTS; attempt++)
  {
    bool success = false;

    if (isPush)
      success = Firebase.RTDB.pushJSON(&fbdo, path, json);
    else
      success = Firebase.RTDB.setJSON(&fbdo, path, json);

    if (success)
    {
      return true;
    }
    else
    {
      Serial.printf("✗ Attempt %d/%d failed: %s\n",
                    attempt, FIREBASE_RETRY_ATTEMPTS, fbdo.errorReason().c_str());
      if (attempt < FIREBASE_RETRY_ATTEMPTS)
      {
        delay(1000 * attempt); // Exponential backoff
      }
    }
  }
  return false;
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("    WEATHER MONITORING SYSTEM v2.0");
  Serial.println("========================================\n");

  dht_sensor.begin();

  // --- CONNECT TO WIFI WITH RETRY ---
  if (!connectToWiFi())
  {
    Serial.println("CRITICAL: Cannot proceed without WiFi. Restarting in 10s...");
    delay(10000);
    ESP.restart();
  }

  // --- TIME SYNCHRONIZATION ---
  Serial.println("Configuring time...");
  configTime(8 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Waiting for time synchronization");

  time_t now = time(nullptr);
  unsigned long start = millis();
  while (now < 24 * 3600 && millis() - start < 30000)
  {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  if (now < 24 * 3600)
  {
    Serial.println("\n⚠ Warning: Failed to synchronize time!");
    Serial.println("Rainfall daily/hourly reset will not work correctly.\n");
  }
  else
  {
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    Serial.println();
    Serial.print("✓ Current time: ");
    Serial.print(asctime(&timeinfo));

    // Initialize reset trackers
    lastResetHour = timeinfo.tm_hour;
    lastResetDay = timeinfo.tm_mday;
  }

  // --- FIREBASE CONFIG ---
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // --- START FIREBASE ---
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  rainLastMillis = millis();

  Serial.println("\n✓ Setup complete. Starting data collection...\n");
}

void loop()
{
  // --- PERIODIC WIFI CHECK ---
  if (millis() - wifiCheckPrevMillis > wifiCheckInterval)
  {
    wifiCheckPrevMillis = millis();

    if (WiFi.status() != WL_CONNECTED)
    {
      Serial.println("\n⚠ WiFi disconnected! Attempting to reconnect...");
      connectToWiFi();
    }
  }

  // --- RESTART ON TOO MANY ERRORS ---
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS)
  {
    Serial.println("\n⚠ Too many consecutive errors. Restarting system...");
    delay(5000);
    ESP.restart();
  }

  // --- MAIN DATA COLLECTION ---
  if (Firebase.ready() && (millis() - sendDataPrevMillis > dataSendInterval || sendDataPrevMillis == 0))
  {
    sendDataPrevMillis = millis();

    // Check if we need to reset rainfall counters
    checkAndResetRainfall();

    // --- READ SENSORS WITH AVERAGING ---
    float temperature = readTemperatureAvg();
    float humidity = readHumidityAvg();
    int rainRaw = readRainSensorAvg();

    if (isnan(temperature) || isnan(humidity))
    {
      Serial.println("✗ Error: Failed to read from DHT sensor!");
      consecutiveErrors++;
      return;
    }

    // --- PROCESS RAIN SENSOR ---
    int adjustedRainRaw = 4095 - rainRaw;
    int rainPercent = map(rainRaw, 4095, 0, 0, 100);
    rainPercent = constrain(rainPercent, 0, 100);

    // --- CONVERT TO REALISTIC BUCKETED RAINFALL (mm/hr estimate) ---
    float mm_per_hr_bucket = 0.0;
    if (rainPercent <= 20)
      mm_per_hr_bucket = 0.0;
    else if (rainPercent <= 40)
      mm_per_hr_bucket = 4.0;
    else if (rainPercent <= 60)
      mm_per_hr_bucket = 10.0;
    else if (rainPercent <= 80)
      mm_per_hr_bucket = 16.0;
    else
      mm_per_hr_bucket = 24.0;

    // --- ACCUMULATE RAINFALL ---
    unsigned long now = millis();
    float dt_hours = (now - rainLastMillis) / 3600000.0;
    float increment = mm_per_hr_bucket * dt_hours;
    hourly_mm += increment;
    daily_mm += increment;
    rainLastMillis = now;

    // --- DISPLAY READINGS ---
    Serial.println("========================================");
    Serial.println("Preparing to send data to Firebase...");
    Serial.printf("Temperature: %.2f °C\n", temperature);
    Serial.printf("Humidity: %.2f %%\n", humidity);
    Serial.printf("Rain Raw: %d (Adjusted: %d)\n", rainRaw, adjustedRainRaw);
    Serial.printf("Rainfall Level (%%): %d %%\n", rainPercent);
    Serial.printf("Rainfall Rate (Est. mm/hr): %.2f mm/hr\n", mm_per_hr_bucket);
    Serial.printf("Hourly Rainfall: %.2f mm\n", hourly_mm);
    Serial.printf("Daily Rainfall: %.2f mm\n", daily_mm);
    Serial.printf("WiFi Signal: %d dBm\n", WiFi.RSSI());

    // --- BUILD JSON DATA ---
    FirebaseJson jsonData;
    jsonData.set("temperature", temperature);
    jsonData.set("humidity", humidity);
    jsonData.set("rainLevelPercent", rainPercent);
    jsonData.set("rainRaw", rainRaw);
    jsonData.set("rainAdjustedRaw", adjustedRainRaw);
    jsonData.set("rainRateEstimated_mm_hr_bucket", mm_per_hr_bucket);
    jsonData.set("rainfall_total_estimated_mm_bucket", daily_mm);
    jsonData.set("rainfall_hourly_mm", hourly_mm);
    jsonData.set("rainfall_daily_mm", daily_mm);
    jsonData.set("timestamp/.sv", "timestamp");
    jsonData.set("location/lat", DEVICE_LATITUDE);
    jsonData.set("location/lng", DEVICE_LONGITUDE);
    jsonData.set("deviceInfo/wifiRSSI", WiFi.RSSI());
    jsonData.set("deviceInfo/freeHeap", ESP.getFreeHeap());

    // --- PUSH TO HISTORY WITH RETRY ---
    String historyPath = "/sensor_logs";
    bool historySuccess = sendToFirebaseWithRetry(historyPath, &jsonData, true);

    if (historySuccess)
    {
      Serial.println("✓ SUCCESS: Historical data pushed to Firebase.");
    }
    else
    {
      Serial.println("✗ FAILED: Could not push historical data after retries.");
      consecutiveErrors++;
    }

    // --- UPDATE LATEST DATA WITH RETRY ---
    String latestPath = "/sensor_data/latest";
    bool latestSuccess = sendToFirebaseWithRetry(latestPath, &jsonData, false);

    if (latestSuccess)
    {
      Serial.println("✓ SUCCESS: Latest data updated in Firebase.");
      consecutiveErrors = 0; // Reset error counter on success
    }
    else
    {
      Serial.println("✗ FAILED: Could not update latest data after retries.");
      consecutiveErrors++;
    }

    Serial.println("========================================\n");
  }
}