// database-maintenance.js
// Daily maintenance script for Firebase Realtime Database
// Runs via GitHub Actions to keep database under 1GB (Spark Plan)
//
// What it does:
// 1. Deletes raw sensor data older than 60 days
// 2. Deletes hourly aggregates older than 3 years
// 3. Creates daily aggregate for yesterday
// 4. Reports database statistics
//
// Usage: node database-maintenance.js
// Environment: FIREBASE_SERVICE_ACCOUNT_KEY (JSON string from GitHub Secrets)

const admin = require('firebase-admin');

// Initialize Firebase Admin with service account from GitHub Secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
});

const db = admin.database();

// Configuration
const CONFIG = {
  RAW_RETENTION_DAYS: 60,        // Keep raw data for 60 days
  HOURLY_RETENTION_YEARS: 3,     // Keep hourly aggregates for 3 years
  BATCH_SIZE: 500                // Delete records in batches to avoid timeout
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function runMaintenance() {
  console.log('🚀 Starting daily maintenance...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (Manila)`);
  console.log('');
  
  try {
    const now = Date.now();
    
    // Step 1: Delete old raw data (> 60 days)
    console.log('════════════════════════════════════════════════════════');
    console.log('📝 STEP 1: Cleaning up old raw data');
    console.log('════════════════════════════════════════════════════════');
    await deleteOldRawData(now);
    
    // Step 2: Delete old hourly data (> 3 years)
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('📝 STEP 2: Cleaning up old hourly aggregates');
    console.log('════════════════════════════════════════════════════════');
    await deleteOldHourlyData(now);
    
    // Step 3: Create daily aggregate for yesterday
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('📝 STEP 3: Creating daily aggregate');
    console.log('════════════════════════════════════════════════════════');
    await createDailyAggregate(now);
    
    // Step 4: Report stats
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('📊 DATABASE STATISTICS');
    console.log('════════════════════════════════════════════════════════');
    await reportStats();
    
    console.log('');
    console.log('✅ Daily maintenance completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Maintenance failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE OLD RAW DATA
// ═══════════════════════════════════════════════════════════════════════════

async function deleteOldRawData(now) {
  const cutoff = now - (CONFIG.RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const cutoffDate = new Date(cutoff).toISOString().split('T')[0];
  
  console.log(`🗑️  Deleting raw data older than ${cutoffDate} (${CONFIG.RAW_RETENTION_DAYS} days ago)`);
  
  const snapshot = await db.ref('sensor_logs')
    .orderByChild('timestamp')
    .endAt(cutoff)
    .once('value');
  
  if (!snapshot.exists()) {
    console.log('✓ No old raw data to delete - database is clean!');
    return;
  }
  
  const updates = {};
  let count = 0;
  
  snapshot.forEach(child => {
    updates[`sensor_logs/${child.key}`] = null;
    count++;
  });
  
  if (count > 0) {
    // Delete in batches to avoid memory issues
    const keys = Object.keys(updates);
    const totalBatches = Math.ceil(keys.length / CONFIG.BATCH_SIZE);
    
    console.log(`📦 Deleting ${count} records in ${totalBatches} batch(es)...`);
    
    for (let i = 0; i < keys.length; i += CONFIG.BATCH_SIZE) {
      const batch = {};
      keys.slice(i, i + CONFIG.BATCH_SIZE).forEach(key => {
        batch[key] = null;
      });
      
      await db.ref().update(batch);
      
      const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
      console.log(`   ✓ Batch ${batchNum}/${totalBatches} deleted (${Math.min(i + CONFIG.BATCH_SIZE, keys.length)}/${keys.length} records)`);
    }
    
    console.log(`✅ Successfully deleted ${count} raw records older than ${cutoffDate}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE OLD HOURLY DATA
// ═══════════════════════════════════════════════════════════════════════════

async function deleteOldHourlyData(now) {
  const cutoff = now - (CONFIG.HOURLY_RETENTION_YEARS * 365 * 24 * 60 * 60 * 1000);
  const cutoffDate = new Date(cutoff).toISOString().split('T')[0];
  
  console.log(`🗑️  Deleting hourly data older than ${cutoffDate} (${CONFIG.HOURLY_RETENTION_YEARS} years ago)`);
  
  const snapshot = await db.ref('sensor_logs_hourly')
    .orderByChild('timestamp')
    .endAt(cutoff)
    .once('value');
  
  if (!snapshot.exists()) {
    console.log('✓ No old hourly data to delete - database is clean!');
    return;
  }
  
  const updates = {};
  let count = 0;
  
  snapshot.forEach(child => {
    updates[`sensor_logs_hourly/${child.key}`] = null;
    count++;
  });
  
  if (count > 0) {
    await db.ref().update(updates);
    console.log(`✅ Successfully deleted ${count} hourly records older than ${cutoffDate}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE DAILY AGGREGATE
// ═══════════════════════════════════════════════════════════════════════════

async function createDailyAggregate(now) {
  const yesterday = new Date(now - (24 * 60 * 60 * 1000));
  yesterday.setHours(0, 0, 0, 0);
  const yesterdayStart = yesterday.getTime();
  const yesterdayEnd = yesterdayStart + (24 * 60 * 60 * 1000);
  
  const dateKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  console.log(`📊 Creating daily aggregate for ${dateKey}`);
  
  const snapshot = await db.ref('sensor_logs')
    .orderByChild('timestamp')
    .startAt(yesterdayStart)
    .endAt(yesterdayEnd)
    .once('value');
  
  if (!snapshot.exists()) {
    console.log('⚠️  No data found for yesterday - sensor may be offline');
    return;
  }
  
  // Calculate aggregates
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
  
  const dailyData = {
    date: dateKey,
    timestamp: yesterdayStart,
    avgTemperature: count > 0 ? parseFloat((tempSum / count).toFixed(1)) : 0,
    minTemperature: minTemp !== Infinity ? minTemp : 0,
    maxTemperature: maxTemp !== -Infinity ? maxTemp : 0,
    totalRainfall: parseFloat(rainTotal.toFixed(2)),
    avgHumidity: count > 0 ? Math.round(humSum / count) : 0,
    minHumidity: minHum !== Infinity ? minHum : 0,
    maxHumidity: maxHum !== -Infinity ? maxHum : 0,
    recordCount: count
  };
  
  await db.ref(`sensor_logs_daily/${dateKey}`).set(dailyData);
  
  console.log(`✅ Successfully created daily aggregate for ${dateKey}`);
  console.log(`   📈 Records processed: ${count}`);
  console.log(`   🌡️  Temperature: ${dailyData.minTemperature}°C - ${dailyData.maxTemperature}°C (avg: ${dailyData.avgTemperature}°C)`);
  console.log(`   💧 Humidity: ${dailyData.minHumidity}% - ${dailyData.maxHumidity}% (avg: ${dailyData.avgHumidity}%)`);
  console.log(`   🌧️  Total rainfall: ${dailyData.totalRainfall}mm`);
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT DATABASE STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

async function reportStats() {
  console.log('📊 Calculating database statistics...');
  console.log('');
  
  const [rawSnap, hourlySnap, dailySnap] = await Promise.all([
    db.ref('sensor_logs').once('value'),
    db.ref('sensor_logs_hourly').once('value'),
    db.ref('sensor_logs_daily').once('value')
  ]);
  
  const rawCount = rawSnap.numChildren();
  const hourlyCount = hourlySnap.numChildren();
  const dailyCount = dailySnap.numChildren();
  
  // Estimate size (average bytes per record)
  const estimatedSize = (rawCount * 300) + (hourlyCount * 400) + (dailyCount * 500);
  const estimatedSizeMB = estimatedSize / (1024 * 1024);
  const percentUsed = (estimatedSizeMB / 1024) * 100;
  const remainingMB = 1024 - estimatedSizeMB;
  
  // Calculate growth rate and projection
  const recordsPerDay = (24 * 60) / 5; // Assuming 5-minute intervals = 288 records/day
  const recordsPerYear = recordsPerDay * 365;
  const mbPerYear = (recordsPerYear * 300) / (1024 * 1024);
  const dailyGrowthMB = mbPerYear / 365;
  const yearsToFull = remainingMB / mbPerYear;
  
  // Display statistics
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│              DATABASE STATISTICS                   │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ Raw records (60 days):      ${String(rawCount).padStart(18)} │`);
  console.log(`│ Hourly records (3 years):   ${String(hourlyCount).padStart(18)} │`);
  console.log(`│ Daily records (all time):   ${String(dailyCount).padStart(18)} │`);
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ Estimated size:             ${String(estimatedSizeMB.toFixed(2) + ' MB').padStart(18)} │`);
  console.log(`│ Free tier (1 GB):           ${String(percentUsed.toFixed(2) + '%').padStart(18)} │`);
  console.log(`│ Remaining space:            ${String(remainingMB.toFixed(2) + ' MB').padStart(18)} │`);
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ Daily growth:               ${String(dailyGrowthMB.toFixed(3) + ' MB/day').padStart(18)} │`);
  console.log(`│ Projected full in:          ${String((yearsToFull > 100 ? '100+' : yearsToFull.toFixed(1)) + ' years').padStart(18)} │`);
  console.log('└────────────────────────────────────────────────────┘');
  console.log('');
  
  // Health status
  if (percentUsed < 50) {
    console.log('✅ DATABASE HEALTH: EXCELLENT');
    console.log('   Storage usage is well within safe limits');
  } else if (percentUsed < 80) {
    console.log('⚠️  DATABASE HEALTH: GOOD');
    console.log('   Storage usage is moderate - continue monitoring');
  } else if (percentUsed < 95) {
    console.log('⚠️  DATABASE HEALTH: WARNING');
    console.log('   Storage usage is high - consider more aggressive cleanup');
  } else {
    console.log('🚨 DATABASE HEALTH: CRITICAL');
    console.log('   Storage usage is near limit - immediate action required!');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN THE MAINTENANCE
// ═══════════════════════════════════════════════════════════════════════════

runMaintenance();