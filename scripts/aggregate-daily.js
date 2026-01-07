// scripts/aggregate-daily.js
const admin = require('firebase-admin');

// 1. Initialize Firebase (Uses the Service Account from GitHub Secrets)
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('❌ FATAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT.');
  console.error('Please check if the secret is correctly added to GitHub Actions.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function runAggregation() {
  console.log('🚀 Build started: Calculating Daily Summaries...');

  // 2. Calculate "Yesterday" in PHT (UTC+8)
  // FIXED: Use proper timezone handling
  const nowUtc = new Date();
  
  // Convert to PHT by creating date in Asia/Manila timezone
  const phtDateString = nowUtc.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  const nowPht = new Date(phtDateString);
  
  // Get yesterday in PHT
  const yesterday = new Date(nowPht);
  yesterday.setDate(nowPht.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(yesterday);
  endOfDay.setHours(23, 59, 59, 999);
  
  const startTs = yesterday.getTime();
  const endTs = endOfDay.getTime();
  
  // Format date key: YYYY-MM-DD (in PHT)
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  console.log(`📅 Target Date (PHT): ${dateKey}`);
  console.log(`⏰ Range: ${new Date(startTs).toLocaleString('en-US', { timeZone: 'Asia/Manila' })} to ${new Date(endTs).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);

  // 3. Fetch Raw Data
  console.log('📥 Fetching sensor data...');
  const snapshot = await db.ref('sensor_logs')
    .orderByChild('timestamp')
    .startAt(startTs)
    .endAt(endTs)
    .once('value');

  if (!snapshot.exists()) {
    console.log('⚠️  No data found for yesterday.');
    process.exit(0);
  }

  const records = Object.values(snapshot.val());
  console.log(`✅ Found ${records.length} records.`);

  // 4. Mathematical Aggregation
  let tempSum = 0, humSum = 0;
  let tempCount = 0, humCount = 0;
  let rainRateSum = 0, rainRateCount = 0;
  
  // FIXED: Track rainfall readings for proper calculation
  const rainfallReadings = [];

  records.forEach(r => {
    // Temp & Humidity Average
    const t = parseFloat(r.temperature);
    const h = parseFloat(r.humidity);
    if (!isNaN(t)) { tempSum += t; tempCount++; }
    if (!isNaN(h)) { humSum += h; humCount++; }

    // FIXED: Rain Rate Average (not max)
    const rainRateFields = [
      'rainRateEstimated_mm_hr_bucket',
      'rainRate_mm_hr',
      'rainRate_mm',
      'rainRate'
    ];
    
    for (const field of rainRateFields) {
      const rate = parseFloat(r[field]);
      if (!isNaN(rate) && rate > 0) {
        rainRateSum += rate;
        rainRateCount++;
        break; // Use first valid field found
      }
    }

    // FIXED: Collect all rainfall readings for proper daily total calculation
    const timestamp = parseInt(r.timestamp);
    const hourlyMm = parseFloat(
      r.rainfall_hourly_mm || r.rainfall_hourly || r.rain_mm_hour || 0
    );
    const dailyMm = parseFloat(
      r.rainfall_daily_mm || 
      r.rainfall_total_estimated_mm_bucket || 
      r.rainfall_cumulative_mm || 0
    );

    if (!isNaN(timestamp) && (hourlyMm > 0 || dailyMm > 0)) {
      rainfallReadings.push({
        timestamp,
        hourly: isNaN(hourlyMm) ? 0 : hourlyMm,
        daily: isNaN(dailyMm) ? 0 : dailyMm
      });
    }
  });

  // FIXED: Calculate daily rainfall total properly
  let dailyRainfall = 0;
  
  if (rainfallReadings.length > 0) {
    // Sort by timestamp
    const sorted = rainfallReadings.sort((a, b) => a.timestamp - b.timestamp);
    
    const firstDaily = sorted[0].daily;
    const lastDaily = sorted[sorted.length - 1].daily;
    
    console.log(`🌧️  Rainfall calculation: first=${firstDaily}mm, last=${lastDaily}mm`);
    
    if (lastDaily >= firstDaily) {
      // Normal case: counter increased
      dailyRainfall = lastDaily - firstDaily;
    } else {
      // Counter reset case: sum up across resets
      let totalRainfall = 0;
      let previousDaily = firstDaily;

      for (let i = 1; i < sorted.length; i++) {
        const currentDaily = sorted[i].daily;

        if (currentDaily >= previousDaily) {
          // Normal increment
          totalRainfall += currentDaily - previousDaily;
        } else {
          // Counter reset detected
          totalRainfall += previousDaily; // Add what accumulated before reset
          totalRainfall += currentDaily;  // Add new counter value
          console.log(`⚠️  Counter reset detected at index ${i}`);
        }
        previousDaily = currentDaily;
      }
      dailyRainfall = totalRainfall;
    }
  }

  // Calculate averages
  const avgTemp = tempCount > 0 ? (tempSum / tempCount) : 0;
  const avgHum = humCount > 0 ? (humSum / humCount) : 0;
  const avgRainRate = rainRateCount > 0 ? (rainRateSum / rainRateCount) : 0;

  const summary = {
    timestamp: startTs,
    date: dateKey,
    aggregation_type: 'daily',
    avgTemperature: Number(avgTemp.toFixed(2)),
    avgHumidity: Number(avgHum.toFixed(2)),
    avgRainRate: Number(avgRainRate.toFixed(2)), // Average rain rate in mm/hr
    totalRainfall: Number(dailyRainfall.toFixed(2)), // Total rainfall in mm
    recordCount: records.length,
    rainfallReadings: rainfallReadings.length, // How many rainfall data points
    generatedAt: admin.database.ServerValue.TIMESTAMP
  };

  // 5. Save to "daily_summaries"
  console.log('💾 Saving summary...');
  console.log(`   📊 Avg Temp: ${summary.avgTemperature}°C`);
  console.log(`   💧 Avg Humidity: ${summary.avgHumidity}%`);
  console.log(`   🌧️  Total Rainfall: ${summary.totalRainfall}mm`);
  console.log(`   💨 Avg Rain Rate: ${summary.avgRainRate}mm/hr`);
  console.log(`   📝 Records: ${summary.recordCount}`);
  
  await db.ref(`daily_summaries/${dateKey}`).set(summary);
  console.log(`✅ SUCCESS: Saved summary for ${dateKey}`);
  console.log('------------------------------------------------');
  
  process.exit(0);
}

runAggregation().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});