// scripts/aggregate-daily.js
const admin = require('firebase-admin');

// 1. Initialize Firebase (Uses the Service Account from GitHub Secrets)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app" // ⚠️ REPLACE WITH YOUR ACTUAL DATABASE URL
});

const db = admin.database();

async function runAggregation() {
  console.log('Build started: Calculating Daily Summaries...');

  // 2. Calculate "Yesterday" in PHT (UTC+8)
  // GitHub Runners are in UTC. We add 8 hours to get PHT, then subtract 1 day.
  const nowUtc = new Date();
  const phtOffset = 8 * 60 * 60 * 1000;
  const nowPht = new Date(nowUtc.getTime() + phtOffset);
  
  const yesterday = new Date(nowPht);
  yesterday.setDate(nowPht.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const startTs = yesterday.getTime(); // Yesterday 00:00 PHT
  const endTs = startTs + (24 * 60 * 60 * 1000) - 1; // Yesterday 23:59:59 PHT
  
  // Format date key: YYYY-MM-DD
  const dateKey = yesterday.toISOString().split('T')[0];

  console.log(`Target Date (PHT): ${dateKey}`);
  console.log(`Range: ${startTs} to ${endTs}`);

  // 3. Fetch Raw Data
  const snapshot = await db.ref('sensor_logs')
    .orderByChild('timestamp')
    .startAt(startTs)
    .endAt(endTs)
    .once('value');

  if (!snapshot.exists()) {
    console.log('⚠️ No data found for yesterday.');
    process.exit(0);
  }

  const records = Object.values(snapshot.val());
  console.log(`Found ${records.length} records.`);

  // 4. Mathematical Aggregation
  let tempSum = 0, humSum = 0;
  let tempCount = 0, humCount = 0;
  let maxRainBucket = 0;
  let minRainBucket = 999999;

  records.forEach(r => {
    // Temp & Humidity Average
    const t = parseFloat(r.temperature);
    const h = parseFloat(r.humidity);
    if (!isNaN(t)) { tempSum += t; tempCount++; }
    if (!isNaN(h)) { humSum += h; humCount++; }

    // Rainfall Logic
    const rain = parseFloat(r.rainfall_total_estimated_mm_bucket || 0);
    if (!isNaN(rain)) {
        if (rain > maxRainBucket) maxRainBucket = rain;
        if (rain < minRainBucket) minRainBucket = rain;
    }
  });

  // Calculate actual rain that fell today (Max - Min)
  // Note: This logic assumes the bucket resets or accumulates. 
  // If it reset to 0 in the middle of the day, this simple logic handles the bulk.
  let dailyRain = 0;
  if (records.length > 0) {
      dailyRain = maxRainBucket; // Simplified: Assuming bucket resets daily or is the total for the day
  }

  const summary = {
    timestamp: startTs,
    date: dateKey,
    aggregation_type: 'daily',
    avgTemperature: tempCount ? (tempSum / tempCount).toFixed(2) : 0,
    avgHumidity: humCount ? (humSum / humCount).toFixed(2) : 0,
    totalRainfall: dailyRain.toFixed(2),
    readingsCount: records.length,
    generatedAt: admin.database.ServerValue.TIMESTAMP
  };

  // 5. Save to "daily_summaries"
  await db.ref(`daily_summaries/${dateKey}`).set(summary);
  console.log(`✅ SUCCESS: Saved summary for ${dateKey}`);
  
  process.exit(0);
}

runAggregation().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});