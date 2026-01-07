// C:\Users\PC\Desktop\weather-monitoring-system\scripts\backfill-daily.js
const admin = require('firebase-admin');

// ⚠️ Ensure service-account.json is in the same folder
const serviceAccount = require('./service-account.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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

    // FIXED: Use local date directly, no manual timezone offset
    // JavaScript Date already handles local time correctly
    const date = new Date(Number(record.timestamp));
    
    // Get date components in local time (Philippines)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`; // "2025-01-05"

    if (!dailyGroups[dateKey]) {
      dailyGroups[dateKey] = {
        temps: [],
        hums: [],
        rainRates: [],
        rainfallReadings: [], // Track all rainfall readings for proper calculation
        // FIXED: Use start of day in local time (midnight)
        timestamp: new Date(year, date.getMonth(), date.getDate()).getTime()
      };
    }

    const group = dailyGroups[dateKey];

    // Aggregate Temp & Humidity
    if (record.temperature !== undefined && record.temperature !== null && record.temperature !== '') {
      const temp = Number(record.temperature);
      if (!isNaN(temp)) group.temps.push(temp);
    }
    
    if (record.humidity !== undefined && record.humidity !== null && record.humidity !== '') {
      const hum = Number(record.humidity);
      if (!isNaN(hum)) group.hums.push(hum);
    }

    // FIXED: Aggregate Rain Rate (average of rates, not max)
    const rainRateFields = [
      'rainRateEstimated_mm_hr_bucket',
      'rainRate_mm_hr',
      'rainRate_mm',
      'rainRate'
    ];
    
    for (const field of rainRateFields) {
      if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
        const rate = Number(record[field]);
        if (!isNaN(rate) && rate > 0) {
          group.rainRates.push(rate);
          break; // Use first valid field found
        }
      }
    }

    // FIXED: Track rainfall readings for proper daily total calculation
    const hourlyMm = record.rainfall_hourly_mm || record.rainfall_hourly || record.rain_mm_hour;
    const dailyMm = record.rainfall_daily_mm || 
                    record.rainfall_total_estimated_mm_bucket || 
                    record.rainfall_cumulative_mm;

    if (hourlyMm !== undefined || dailyMm !== undefined) {
      group.rainfallReadings.push({
        timestamp: Number(record.timestamp),
        hourly: hourlyMm ? Number(hourlyMm) : 0,
        daily: dailyMm ? Number(dailyMm) : 0
      });
    }
  });

  // 3. Calculate daily rainfall totals properly
  console.log("⚙️  Calculating daily rainfall totals...");
  
  Object.keys(dailyGroups).forEach(dateKey => {
    const group = dailyGroups[dateKey];
    
    if (group.rainfallReadings.length > 0) {
      // Sort readings by timestamp
      const sorted = group.rainfallReadings.sort((a, b) => a.timestamp - b.timestamp);
      
      const firstDaily = sorted[0].daily;
      const lastDaily = sorted[sorted.length - 1].daily;
      
      // Calculate total rainfall for the day
      if (lastDaily >= firstDaily) {
        // Normal case: daily counter increased
        group.totalRainfall = lastDaily - firstDaily;
      } else {
        // Counter reset case: sum up across resets
        let totalRainfall = 0;
        let previousDaily = firstDaily;

        for (let i = 1; i < sorted.length; i++) {
          const currentDaily = sorted[i].daily;

          if (currentDaily >= previousDaily) {
            totalRainfall += currentDaily - previousDaily;
          } else {
            // Counter reset
            totalRainfall += previousDaily;
            totalRainfall += currentDaily;
          }
          previousDaily = currentDaily;
        }
        group.totalRainfall = totalRainfall;
      }
    } else {
      group.totalRainfall = 0;
    }
  });

  // 4. Prepare Updates for "daily_summaries"
  const updates = {};
  let count = 0;

  Object.keys(dailyGroups).forEach(dateKey => {
    const group = dailyGroups[dateKey];
    
    // Skip if no temperature data (indicates invalid/empty day)
    if (group.temps.length === 0) {
      console.log(`⚠️  Skipping ${dateKey} - no valid data`);
      return;
    }

    const avgTemp = group.temps.reduce((a, b) => a + b, 0) / group.temps.length;
    const avgHum = group.hums.length > 0 
      ? group.hums.reduce((a, b) => a + b, 0) / group.hums.length 
      : 0;
    
    // FIXED: Average rain rate (not max)
    const avgRainRate = group.rainRates.length > 0
      ? group.rainRates.reduce((a, b) => a + b, 0) / group.rainRates.length
      : 0;
    
    updates[`daily_summaries/${dateKey}`] = {
      timestamp: group.timestamp,
      date: dateKey,
      avgTemperature: Number(avgTemp.toFixed(2)),
      avgHumidity: Number(avgHum.toFixed(2)),
      avgRainRate: Number(avgRainRate.toFixed(2)), // Rain rate in mm/hr
      totalRainfall: Number(group.totalRainfall.toFixed(2)), // Total rain in mm
      recordCount: group.temps.length,
      aggregation_type: 'daily'
    };
    count++;
  });

  // 5. Upload to Firebase
  console.log(`📤 Uploading ${count} DAILY summaries...`);
  
  if (count === 0) {
    console.log("⚠️  No summaries to upload!");
    process.exit(0);
  }

  await db.ref().update(updates);

  console.log("------------------------------------------------");
  console.log("🎉 BACKFILL COMPLETE!");
  console.log(`✅ Created ${count} daily summary records`);
  console.log("👉 Your Yearly/Monthly charts should now load instantly.");
  console.log("------------------------------------------------");
  
  // Display sample of what was created
  const sampleKeys = Object.keys(updates).slice(0, 3);
  console.log("\n📊 Sample summaries created:");
  sampleKeys.forEach(key => {
    const data = updates[key];
    console.log(`   ${data.date}: Temp=${data.avgTemperature}°C, Rain=${data.totalRainfall}mm, Records=${data.recordCount}`);
  });
  
  process.exit(0);
}

backfillDaily().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});