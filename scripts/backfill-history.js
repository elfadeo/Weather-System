const admin = require('firebase-admin');
// Ensure this file exists in your scripts folder!
const serviceAccount = require('./service-account.json'); 

// Initialize with YOUR specific database URL
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function backfillHistory(daysBack) {
  console.log(`🚀 Starting backfill for the last ${daysBack} days...`);
  
  const now = Date.now();
  const MS_PER_HOUR = 3600 * 1000;
  
  // Start from X days ago, rounded down to the nearest hour
  let currentStart = Math.floor((now - (daysBack * 24 * MS_PER_HOUR)) / MS_PER_HOUR) * MS_PER_HOUR;

  let processedCount = 0;
  
  while (currentStart < now) {
    const currentEnd = currentStart + MS_PER_HOUR;
    
    // 1. Fetch RAW data for this specific hour
    const snapshot = await db.ref('sensor_logs')
      .orderByChild('timestamp')
      .startAt(currentStart)
      .endAt(currentEnd)
      .once('value');
    
    if (snapshot.exists()) {
      let tempSum = 0, humSum = 0, rainSum = 0, count = 0;
      
      snapshot.forEach(child => {
        const v = child.val();
        // Summing up values
        if (v.temperature) { tempSum += Number(v.temperature); count++; }
        if (v.humidity) humSum += Number(v.humidity);
        // For rainfall, we take the max cumulative reading in that hour
        if (v.rainfall_hourly_mm) rainSum = Math.max(rainSum, Number(v.rainfall_hourly_mm));
      });

      if (count > 0) {
        // 2. Save the lightweight "Aggregated" record
        await db.ref('sensor_logs_hourly').child(`${currentStart}`).set({
          timestamp: currentStart,
          avgTemperature: parseFloat((tempSum / count).toFixed(2)),
          avgHumidity: Math.round(humSum / count),
          totalRainfall: rainSum,
          recordCount: count,
          aggregation_type: 'hourly' // This flag tells the frontend it's optimized data
        });
        process.stdout.write(`✅`); // Success dot
      }
    } else {
      process.stdout.write(`.`); // No data for this hour
    }
    
    currentStart += MS_PER_HOUR;
    processedCount++;
    if (processedCount % 24 === 0) console.log(` (${(processedCount/24).toFixed(0)} days processed)`);
  }

  console.log("\n🎉 Backfill Complete! Now refresh your dashboard.");
  process.exit(0);
}

// Run for the last 35 days
backfillHistory(35);