// scripts/backfill-history.js
const admin = require('firebase-admin');

// ⚠️ MAKE SURE YOU HAVE THIS FILE IN THE SCRIPTS FOLDER
const serviceAccount = require('./service-account.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // 👇 I updated this to match your specific database URL
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();

async function backfillData() {
  console.log("🚀 Starting History Backfill...");
  console.log("------------------------------------------------");
  
  // 1. Download the Raw Data
  console.log("📥 Downloading raw 'sensor_logs'... (this might take a minute)");
  
  // Note: If your data is inside a 'Weather' folder, change this to 'Weather/sensor_logs'
  // Based on your image, it looks like it is at the root.
  const snapshot = await db.ref('sensor_logs').once('value');
  
  if (!snapshot.exists()) {
    console.log("❌ No data found in 'sensor_logs'. Check your database path.");
    process.exit(1);
  }

  const rawData = snapshot.val();
  const rawKeys = Object.keys(rawData);
  console.log(`✅ Found ${rawKeys.length} raw records.`);

  // 2. Group Data by Hour
  console.log("⚙️  Calculating hourly averages...");
  const hourlyGroups = {};

  rawKeys.forEach(key => {
    const record = rawData[key];
    if (!record.timestamp) return;

    // Create a unique key for this hour (e.g., "2023-10-25-14")
    const date = new Date(record.timestamp);
    const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;

    if (!hourlyGroups[hourKey]) {
      hourlyGroups[hourKey] = {
        temps: [],
        hums: [],
        rain: 0,
        // Set timestamp to the top of the hour (e.g., 14:00:00)
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0).getTime()
      };
    }

    // Aggregate values
    if (record.temperature !== undefined) hourlyGroups[hourKey].temps.push(Number(record.temperature));
    if (record.humidity !== undefined) hourlyGroups[hourKey].hums.push(Number(record.humidity));
    // Accumulate rainfall
    if (record.rainfall_mm !== undefined) hourlyGroups[hourKey].rain += Number(record.rainfall_mm);
  });

  // 3. Prepare Updates
  const updates = {};
  let count = 0;

  Object.values(hourlyGroups).forEach(group => {
    if (group.temps.length === 0) return;

    const avgTemp = group.temps.reduce((a, b) => a + b, 0) / group.temps.length;
    const avgHum = group.hums.reduce((a, b) => a + b, 0) / group.hums.length;
    
    // Create a new ID based on the timestamp
    const updateId = `hourly_${group.timestamp}`;

    updates[`sensor_logs_hourly/${updateId}`] = {
      timestamp: group.timestamp,
      avgTemperature: Number(avgTemp.toFixed(1)),
      avgHumidity: Number(avgHum.toFixed(1)),
      totalRainfall: Number(group.rain.toFixed(2)),
      recordCount: group.temps.length,
      aggregation_type: 'hourly' // This tag tells the frontend it's optimized data
    };
    count++;
  });

  // 4. Upload to Firebase
  console.log(`📤 Uploading ${count} hourly summaries to 'sensor_logs_hourly'...`);
  await db.ref().update(updates);

  console.log("------------------------------------------------");
  console.log("🎉 BACKFILL COMPLETE!");
  console.log("✅ 'sensor_logs_hourly' has been created.");
  process.exit(0);
}

backfillData().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});