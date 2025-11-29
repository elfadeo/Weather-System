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

// --- SENSOR CONFIGURATION ---
#define DHT_SENSOR_PIN 5
#define DHT_SENSOR_TYPE DHT22
#define RAIN_SENSOR_PIN 36

// --- DEVICE LOCATION ---
#define DEVICE_LATITUDE 7.99795
#define DEVICE_LONGITUDE 124.25324

// --- GLOBAL OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht_sensor(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);

// --- TIMING ---
unsigned long sendDataPrevMillis = 0;
unsigned long dataSendInterval = 5000;

// --- RAINFALL ACCUMULATION ---
float total_mm = 0.0;
unsigned long rainLastMillis = 0;

// --- TOKEN STATUS CALLBACK ---
void tokenStatusCallback(TokenInfo info)
{
  if (info.status == token_status_ready)
  {
    Serial.println("Firebase token is ready, streaming data will begin shortly.");
  }
  else
  {
    Serial.printf("Firebase token status: %s\n", info.error.message.c_str());
  }
}

void setup()
{
  Serial.begin(115200);
  dht_sensor.begin();

  // --- CONNECT TO WIFI ---
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // --- TIME SYNCHRONIZATION (Your improved version) ---
  Serial.println("Configuring time...");
  configTime(8 * 3600, 0, "pool.ntp.org"); // GMT+8
  Serial.print("Waiting for time synchronization");

  time_t now = time(nullptr);
  unsigned long start = millis();
  while (now < 24 * 3600 && millis() - start < 30000)
  { // 10-second timeout
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  if (now < 24 * 3600)
  {
    Serial.println("\nFailed to synchronize time!");
  }
  else
  {
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.println(""); // Newline for cleaner output
    Serial.print("Current time: ");
    Serial.print(asctime(&timeinfo));
  }
  // --- END OF TIME SYNC SECTION ---

  // --- FIREBASE CONFIG ---
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  // --- SET USER EMAIL/PASSWORD ---
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // --- START FIREBASE ---
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  rainLastMillis = millis(); // Initialize rain calculation timer
}

void loop()
{
  // Use Firebase.ready() which confirms authentication is complete
  if (Firebase.ready() && (millis() - sendDataPrevMillis > dataSendInterval || sendDataPrevMillis == 0))
  {
    sendDataPrevMillis = millis();

    // --- READ SENSORS ---
    float temperature = dht_sensor.readTemperature();
    float humidity = dht_sensor.readHumidity();

    // --- READ RAIN SENSOR ---
    int rainRaw = analogRead(RAIN_SENSOR_PIN);
    int adjustedRainRaw = 4095 - rainRaw;
    int rainPercent = map(rainRaw, 4095, 0, 0, 100);

    // --- CONVERT TO REALISTIC BUCKETED RAINFALL (mm/hr estimate) ---
    float mm_per_hr_bucket = 0.0;
    if (rainPercent <= 20)
      mm_per_hr_bucket = 0.0;
    else if (rainPercent <= 40)
      mm_per_hr_bucket = 4.0; // ≈2 mm in 30 mins
    else if (rainPercent <= 60)
      mm_per_hr_bucket = 10.0; // ≈5 mm in 30 mins
    else if (rainPercent <= 80)
      mm_per_hr_bucket = 16.0; // ≈8 mm in 30 mins
    else
      mm_per_hr_bucket = 24.0; // ≈12 mm in 30 mins

    // --- ACCUMULATE TOTAL RAINFALL BASED ON ELAPSED TIME ---
    unsigned long now = millis();
    float dt_hours = (now - rainLastMillis) / 3600000.0;
    total_mm += mm_per_hr_bucket * dt_hours;
    rainLastMillis = now;

    if (isnan(temperature) || isnan(humidity))
    {
      Serial.println("Error: Failed to read from DHT sensor!");
      return;
    }

    Serial.println("----------------------------------------");
    Serial.println("Preparing to send data to Firebase...");
    Serial.printf("Temperature: %.2f °C\n", temperature);
    Serial.printf("Humidity: %.2f %%\n", humidity);
    Serial.printf("Rainfall Level (%%): %d %%\n", rainPercent);
    Serial.printf("Rainfall Rate (Est. mm/hr): %.2f mm/hr\n", mm_per_hr_bucket);
    Serial.printf("Total Rainfall (Est. mm): %.2f mm\n", total_mm);

    // --- JSON DATA ---
    FirebaseJson jsonData;
    jsonData.set("temperature", temperature);
    jsonData.set("humidity", humidity);
    jsonData.set("rainLevelPercent", rainPercent);
    jsonData.set("rainRaw", rainRaw);
    jsonData.set("rainAdjustedRaw", adjustedRainRaw);
    jsonData.set("rainRateEstimated_mm_hr_bucket", mm_per_hr_bucket);
    jsonData.set("rainfall_total_estimated_mm_bucket", total_mm);
    jsonData.set("timestamp/.sv", "timestamp");
    jsonData.set("location/lat", DEVICE_LATITUDE);
    jsonData.set("location/lng", DEVICE_LONGITUDE);

    // --- PUSH TO HISTORY ---
    String historyPath = "/sensor_logs";
    if (Firebase.RTDB.pushJSON(&fbdo, historyPath, &jsonData))
    {
      Serial.println("SUCCESS: Historical data pushed to Firebase.");
    }
    else
    {
      Serial.println("FAILED: Could not push historical data. REASON: " + fbdo.errorReason());
    }

    // --- UPDATE LATEST DATA ---
    String latestPath = "/sensor_data/latest";
    if (Firebase.RTDB.setJSON(&fbdo, latestPath, &jsonData))
    {
      Serial.println("SUCCESS: Latest data updated in Firebase.");
    }
    else
    {
      Serial.println("FAILED: Could not update latest data. REASON: " + fbdo.errorReason());
    }

    Serial.println("----------------------------------------");
  }
}