// scripts/generate-summary.js
// PURPOSE: Generate analytical summaries of weather conditions over time
// NOTE: This is NOT for real-time alerts! check-all-alerts.js handles that.

const admin = require('firebase-admin');

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    databaseURL: 'https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app/'
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  process.exit(1);
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
    // Fetch recent data from the last 24 hours
    const snapshot = await sensorLogsRef
      .orderByChild('timestamp')
      .startAt(twentyFourHoursAgo)
      .once('value');
    
    if (!snapshot.exists()) {
      console.log('⚠️  No data found in the last 24 hours.');
      
      await db.ref('insights/daily_prediction').set({
        type: 'normal',
        message: 'Insufficient data for analysis. Waiting for sensor readings.',
        details: {},
        dataPoints: 0,
        updatedAt: Date.now(),
        error: null
      });
      
      return;
    }

    const data = snapshot.val();
    const dataPoints = Object.values(data);
    
    if (dataPoints.length === 0) {
      console.log('⚠️  No data points found after filtering.');
      return;
    }

    console.log(`✓ Found ${dataPoints.length} data points to analyze.\n`);

    // Calculate statistical metrics
    let totalTemp = 0;
    let totalHumidity = 0;
    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let totalRainfall = 0;

    dataPoints.forEach(point => {
      totalTemp += point.temperature || 0;
      totalHumidity += point.humidity || 0;
      totalRainfall += point.rainfall || 0;
      
      if (point.temperature > maxTemp) maxTemp = point.temperature;
      if (point.temperature < minTemp) minTemp = point.temperature;
    });

    const avgTemp = totalTemp / dataPoints.length;
    const avgHumidity = totalHumidity / dataPoints.length;

    console.log('📈 CALCULATED METRICS:');
    console.log(`   Average Temperature: ${avgTemp.toFixed(1)}°C`);
    console.log(`   Average Humidity: ${avgHumidity.toFixed(0)}%`);
    console.log(`   Total Rainfall: ${totalRainfall.toFixed(1)}mm`);
    console.log(`   Temperature Range: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C\n`);

    // ANALYSIS: Categorize conditions based on 24-hour trends
    // (NOT immediate alerts - those are handled by check-all-alerts.js)
    let type, message, pattern, recommendation;

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
        "Total Rainfall": `${totalRainfall.toFixed(1)}mm`,
        "Temp Range": `${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`
      },
      dataPoints: dataPoints.length,
      updatedAt: Date.now(),
      error: null
    };

    // Save to Firebase
    await db.ref('insights/daily_prediction').set(summary);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SUMMARY GENERATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Condition Type: ${type.toUpperCase()}`);
    console.log(`💬 Summary: ${message}`);
    if (pattern) console.log(`📈 Pattern: ${pattern}`);
    if (recommendation) console.log(`💡 Advisory: ${recommendation}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📍 Saved to: insights/daily_prediction');
    console.log('🔔 Remember: Real-time alerts run separately every 15 minutes');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error generating summary:', error.message);
    
    try {
      await db.ref('insights/daily_prediction').set({
        type: 'normal',
        message: 'Error analyzing historical data. Please try again later.',
        details: {},
        dataPoints: 0,
        updatedAt: Date.now(),
        error: error.message
      });
    } catch (saveError) {
      console.error('Failed to save error state:', saveError.message);
    }
    
    process.exit(1);
  }
}

// Run the function
generateWeatherSummary().then(() => {
  console.log('[COMPLETE] Weather summary generation finished successfully.\n');
  process.exit(0);
}).catch((error) => {
  console.error('[FAILED] Summary generation encountered an error:', error);
  process.exit(1);
});