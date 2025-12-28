#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

// --- IMPORTANT: CREDENTIALS MOVED TO SEPARATE FILE ---
// Create a file named "secrets.h" and define your credentials there.
#include "secrets.h"

// --- FIREBASE AUTH USER ---
#define USER_EMAIL "ponce.rn952@s.msumain.edu.ph"
#define USER_PASSWORD "Norhaina091402"

// --- SENSOR CONFIGURATION ---
#define DHT_SENSOR_PIN 5
#define DHT_SENSOR_TYPE DHT22
#define RAIN_SENSOR_PIN 36

// --- DEVICE LOCATION ---
#define DEVICE_LATITUDE 8.07847
#define DEVICE_LONGITUDE 124.22370

// --- ENHANCED SETTINGS ---
#define WIFI_RETRY_DELAY 500
#define WIFI_MAX_RETRIES 20
#define FIREBASE_RETRY_ATTEMPTS 3
#define SENSOR_SAMPLES 3

// --- MONITORING MODE CONFIGURATION ---
#define MONITORING_MODE_RESEARCH // Comment this out for 5-minute intervals

#ifdef MONITORING_MODE_RESEARCH
#define DATA_INTERVAL 60000
#define MODE_NAME "RESEARCH MODE: 1-minute intervals"
#else
#define DATA_INTERVAL 300000
#define MODE_NAME "PRODUCTION MODE: 5-minute intervals"
#endif

// --- CLEANUP CONFIGURATION ---
#define DASHBOARD_MAX_RECORDS 10000
#define CLEANUP_CHECK_INTERVAL 3600000 // Check every hour instead of daily
#define CLEANUP_BATCH_SIZE 50          // Delete in smaller batches

// --- GLOBAL OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht_sensor(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);

// --- TIMING ---
unsigned long sendDataPrevMillis = 0;
unsigned long dataSendInterval = DATA_INTERVAL;
unsigned long wifiCheckPrevMillis = 0;
unsigned long wifiCheckInterval = 30000;
unsigned long dashboardCleanupPrevMillis = 0;

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
    return;

  struct tm timeinfo;
  localtime_r(&now, &timeinfo);

  if (timeinfo.tm_hour != lastResetHour)
  {
    if (lastResetHour != -1)
    {
      Serial.printf("\n[RESET] Hourly rainfall: %.2f mm\n", hourly_mm);
    }
    hourly_mm = 0.0;
    lastResetHour = timeinfo.tm_hour;
  }

  if (timeinfo.tm_mday != lastResetDay)
  {
    if (lastResetDay != -1)
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
        delay(1000 * attempt);
      }
    }
  }
  return false;
}

