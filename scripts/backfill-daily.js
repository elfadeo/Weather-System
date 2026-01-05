// C:\Users\PC\Desktop\weather-monitoring-system\scripts\backfill-daily.js
const admin = require('firebase-admin');

// ⚠️ Ensure service-account.json is in the same folder (You already have this!)
const serviceAccount = require('./service-account.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // ⚠️ YOUR DATABASE URL
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();

async function backfillDaily() {
  console.log("🚀 Starting DAILY Summary Backfill (For Yearly Charts)...");
  console.log("------------------------------------------------");
  
  // 1. Download Raw Data
  console.log("📥 Downloading raw 'sensor_logs'...");
  const snapshot = await db.ref('sensor_logs').once('value');
  
  if (!snapshot.exists()) {
    console.log("❌ No data found in 'sensor_logs'.");
    process.exit(1);
  }

  const rawData = snapshot.val();
  const rawKeys = Object.keys(rawData);
  console.log(`✅ Found ${rawKeys.length} raw records.`);

  // 2. Group Data by DAY (YYYY-MM-DD)
  console.log("⚙️  Calculating DAILY averages & totals...");
  const dailyGroups = {};

  rawKeys.forEach(key => {
    const record = rawData[key];
    if (!record.timestamp) return;

    // Create a unique key for this DAY
    // Note: We use 'en-CA' to get YYYY-MM-DD format easily in local time
    // Or we manually construct it to ensure consistency
    const date = new Date(record.timestamp);
    // Adjust to Philippines Time (UTC+8) if your timestamps are UTC
    // If your timestamps are already local, just use them directly.
    // Assuming Timestamp is UTC ms, let's offset to ensure 12:00 AM PHT cuts correctly
    const phtOffset = 8 * 60 * 60 * 1000;
    const phtDate = new Date(record.timestamp + phtOffset);
    
    const dateKey = phtDate.toISOString().split('T')[0]; // "2025-09-01"

    if (!dailyGroups[dateKey]) {
      dailyGroups[dateKey] = {
        temps: [],
        hums: [],
        rainMax: 0,
        // Set timestamp to Noon of that day to avoid timezone edge cases on charts
        timestamp: new Date(dateKey + 'T12:00:00+08:00').getTime() 
      };
    }

    // Aggregate Temp & Humidity
    if (record.temperature !== undefined) dailyGroups[dateKey].temps.push(Number(record.temperature));
    if (record.humidity !== undefined) dailyGroups[dateKey].hums.push(Number(record.humidity));

    // Aggregate Rainfall (Max value logic for cumulative buckets)
    if (record.rainfall_total_estimated_mm_bucket !== undefined) {
      const val = Number(record.rainfall_total_estimated_mm_bucket);
      if (val > dailyGroups[dateKey].rainMax) {
        dailyGroups[dateKey].rainMax = val;
      }
    }
  });

  // 3. Prepare Updates for "daily_summaries"
  const updates = {};
  let count = 0;

  Object.keys(dailyGroups).forEach(dateKey => {
    const group = dailyGroups[dateKey];
    if (group.temps.length === 0) return;

    const avgTemp = group.temps.reduce((a, b) => a + b, 0) / group.temps.length;
    const avgHum = group.hums.reduce((a, b) => a + b, 0) / group.hums.length;
    
    // We save directly to "daily_summaries/YYYY-MM-DD"
    updates[`daily_summaries/${dateKey}`] = {
      timestamp: group.timestamp,
      date: dateKey,
      avgTemperature: Number(avgTemp.toFixed(2)),
      avgHumidity: Number(avgHum.toFixed(2)),
      totalRainfall: Number(group.rainMax.toFixed(2)), 
      recordCount: group.temps.length,
      aggregation_type: 'daily'
    };
    count++;
  });

  // 4. Upload to Firebase
  console.log(`📤 Uploading ${count} DAILY summaries...`);
  await db.ref().update(updates);

  console.log("------------------------------------------------");
  console.log("🎉 BACKFILL COMPLETE!");
  console.log("👉 Your Yearly/Monthly charts should now load instantly.");
  process.exit(0);
}

backfillDaily().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});