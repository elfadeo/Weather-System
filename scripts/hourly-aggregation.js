// hourly-aggregation.js
// Creates hourly aggregates from raw sensor data
// Runs via GitHub Actions every hour to compress data
//
// What it does:
// 1. Fetches all sensor readings from the previous hour
// 2. Calculates min, max, avg for temperature and humidity
// 3. Sums total rainfall
// 4. Saves compressed hourly record to sensor_logs_hourly
//
// Usage: node hourly-aggregation.js
// Environment: FIREBASE_SERVICE_ACCOUNT_KEY (JSON string from GitHub Secrets)

const admin = require('firebase-admin');

// Initialize Firebase Admin with service account from GitHub Secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
});

const db = admin.database();

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function createHourlyAggregate() {
  console.log('📊 Starting hourly aggregation...');
  console.log(`⏰ Current time: ${new Date().toISOString()}`);
  console.log(`🌏 Manila time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);
  console.log('');
  
  try {
    const now = Date.now();
    
    // Calculate previous hour time range
    const lastHourStart = new Date(now);
    lastHourStart.setMinutes(0, 0, 0);
    lastHourStart.setHours(lastHourStart.getHours() - 1);
    const hourStart = lastHourStart.getTime();
    const hourEnd = hourStart + (60 * 60 * 1000);
    
    const hourKey = formatHourKey(lastHourStart);
    
    console.log('════════════════════════════════════════════════════════');
    console.log('📅 PROCESSING HOUR');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Hour: ${lastHourStart.toISOString()}`);
    console.log(`Key: ${hourKey}`);
    console.log(`Time range: ${new Date(hourStart).toISOString()} to ${new Date(hourEnd).toISOString()}`);
    console.log('');
    
    // Check if aggregate already exists
    const existingAggregate = await db.ref(`sensor_logs_hourly/${hourKey}`).once('value');
    
    if (existingAggregate.exists()) {
      console.log('ℹ️  Hourly aggregate already exists for this hour');
      console.log('   Skipping to avoid duplicate processing');
      console.log('');
      console.log('✅ Check completed (no action needed)');
      process.exit(0);
    }
    
    // Fetch raw data for the hour
    console.log('🔍 Fetching raw sensor data...');
    
    const snapshot = await db.ref('sensor_logs')
      .orderByChild('timestamp')
      .startAt(hourStart)
      .endAt(hourEnd)
      .once('value');
    
    if (!snapshot.exists()) {
      console.log('⚠️  No sensor data found for this hour');
      console.log('');
      console.log('This could mean:');
      console.log('  • Sensor was offline during this hour');
      console.log('  • Data upload was delayed');
      console.log('  • This is the current hour (data not complete yet)');
      console.log('');
      console.log('✅ Check completed (no data to aggregate)');
      process.exit(0);
    }
    
    console.log(`✓ Found sensor data for processing`);
    console.log('');
    
    // Calculate aggregates
    console.log('📊 Calculating aggregates...');
    
    let tempSum = 0, humSum = 0, rainTotal = 0, count = 0;
    let minTemp = Infinity, maxTemp = -Infinity;
    let minHum = Infinity, maxHum = -Infinity;
    
    snapshot.forEach(child => {
      const data = child.val();
      
      if (data.temperature != null) {
        tempSum += data.temperature;
        minTemp = Math.min(minTemp, data.temperature);
        maxTemp = Math.max(maxTemp, data.temperature);
      }
      
      if (data.humidity != null) {
        humSum += data.humidity;
        minHum = Math.min(minHum, data.humidity);
        maxHum = Math.max(maxHum, data.humidity);
      }
      
      if (data.rainfall_hourly_mm != null) {
        rainTotal += data.rainfall_hourly_mm;
      }
      
      count++;
    });
    
    // Prepare hourly aggregate data
    const hourlyData = {
      timestamp: hourStart,
      hour: lastHourStart.toISOString(),
      avgTemperature: count > 0 ? parseFloat((tempSum / count).toFixed(1)) : 0,
      minTemperature: minTemp !== Infinity ? minTemp : 0,
      maxTemperature: maxTemp !== -Infinity ? maxTemp : 0,
      totalRainfall: parseFloat(rainTotal.toFixed(2)),
      avgHumidity: count > 0 ? Math.round(humSum / count) : 0,
      minHumidity: minHum !== Infinity ? minHum : 0,
      maxHumidity: maxHum !== -Infinity ? maxHum : 0,
      recordCount: count
    };
    
    console.log(`✓ Processed ${count} sensor readings`);
    console.log('');
    
    // Save to database
    console.log('💾 Saving hourly aggregate to database...');
    
    await db.ref(`sensor_logs_hourly/${hourKey}`).set(hourlyData);
    
    console.log(`✅ Hourly aggregate saved: ${hourKey}`);
    console.log('');
    
    // Display summary
    console.log('════════════════════════════════════════════════════════');
    console.log('📊 HOURLY AGGREGATE SUMMARY');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Hour: ${hourlyData.hour}`);
    console.log(`Records: ${hourlyData.recordCount}`);
    console.log('');
    console.log('🌡️  Temperature:');
    console.log(`   Min: ${hourlyData.minTemperature}°C`);
    console.log(`   Max: ${hourlyData.maxTemperature}°C`);
    console.log(`   Avg: ${hourlyData.avgTemperature}°C`);
    console.log('');
    console.log('💧 Humidity:');
    console.log(`   Min: ${hourlyData.minHumidity}%`);
    console.log(`   Max: ${hourlyData.maxHumidity}%`);
    console.log(`   Avg: ${hourlyData.avgHumidity}%`);
    console.log('');
    console.log('🌧️  Rainfall:');
    console.log(`   Total: ${hourlyData.totalRainfall}mm`);
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ Hourly aggregation completed successfully!');
    console.log('════════════════════════════════════════════════════════');
    
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('════════════════════════════════════════════════════════');
    console.error('❌ HOURLY AGGREGATION FAILED');
    console.error('════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('════════════════════════════════════════════════════════');
    
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format hour key for database storage
 * Format: YYYY-MM-DD_HH
 * Example: 2025-01-05_14
 */
function formatHourKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hour}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN THE AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════

createHourlyAggregate();