// --- IMPROVED DASHBOARD DATA CLEANUP ---
void cleanupDashboardData()
{
  Serial.println("\n========================================");
  Serial.println("DASHBOARD CLEANUP STARTED");
  Serial.println("========================================");

  // Use shallow query to get only keys and timestamps
  FirebaseData countFbdo;

  // Query ordered by timestamp, get all keys
  if (!Firebase.RTDB.getJSON(&countFbdo, "/sensor_logs_dashboard?shallow=true"))
  {
    Serial.printf("✗ Failed to check dashboard: %s\n", countFbdo.errorReason().c_str());
    return;
  }

  FirebaseJson &json = countFbdo.jsonObject();
  size_t recordCount = json.iteratorBegin();

  Serial.printf("Dashboard records: %d (limit: %d)\n", recordCount, DASHBOARD_MAX_RECORDS);

  if (recordCount <= DASHBOARD_MAX_RECORDS)
  {
    Serial.println("✓ Dashboard within limit, no cleanup needed");
    json.iteratorEnd();
    return;
  }

  // Calculate how many to delete
  int toDelete = recordCount - DASHBOARD_MAX_RECORDS;
  Serial.printf("Need to remove %d oldest records\n", toDelete);

  // Get records with timestamp to identify oldest
  FirebaseData queryFbdo;
  String queryPath = "/sensor_logs_dashboard?orderBy=\"timestamp\"&limitToFirst=" + String(toDelete);

  if (!Firebase.RTDB.getJSON(&queryFbdo, queryPath))
  {
    Serial.printf("✗ Failed to query old records: %s\n", queryFbdo.errorReason().c_str());
    json.iteratorEnd();
    return;
  }

  FirebaseJson &oldRecords = queryFbdo.jsonObject();
  size_t oldRecordCount = oldRecords.iteratorBegin();

  Serial.printf("Fetched %d old records for deletion\n", oldRecordCount);

  // Delete in batches
  int deleted = 0;
  int batchCount = 0;

  for (size_t i = 0; i < oldRecordCount; i++)
  {
    FirebaseJson::IteratorValue value = oldRecords.valueAt(i);
    String key = value.key;

    if (Firebase.RTDB.deleteNode(&fbdo, "/sensor_logs_dashboard/" + key))
    {
      deleted++;

      // Progress indicator every 10 deletions
      if (deleted % 10 == 0)
      {
        Serial.printf("Progress: %d/%d deleted\n", deleted, toDelete);
      }
    }
    else
    {
      Serial.printf("✗ Failed to delete %s: %s\n", key.c_str(), fbdo.errorReason().c_str());
    }

    // Batch delay to prevent overwhelming Firebase
    if (++batchCount >= CLEANUP_BATCH_SIZE)
    {
      Serial.println("Batch complete, pausing...");
      delay(2000); // Wait 2 seconds between batches
      batchCount = 0;
    }
  }

  oldRecords.iteratorEnd();
  json.iteratorEnd();

  Serial.printf("\n✓ Cleanup complete: Removed %d records\n", deleted);
  Serial.printf("Estimated remaining: %d records\n", recordCount - deleted);
  Serial.println("========================================\n");
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("  IOT WEATHER MONITORING SYSTEM v2.3");
  Serial.println("  Rice Cultivation - Brgy. Angayen");
  Serial.println("  Balo-I, Lanao del Norte");
  Serial.println("========================================");
  Serial.println(MODE_NAME);
  Serial.printf("Data interval: %lu ms (%.1f minutes)\n",
                dataSendInterval, dataSendInterval / 60000.0);
  Serial.printf("Cleanup check interval: %lu ms (%.1f hours)\n",
                CLEANUP_CHECK_INTERVAL, CLEANUP_CHECK_INTERVAL / 3600000.0);
  Serial.println("DUAL STORAGE ENABLED:");
  Serial.println("  /sensor_logs - All research data (permanent)");
  Serial.println("  /sensor_logs_dashboard - Last 10k for UI (auto-cleaned)");
  Serial.println("========================================\n");

  dht_sensor.begin();

  if (!connectToWiFi())
  {
    Serial.println("CRITICAL: Cannot proceed without WiFi. Restarting in 10s...");
    delay(10000);
    ESP.restart();
  }

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

    lastResetHour = timeinfo.tm_hour;
    lastResetDay = timeinfo.tm_mday;
  }

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

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

    checkAndResetRainfall();

    float temperature = readTemperatureAvg();
    float humidity = readHumidityAvg();
    int rainRaw = readRainSensorAvg();

    if (isnan(temperature) || isnan(humidity))
    {
      Serial.println("✗ Error: Failed to read from DHT sensor!");
      consecutiveErrors++;
      return;
    }

    int adjustedRainRaw = 4095 - rainRaw;
    int rainPercent = map(rainRaw, 4095, 0, 0, 100);
    rainPercent = constrain(rainPercent, 0, 100);

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

    unsigned long now = millis();
    float dt_hours = (now - rainLastMillis) / 3600000.0;
    float increment = mm_per_hr_bucket * dt_hours;
    hourly_mm += increment;
    daily_mm += increment;
    rainLastMillis = now;

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
    Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());

    // BUILD JSON DATA
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

    // --- SAVE TO RESEARCH DATABASE (ALL DATA - NEVER DELETED) ---
    String fullDataPath = "/sensor_logs";
    bool fullSuccess = sendToFirebaseWithRetry(fullDataPath, &jsonData, true);

    if (fullSuccess)
    {
      Serial.println("✓ SUCCESS: Research data saved (/sensor_logs)");
    }
    else
    {
      Serial.println("✗ FAILED: Could not save research data");
      consecutiveErrors++;
    }

    // --- SAVE TO DASHBOARD DATABASE (OPTIMIZED FOR UI - AUTO-CLEANED) ---
    String dashboardPath = "/sensor_logs_dashboard";
    bool dashSuccess = sendToFirebaseWithRetry(dashboardPath, &jsonData, true);

    if (dashSuccess)
    {
      Serial.println("✓ SUCCESS: Dashboard data saved (/sensor_logs_dashboard)");
    }
    else
    {
      Serial.println("✗ FAILED: Could not save dashboard data");
    }

    // --- UPDATE LATEST DATA ---
    String latestPath = "/sensor_data/latest";
    bool latestSuccess = sendToFirebaseWithRetry(latestPath, &jsonData, false);

    if (latestSuccess)
    {
      Serial.println("✓ SUCCESS: Latest data updated");
      consecutiveErrors = 0;
    }
    else
    {
      Serial.println("✗ FAILED: Could not update latest data");
      consecutiveErrors++;
    }

    Serial.println("========================================\n");
  }

  // --- PERIODIC DASHBOARD CLEANUP (EVERY HOUR) ---
  if (millis() - dashboardCleanupPrevMillis > CLEANUP_CHECK_INTERVAL)
  {
    dashboardCleanupPrevMillis = millis();

    // Only cleanup if we have good WiFi and Firebase is ready
    if (WiFi.status() == WL_CONNECTED && Firebase.ready())
    {
      cleanupDashboardData();
    }
    else
    {
      Serial.println("⚠ Skipping cleanup - WiFi or Firebase not ready");
    }
  }
}