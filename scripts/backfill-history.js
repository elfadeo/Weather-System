// C:\Users\PC\Desktop\weather-monitoring-system\scripts\backfill-history.js
const admin = require('firebase-admin');

// ⚠️ Ensure service-account.json is in the same folder
const serviceAccount = require('./service-account.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app" 
});

const db = admin.database();

async function backfillData() {
  console.log("🚀 Starting History Backfill (Hourly Aggregates)...");
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
  console.log("⚙️  Calculating hourly averages & totals...");
  const hourlyGroups = {};

  rawKeys.forEach(key => {
    const record = rawData[key];
    if (!record.timestamp) return;

    // FIXED: Create proper hour key using local time components
    const date = new Date(Number(record.timestamp));
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    
    const hourKey = `${year}-${month}-${day}-${hour}`;

    if (!hourlyGroups[hourKey]) {
      hourlyGroups[hourKey] = {
        temps: [],
        hums: [],
        rates: [], // Rain rates in mm/hr
        rainfallReadings: [], // FIXED: Track all rainfall readings
        // FIXED: Proper timestamp for start of hour
        timestamp: new Date(year, month, day, hour, 0, 0).getTime()
      };
    }

    const group = hourlyGroups[hourKey];

    // Aggregate Temp & Humidity
    if (record.temperature !== undefined && record.temperature !== null && record.temperature !== '') {
      const temp = Number(record.temperature);
      if (!isNaN(temp)) group.temps.push(temp);
    }
    
    if (record.humidity !== undefined && record.humidity !== null && record.humidity !== '') {
      const hum = Number(record.humidity);
      if (!isNaN(hum)) group.hums.push(hum);
    }

    // FIXED: Aggregate Rain Rate - check multiple possible field names
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
          group.rates.push(rate);
          break; // Use first valid field found
        }
      }
    }

    // FIXED: Collect all rainfall readings for proper calculation
    const timestamp = Number(record.timestamp);
    const hourlyMm = Number(
      record.rainfall_hourly_mm || record.rainfall_hourly || record.rain_mm_hour || 0
    );
    const dailyMm = Number(
      record.rainfall_daily_mm || 
      record.rainfall_total_estimated_mm_bucket || 
      record.rainfall_cumulative_mm || 0
    );

    if (!isNaN(timestamp) && (hourlyMm > 0 || dailyMm > 0)) {
      group.rainfallReadings.push({
        timestamp,
        hourly: isNaN(hourlyMm) ? 0 : hourlyMm,
        daily: isNaN(dailyMm) ? 0 : dailyMm
      });
    }
  });

  // 3. Calculate Hourly Totals & Prepare Updates
  console.log("⚙️  Processing hourly groups...");
  const updates = {};
  let count = 0;
  let skipped = 0;

  Object.entries(hourlyGroups).forEach(([hourKey, group]) => {
    if (group.temps.length === 0) {
      skipped++;
      return;
    }

    // Calculate averages
    const avgTemp = group.temps.reduce((a, b) => a + b, 0) / group.temps.length;
    const avgHum = group.hums.reduce((a, b) => a + b, 0) / group.hums.length;
    
    // FIXED: Calculate Average Rain Rate (not sum, not max)
    let avgRate = 0;
    if (group.rates.length > 0) {
      avgRate = group.rates.reduce((a, b) => a + b, 0) / group.rates.length;
    }

    // FIXED: Calculate hourly rainfall total properly
    let hourlyRainfall = 0;
    
    if (group.rainfallReadings.length > 0) {
      // Sort by timestamp
      const sorted = group.rainfallReadings.sort((a, b) => a.timestamp - b.timestamp);
      
      // For hourly aggregation: take the maximum hourly value
      // (the hourly counter shows mm accumulated in that specific hour)
      const hourlyValues = sorted.map(r => r.hourly).filter(v => v > 0);
      
      if (hourlyValues.length > 0) {
        // Take the maximum value (final accumulated amount for this hour)
        hourlyRainfall = Math.max(...hourlyValues);
      }
    }

    // Format the update ID to match the expected format
    const updateId = `hourly_${group.timestamp}`;

    updates[`sensor_logs_hourly/${updateId}`] = {
      timestamp: group.timestamp,
      aggregation_type: 'hourly',
      
      // Temperature
      avgTemperature: Number(avgTemp.toFixed(2)),
      
      // Humidity
      avgHumidity: Number(avgHum.toFixed(2)),
      
      // Rain Rate (average of all readings in mm/hr)
      avgRainRate: Number(avgRate.toFixed(2)),
      
      // Total Rainfall (maximum hourly value in mm)
      totalRainfall: Number(hourlyRainfall.toFixed(2)),
      
      // Metadata
      recordCount: group.temps.length,
      rainfallReadings: group.rainfallReadings.length,
      generatedAt: admin.database.ServerValue.TIMESTAMP
    };
    count++;
  });

  console.log(`✓ Processed ${count} hourly summaries`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} hours with no data`);
  }

  // 4. Upload to Firebase
  console.log(`📤 Uploading ${count} hourly summaries to Firebase...`);
  
  if (count === 0) {
    console.log("⚠️  No summaries to upload!");
    process.exit(0);
  }

  await db.ref().update(updates);

  console.log("------------------------------------------------");
  console.log("🎉 BACKFILL COMPLETE!");
  console.log(`✅ Created ${count} hourly summary records`);
  console.log("👉 Refresh your Report. Data should now be accurate!");
  console.log("------------------------------------------------");
  
  // Display sample of what was created
  const sampleKeys = Object.keys(updates).slice(0, 3);
  console.log("\n📊 Sample summaries created:");
  sampleKeys.forEach(key => {
    const data = updates[key];
    const date = new Date(data.timestamp);
    console.log(`   ${date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    })}: Temp=${data.avgTemperature}°C, Rain=${data.totalRainfall}mm, Rate=${data.avgRainRate}mm/hr`);
  });
  
  process.exit(0);
}

backfillData().catch(error => {
  console.error("❌ Error:", error);
  process.exit(1);
});