const admin = require('firebase-admin');

// ⚠️ Ensure service-account.json is in the same folder
const serviceAccount = require('./service-account.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // ⚠️ YOUR DATABASE URL
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();

async function backfillData() {
  console.log("🚀 Starting History Backfill (Including Rain Rate)...");
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

  // 2. Group Data by Hour
  console.log("⚙️  Calculating hourly averages & rates...");
  const hourlyGroups = {};

  rawKeys.forEach(key => {
    const record = rawData[key];
    if (!record.timestamp) return;

    // Create a unique key for this hour
    const date = new Date(record.timestamp);
    const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;

    if (!hourlyGroups[hourKey]) {
      hourlyGroups[hourKey] = {
        temps: [],
        hums: [],
        rates: [], // 🆕 Array to store rain rates
        rainMax: 0,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0).getTime()
      };
    }

    // Aggregate Temp & Humidity
    if (record.temperature !== undefined) hourlyGroups[hourKey].temps.push(Number(record.temperature));
    if (record.humidity !== undefined) hourlyGroups[hourKey].hums.push(Number(record.humidity));

    // 🆕 Aggregate Rain Rate (mm/hr)
    if (record.rainRateEstimated_mm_hr_bucket !== undefined) {
      hourlyGroups[hourKey].rates.push(Number(record.rainRateEstimated_mm_hr_bucket));
    }

    // Aggregate Total Rainfall (Max value logic)
    if (record.rainfall_hourly_mm !== undefined) {
      const val = Number(record.rainfall_hourly_mm);
      if (val > hourlyGroups[hourKey].rainMax) {
        hourlyGroups[hourKey].rainMax = val;
      }
    }
  });

  // 3. Prepare Updates
  const updates = {};
  let count = 0;

  Object.values(hourlyGroups).forEach(group => {
    if (group.temps.length === 0) return;

    const avgTemp = group.temps.reduce((a, b) => a + b, 0) / group.temps.length;
    const avgHum = group.hums.reduce((a, b) => a + b, 0) / group.hums.length;
    
    // 🆕 Calculate Average Rain Rate
    let avgRate = 0;
    if (group.rates.length > 0) {
      avgRate = group.rates.reduce((a, b) => a + b, 0) / group.rates.length;
    }

    const updateId = `hourly_${group.timestamp}`;

    updates[`sensor_logs_hourly/${updateId}`] = {
      timestamp: group.timestamp,
      avgTemperature: Number(avgTemp.toFixed(1)),
      avgHumidity: Number(avgHum.toFixed(1)),
      
      // 🆕 Now we save the Rain Rate!
      avgRainRate: Number(avgRate.toFixed(1)),
      
      totalRainfall: Number(group.rainMax.toFixed(2)), 
      recordCount: group.temps.length,
      aggregation_type: 'hourly'
    };
    count++;
  });

  // 4. Upload to Firebase
  console.log(`📤 Uploading ${count} hourly summaries...`);
  await db.ref().update(updates);

  console.log("------------------------------------------------");
  console.log("🎉 BACKFILL COMPLETE!");
  console.log("👉 Refresh your Report. 'Rain Rate' should now appear!");
  process.exit(0);
}

backfillData().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});