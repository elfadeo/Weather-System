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
    databaseURL: 'https://weather-monitoring-syste-3c1ea.firebaseio.com' // IMPORTANT: Replace with your databaseURL
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.database();

async function generate24HourSummary() {
  console.log('Starting 24-hour summary generation...');

  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const sensorLogsRef = db.ref('sensor_logs');

  try {
    // Fetch recent data. Note: This fetches a larger chunk of data which we filter in-memory.
    // This is a practical approach for RTDB on a free plan.
    const snapshot = await sensorLogsRef.orderByChild('timestamp').startAt(twentyFourHoursAgo).once('value');
    
    if (!snapshot.exists()) {
      console.log('No data found in the last 24 hours.');
      return;
    }

    const data = snapshot.val();
    const dataPoints = Object.values(data);
    
    if (dataPoints.length === 0) {
      console.log('No data points found after filtering.');
      return;
    }

    let totalTemp = 0, totalHumidity = 0, maxTemp = -Infinity, minTemp = Infinity, totalRainfall = 0;

    dataPoints.forEach(point => {
      totalTemp += point.temperature;
      totalHumidity += point.humidity;
      totalRainfall += point.rainfall || 0;
      if (point.temperature > maxTemp) maxTemp = point.temperature;
      if (point.temperature < minTemp) minTemp = point.temperature;
    });

    const summary = {
      likelihood: 'moderate', // This is now a factual summary, not a prediction.
      message: '24-hour weather summary.',
      confidence: 1.0, // Factual data has 100% confidence.
      details: {
        "Avg Temp": `${(totalTemp / dataPoints.length).toFixed(1)}°C`,
        "Avg Humidity": `${(totalHumidity / dataPoints.length).toFixed(0)}%`,
        "Total Rainfall": `${totalRainfall.toFixed(1)}mm`,
        "Temp Range": `${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`
      },
      updatedAt: Date.now(),
    };

    await db.ref('insights/daily_prediction').set(summary);
    console.log('Successfully generated and saved 24-hour summary:', summary.details);

  } catch (error) {
    console.error('Error generating summary:', error);
    process.exit(1); // Exit with an error code to fail the GitHub Action
  }
}

generate24HourSummary().then(() => {
  console.log('Script finished successfully.');
  process.exit(0);
});
