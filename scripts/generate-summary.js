// scripts/generate-summary.js
// PURPOSE: Generate analytical summaries of weather conditions over time
// NOTE: This is NOT for real-time alerts! check-all-alerts.js handles that.

const admin = require('firebase-admin');

// Validate environment variable
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
  process.exit(1);
}

// Parse and validate service account key
let parsedKey;
try {
  parsedKey = JSON.parse(serviceAccountKey);
  console.log('✅ Service account key parsed successfully');
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
  console.error('The key must be valid JSON');
  process.exit(1);
}

// Initialize Firebase Admin SDK (check if already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(parsedKey),
      databaseURL: 'https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app/'
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.stack) console.error('Stack trace:', error.stack);
    process.exit(1);
  }
} else {
  console.log('✅ Firebase Admin SDK already initialized');
}

const db = admin.database();

async function generateWeatherSummary() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 WEATHER SUMMARY GENERATOR (Historical Analysis)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[${new Date().toISOString()}] Analyzing last 24 hours...`);
  console.log('NOTE: Real-time alerts are handled separately by check-all-alerts.js');
  console.log('═══════════════════════════════════════════════════════════\n');

  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const sensorLogsRef = db.ref('sensor_logs');

  try {
    console.log('📡 Fetching sensor data from last 24 hours...');
    console.log(`   Query start time: ${new Date(twentyFourHoursAgo).toISOString()}`);
    console.log(`   Current time: ${new Date().toISOString()}\n`);
    
    // Fetch recent data from the last 24 hours
    const snapshot = await sensorLogsRef
      .orderByChild('timestamp')
      .startAt(twentyFourHoursAgo)
      .once('value');
    
    console.log(`   Snapshot received: ${snapshot.exists() ? 'YES' : 'NO'}`);
    
    if (!snapshot.exists()) {
      console.log('⚠️  No data found in the last 24 hours.');
      console.log('   This could mean:');
      console.log('   - ESP32 has not sent data in 24 hours');
      console.log('   - Data is stored in a different location');
      console.log('   - Database permissions issue\n');
      
      const fallbackData = {
        type: 'normal',
        message: 'Insufficient data for analysis. Waiting for sensor readings.',
        details: {},
        dataPoints: 0,
        updatedAt: Date.now(),
        error: null
      };
      
      console.log('💾 Saving fallback state to Firebase...');
      await db.ref('insights/daily_prediction').set(fallbackData);
      console.log('✅ Saved "no data" state to Firebase\n');
      
      return;
    }

    const data = snapshot.val();
    console.log(`   Raw data type: ${typeof data}`);
    console.log(`   Is null: ${data === null}`);
    console.log(`   Keys count: ${data ? Object.keys(data).length : 0}\n`);
    
    if (!data || typeof data !== 'object') {
      console.log('❌ Data is null or not an object');
      return;
    }
    
    const dataPoints = Object.values(data);
    console.log(`✓ Found ${dataPoints.length} data points to analyze.`);
    
    if (dataPoints.length < 2) {
      console.log('⚠️  Not enough data points (< 2) found for a meaningful summary.\n');
      
      const insufficientData = {
        type: 'normal',
        message: 'Collecting more data for analysis. Please check back shortly.',
        details: {},
        dataPoints: dataPoints.length,
        updatedAt: Date.now(),
        error: null
      };
      
      await db.ref('insights/daily_prediction').set(insufficientData);
      console.log('✅ Saved "insufficient data" state to Firebase\n');
      
      return;
    }

    // Show sample of first data point for debugging
    const samplePoint = dataPoints[0];
    console.log('\n📋 Sample data point structure:');
    console.log(`   temperature: ${samplePoint.temperature}`);
    console.log(`   humidity: ${samplePoint.humidity}`);
    console.log(`   rainfall_total_estimated_mm_bucket: ${samplePoint.rainfall_total_estimated_mm_bucket}`);
    console.log(`   timestamp: ${samplePoint.timestamp}\n`);

    // Calculate statistical metrics
    let totalTemp = 0;
    let totalHumidity = 0;
    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let validTempCount = 0;
    let validHumidityCount = 0;
    
    // Calculate rainfall accumulation
    const firstReading = dataPoints[0];
    const lastReading = dataPoints[dataPoints.length - 1];
    
    const firstRainfallTotal = firstReading.rainfall_total_estimated_mm_bucket || 0;
    const lastRainfallTotal = lastReading.rainfall_total_estimated_mm_bucket || 0;
    const totalRainfall = Math.max(0, lastRainfallTotal - firstRainfallTotal);

    console.log('📊 Processing data points...');
    
    dataPoints.forEach((point, index) => {
      // Temperature
      if (point.temperature !== undefined && !isNaN(point.temperature)) {
        totalTemp += point.temperature;
        validTempCount++;
        if (point.temperature > maxTemp) maxTemp = point.temperature;
        if (point.temperature < minTemp) minTemp = point.temperature;
      }
      
      // Humidity
      if (point.humidity !== undefined && !isNaN(point.humidity)) {
        totalHumidity += point.humidity;
        validHumidityCount++;
      }
    });

    // Calculate averages
    const avgTemp = validTempCount > 0 ? totalTemp / validTempCount : 0;
    const avgHumidity = validHumidityCount > 0 ? totalHumidity / validHumidityCount : 0;

    console.log('\n📈 CALCULATED METRICS:');
    console.log(`   Average Temperature: ${avgTemp.toFixed(1)}°C (from ${validTempCount} readings)`);
    console.log(`   Average Humidity: ${avgHumidity.toFixed(0)}% (from ${validHumidityCount} readings)`);
    console.log(`   Total Rainfall (24h): ${totalRainfall.toFixed(1)}mm`);
    console.log(`   Temperature Range: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C\n`);

    // ANALYSIS: Categorize conditions based on 24-hour trends
    let type, message, pattern, recommendation;

    console.log('🔍 Analyzing weather patterns...\n');

    // SEVERE: Extreme conditions over extended period
    if (avgHumidity > 85 && totalRainfall > 15) {
      type = 'severe';
      message = 'Heavy rainfall with very high humidity recorded over the past 24 hours. Saturated conditions detected.';
      pattern = 'Sustained high moisture levels across multiple readings. Significant rain accumulation observed.';
      recommendation = 'Monitor drainage systems and check for standing water. Review flood risk areas.';
    }
    // CONCERNING: Patterns that warrant attention
    else if (avgHumidity > 75 && totalRainfall > 10) {
      type = 'concerning';
      message = 'Elevated humidity combined with significant rainfall over the monitoring period.';
      pattern = 'Persistent moisture levels detected. Rain activity more frequent than typical.';
      recommendation = 'Consider delaying outdoor agricultural activities. Monitor soil moisture levels.';
    }
    // CONCERNING: Heat stress conditions
    else if (avgTemp > 32 && avgHumidity > 70) {
      type = 'concerning';
      message = 'High temperature combined with elevated humidity creates uncomfortable conditions.';
      pattern = 'Heat index elevated throughout the day. Reduced evaporation efficiency.';
      recommendation = 'Ensure adequate hydration for crops and livestock. Provide shade where possible.';
    }
    // NOTABLE: Conditions worth noting but not critical
    else if (avgHumidity > 65 || totalRainfall > 5) {
      type = 'notable';
      message = 'Moderate humidity levels with some rainfall activity recorded over 24 hours.';
      pattern = 'Typical tropical weather patterns. Moisture levels within expected seasonal range.';
      recommendation = null;
    }
    // FAVORABLE: Ideal growing conditions
    else if (avgHumidity < 50 && totalRainfall === 0 && avgTemp >= 22 && avgTemp <= 28) {
      type = 'favorable';
      message = 'Optimal weather conditions with comfortable temperatures and low humidity maintained.';
      pattern = 'Stable, clear conditions throughout the period. Ideal for most agricultural activities.';
      recommendation = 'Excellent conditions for planting, fertilizing, and harvesting activities.';
    }
    // NOTABLE: Dry heat
    else if (avgHumidity < 40 && avgTemp > 33) {
      type = 'notable';
      message = 'Hot and dry conditions observed. Low moisture levels with elevated temperatures.';
      pattern = 'Reduced humidity with high heat. Increased evaporation rates likely.';
      recommendation = 'Monitor irrigation needs closely. Consider increasing watering frequency.';
    }
    // NORMAL: Standard conditions
    else {
      type = 'normal';
      message = 'Weather conditions within normal parameters for the region and season.';
      pattern = null;
      recommendation = null;
    }

    // Prepare summary object
    const summary = {
      type: type,
      message: message,
      pattern: pattern,
      recommendation: recommendation,
      details: {
        "Avg Temp": `${avgTemp.toFixed(1)}°C`,
        "Avg Humidity": `${avgHumidity.toFixed(0)}%`,
        "Total Rainfall 24h Est": `${totalRainfall.toFixed(1)}mm`,
        "Temp Range": `${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`
      },
      dataPoints: dataPoints.length,
      updatedAt: Date.now(),
      error: null
    };

    // Save to Firebase
    console.log('💾 Saving summary to Firebase...');
    await db.ref('insights/daily_prediction').set(summary);
    console.log('✅ Successfully saved to insights/daily_prediction\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SUMMARY GENERATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Condition Type: ${type.toUpperCase()}`);
    console.log(`💬 Summary: ${message}`);
    if (pattern) console.log(`📈 Pattern: ${pattern}`);
    if (recommendation) console.log(`💡 Advisory: ${recommendation}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📍 Saved to: insights/daily_prediction');
    console.log('🖥️  Visible in: Dashboard "Smart Insights" card');
    console.log('🔔 Remember: Real-time alerts run separately every 15 minutes');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR GENERATING SUMMARY');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    if (error.code) console.error('Error code:', error.code);
    if (error.errno) console.error('Error number:', error.errno);
    console.error('\nFull error object:', JSON.stringify(error, null, 2));
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('═══════════════════════════════════════════════════════════\n');
    
    try {
      console.log('💾 Attempting to save error state to Firebase...');
      await db.ref('insights/daily_prediction').set({
        type: 'normal',
        message: 'Error analyzing historical data. Please try again later.',
        details: {},
        dataPoints: 0,
        updatedAt: Date.now(),
        error: error.message
      });
      console.log('✅ Saved error state to Firebase');
    } catch (saveError) {
      console.error('❌ Failed to save error state:', saveError.message);
    }
    
    process.exit(1);
  }
}

// Run the function
console.log('🚀 Starting weather summary generation...\n');

generateWeatherSummary()
  .then(() => {
    console.log('[COMPLETE] Weather summary generation finished successfully.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[FATAL] Unhandled promise rejection:', error);
    process.exit(1);
  });