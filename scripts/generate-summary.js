// scripts/generate-summary.js
const admin = require('firebase-admin');

// This script expects the Firebase service account key to be passed
// as a JSON string in an environment variable.
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

async function generateSmartInsights() {
  console.log('Starting smart insights generation...');
  console.log(`[${new Date().toISOString()}] Analyzing last 24 hours of data...`);

  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const sensorLogsRef = db.ref('sensor_logs');

  try {
    // Fetch recent data from the last 24 hours
    const snapshot = await sensorLogsRef
      .orderByChild('timestamp')
      .startAt(twentyFourHoursAgo)
      .once('value');
    
    if (!snapshot.exists()) {
      console.log('No data found in the last 24 hours.');
      
      // Save empty state
      await db.ref('insights/daily_prediction').set({
        type: 'normal',
        message: 'No recent data available. Waiting for sensor readings.',
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
      console.log('No data points found after filtering.');
      return;
    }

    console.log(`Found ${dataPoints.length} data points to analyze.`);

    // Calculate basic metrics
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

    console.log(`Metrics - Avg Temp: ${avgTemp.toFixed(1)}°C, Avg Humidity: ${avgHumidity.toFixed(0)}%, Total Rainfall: ${totalRainfall.toFixed(1)}mm`);

    // HONEST ANALYSIS based on current conditions (not prediction!)
    let type, message, pattern, recommendation;

    // ALERT: Extreme conditions requiring immediate attention
    if (avgHumidity > 85 && totalRainfall > 15) {
      type = 'alert';
      message = 'Heavy rainfall and very high humidity recorded in the last 24 hours. Conditions remain severe.';
      pattern = 'Sustained high moisture levels detected across multiple readings. Heavy rain activity observed.';
      recommendation = 'Monitor for potential flooding. Check official weather warnings and advisories.';
    }
    // WARNING: Unusual or concerning patterns
    else if (avgHumidity > 75 && totalRainfall > 10) {
      type = 'warning';
      message = 'Elevated humidity and significant rainfall observed over the past day.';
      pattern = 'Moisture levels remain high. Similar conditions often precede continued rain activity.';
      recommendation = 'Keep umbrella handy. Conditions may persist. Monitor weather updates.';
    }
    // WARNING: High heat with humidity (discomfort warning)
    else if (avgTemp > 32 && avgHumidity > 70) {
      type = 'warning';
      message = 'High temperature combined with elevated humidity detected.';
      pattern = 'Heat index is elevated. Uncomfortable conditions for outdoor activities.';
      recommendation = 'Stay hydrated, seek shade, and limit strenuous outdoor activities.';
    }
    // OBSERVATION: Notable but not concerning patterns
    else if (avgHumidity > 65 || totalRainfall > 5) {
      type = 'observation';
      message = 'Moderate humidity levels with some rainfall activity recorded.';
      pattern = 'Typical tropical weather patterns observed. Conditions within normal range.';
      recommendation = null;
    }
    // FAVORABLE: Ideal conditions
    else if (avgHumidity < 50 && totalRainfall === 0 && avgTemp >= 22 && avgTemp <= 28) {
      type = 'favorable';
      message = 'Comfortable weather conditions with low humidity and pleasant temperatures.';
      pattern = 'Clear, dry conditions maintained throughout the period. Ideal weather observed.';
      recommendation = 'Great weather for outdoor activities and events!';
    }
    // OBSERVATION: Low humidity but extreme temperature
    else if (avgHumidity < 40 && avgTemp > 33) {
      type = 'observation';
      message = 'Hot and dry conditions detected over the past 24 hours.';
      pattern = 'Low humidity with high temperatures. Dry heat conditions present.';
      recommendation = 'Stay hydrated and use sun protection during outdoor activities.';
    }
    // NORMAL: Everything else
    else {
      type = 'normal';
      message = 'Weather conditions within normal range for the region.';
      pattern = null;
      recommendation = null;
    }

    // Prepare insights object
    const insights = {
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
    await db.ref('insights/daily_prediction').set(insights);
    
    console.log('✓ Successfully generated and saved smart insights');
    console.log(`  Type: ${type.toUpperCase()}`);
    console.log(`  Message: ${message}`);
    if (pattern) console.log(`  Pattern: ${pattern}`);
    if (recommendation) console.log(`  Recommendation: ${recommendation}`);

  } catch (error) {
    console.error('✗ Error generating insights:', error.message);
    
    // Save error state to Firebase
    try {
      await db.ref('insights/daily_prediction').set({
        type: 'normal',
        message: 'Error analyzing data. Please try again later.',
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
generateSmartInsights().then(() => {
  console.log('\n[COMPLETE] Script finished successfully.');
  process.exit(0);
}).catch((error) => {
  console.error('\n[FAILED] Script encountered an error:', error);
  process.exit(1);
});