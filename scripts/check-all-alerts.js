// scripts/check-all-alerts.js
// PURPOSE: Monitor real-time sensor readings and send EMAIL alerts ONLY when thresholds are exceeded
// THRESHOLDS: Based on IRRI and PAGASA existing studies (see documentation)
// IMPORTANT: No email is sent if all readings are within safe ranges

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

if (!serviceAccountKey || !gmailEmail || !gmailPassword) {
  console.error('ERROR: Missing required environment variables.');
  console.error('Required: FIREBASE_SERVICE_ACCOUNT_KEY, GMAIL_EMAIL, GMAIL_APP_PASSWORD');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    databaseURL: 'https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app/'
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.database();
const firestore = admin.firestore();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// THRESHOLD DEFINITIONS (Based on Existing Studies)
// ═══════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  temperature: {
    optimal_min: 25,
    optimal_max: 33,
    critical: 35
  },
  rainfall: {
    yellow: 7.5,
    orange: 15,
    red: 30
  },
  humidity: {
    low: 70,
    moderate: 85,
    high: 90
  }
};

const DISEASE_PATTERNS = {
  rice_blast: {
    name: 'Rice Blast (Fungal)',
    conditions: (temp, humidity) => humidity >= 90 && temp >= 24 && temp <= 28,
    message: 'High risk of Rice Blast fungal disease. Cool + very humid conditions detected.',
    action: 'Apply preventive fungicide. Scout fields for lesions on leaves.',
    source: 'IRRI Rice Doctor'
  },
  bacterial_blight: {
    name: 'Bacterial Leaf Blight',
    conditions: (temp, humidity) => humidity >= 85 && temp >= 30 && temp <= 34,
    message: 'High risk of Bacterial Leaf Blight. Hot + humid conditions detected.',
    action: 'Monitor for yellowing leaf tips. Ensure balanced fertilization.',
    source: 'IRRI Rice Doctor'
  }
};

const ALERT_RECIPIENTS = [
  gmailEmail
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ALERT CHECKING FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function checkAlerts() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚨 REAL-TIME ALERT MONITORING SYSTEM');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[${new Date().toISOString()}] Checking sensor readings...`);
  console.log('Thresholds based on: IRRI Research + PAGASA Standards');
  console.log('Note: Emails sent ONLY if thresholds are exceeded\n');

  try {
    // Try to get latest data first
    console.log('📡 Attempting to read latest sensor data...');
    const latestSnapshot = await db.ref('sensor_data/latest').once('value');
    
    let latestReading = null;
    let readingSource = '';

    if (latestSnapshot.exists()) {
      latestReading = latestSnapshot.val();
      readingSource = 'sensor_data/latest';
      console.log('✅ Found data in sensor_data/latest');
    } else {
      console.log('⚠️  No data in sensor_data/latest, checking sensor_logs...');
      
      // Fallback to sensor_logs
      const logsSnapshot = await db.ref('sensor_logs')
        .orderByChild('timestamp')
        .limitToLast(1)
        .once('value');

      if (!logsSnapshot.exists()) {
        console.log('❌ No sensor data found in either location.');
        console.log('✅ No alerts to send.\n');
        
        await firestore.collection('alerts_history').add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'no_data',
          message: 'No sensor data available',
          error: 'No data in sensor_data/latest or sensor_logs'
        });
        
        return;
      }

      const logsData = logsSnapshot.val();
      latestReading = Object.values(logsData)[0];
      readingSource = 'sensor_logs';
      console.log('✅ Found data in sensor_logs');
    }

    if (!latestReading) {
      console.log('❌ Could not extract reading from snapshot');
      return;
    }

    // Extract values with fallbacks
    const temperature = latestReading.temperature;
    const humidity = latestReading.humidity;
    const rainfall = latestReading.rainRateEstimated_mm_hr_bucket || 0;
    const timestamp = latestReading.timestamp || Date.now();
    
    // Validate essential readings
    if (temperature === undefined || humidity === undefined) {
      console.log('❌ Missing essential sensor readings (temperature or humidity)');
      return;
    }

    // Format time in Philippine Time
    const readingTime = new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    console.log('\n📊 CURRENT READINGS:');
    console.log(`   Source: ${readingSource}`);
    console.log(`   Temperature: ${temperature}°C`);
    console.log(`   Humidity: ${humidity}%`);
    console.log(`   Rainfall Rate (Est.): ${rainfall}mm/hr`);
    console.log(`   Time: ${readingTime} (Philippine Time)\n`);

    // Array to collect triggered alerts
    const triggeredAlerts = [];

    // ═══════════════════════════════════════════════════════════
    // CHECK 1: TEMPERATURE ALERTS
    // ═══════════════════════════════════════════════════════════
    
    if (temperature > THRESHOLDS.temperature.critical) {
      triggeredAlerts.push({
        type: 'CRITICAL',
        metric: 'Temperature',
        value: `${temperature}°C`,
        threshold: `>${THRESHOLDS.temperature.critical}°C`,
        message: `CRITICAL HEAT STRESS: Temperature exceeds ${THRESHOLDS.temperature.critical}°C during potential flowering stage. Risk of spikelet sterility (empty grains).`,
        action: 'IMMEDIATE ACTION: Flood fields to 5-10cm depth to cool soil temperature. Water acts as thermal insulator.',
        severity: 'critical',
        icon: '🔥',
        source: 'IRRI Rice Knowledge Bank - Heat Stress'
      });
    } else if (temperature > THRESHOLDS.temperature.optimal_max) {
      triggeredAlerts.push({
        type: 'WARNING',
        metric: 'Temperature',
        value: `${temperature}°C`,
        threshold: `>${THRESHOLDS.temperature.optimal_max}°C`,
        message: `Temperature above optimal range. Heat stress may begin affecting rice growth.`,
        action: 'Monitor temperature closely. Prepare to increase water depth if temperature rises further.',
        severity: 'warning',
        icon: '🌡️',
        source: 'IRRI Optimal Growing Conditions'
      });
    } else if (temperature < THRESHOLDS.temperature.optimal_min) {
      triggeredAlerts.push({
        type: 'WARNING',
        metric: 'Temperature',
        value: `${temperature}°C`,
        threshold: `<${THRESHOLDS.temperature.optimal_min}°C`,
        message: `Temperature below optimal range for rice growth.`,
        action: 'Growth may be slower. Ensure adequate drainage to prevent cold water stagnation.',
        severity: 'warning',
        icon: '❄️',
        source: 'IRRI Optimal Growing Conditions'
      });
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 2: RAINFALL ALERTS
    // ═══════════════════════════════════════════════════════════
    
    if (rainfall >= THRESHOLDS.rainfall.red) {
      triggeredAlerts.push({
        type: 'CRITICAL',
        metric: 'Rainfall Rate',
        value: `${rainfall}mm/hr`,
        threshold: `≥${THRESHOLDS.rainfall.red}mm/hr (RED)`,
        message: `PAGASA RED ALERT: Critical heavy rainfall. Flash flooding imminent. Seedlings will drown if submerged >3 days.`,
        action: 'EMERGENCY: Ensure all drainage pathways are clear. Monitor field water levels constantly. Prepare emergency response.',
        severity: 'critical',
        icon: '⛈️',
        source: 'PAGASA Heavy Rainfall Warning System'
      });
    } else if (rainfall >= THRESHOLDS.rainfall.orange) {
      triggeredAlerts.push({
        type: 'WARNING',
        metric: 'Rainfall Rate',
        value: `${rainfall}mm/hr`,
        threshold: `≥${THRESHOLDS.rainfall.orange}mm/hr (ORANGE)`,
        message: `PAGASA ORANGE ALERT: Heavy rainfall. Soil saturated, runoff beginning. Drainage canals may overflow.`,
        action: 'Open drainage channels immediately. Secure loose materials. Prepare for potential flooding.',
        severity: 'warning',
        icon: '🌧️',
        source: 'PAGASA Heavy Rainfall Warning System'
      });
    } else if (rainfall >= THRESHOLDS.rainfall.yellow) {
      triggeredAlerts.push({
        type: 'ADVISORY',
        metric: 'Rainfall Rate',
        value: `${rainfall}mm/hr`,
        threshold: `≥${THRESHOLDS.rainfall.yellow}mm/hr (YELLOW)`,
        message: `PAGASA YELLOW ALERT: Moderate to heavy rainfall. Soil getting soaked, puddles forming.`,
        action: 'Monitor water levels in fields. Check drainage systems are functioning properly.',
        severity: 'advisory',
        icon: '🌦️',
        source: 'PAGASA Heavy Rainfall Warning System'
      });
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK 3: DISEASE RISK ASSESSMENT
    // ═══════════════════════════════════════════════════════════
    
    if (DISEASE_PATTERNS.rice_blast.conditions(temperature, humidity)) {
      triggeredAlerts.push({
        type: 'WARNING',
        metric: 'Disease Risk',
        value: `${temperature}°C + ${humidity}% RH`,
        threshold: 'Rice Blast Conditions',
        message: `${DISEASE_PATTERNS.rice_blast.message} (Temp: ${temperature}°C, Humidity: ${humidity}%)`,
        action: DISEASE_PATTERNS.rice_blast.action,
        severity: 'warning',
        icon: '🍄',
        source: DISEASE_PATTERNS.rice_blast.source
      });
    }

    if (DISEASE_PATTERNS.bacterial_blight.conditions(temperature, humidity)) {
      triggeredAlerts.push({
        type: 'WARNING',
        metric: 'Disease Risk',
        value: `${temperature}°C + ${humidity}% RH`,
        threshold: 'Bacterial Blight Conditions',
        message: `${DISEASE_PATTERNS.bacterial_blight.message} (Temp: ${temperature}°C, Humidity: ${humidity}%)`,
        action: DISEASE_PATTERNS.bacterial_blight.action,
        severity: 'warning',
        icon: '🦠',
        source: DISEASE_PATTERNS.bacterial_blight.source
      });
    }

    if (humidity >= THRESHOLDS.humidity.high && 
        !DISEASE_PATTERNS.rice_blast.conditions(temperature, humidity) &&
        !DISEASE_PATTERNS.bacterial_blight.conditions(temperature, humidity)) {
      triggeredAlerts.push({
        type: 'ADVISORY',
        metric: 'Humidity',
        value: `${humidity}%`,
        threshold: `≥${THRESHOLDS.humidity.high}%`,
        message: `Very high humidity detected. General disease risk increased.`,
        action: 'Monitor crops for any signs of disease. Ensure good air circulation.',
        severity: 'advisory',
        icon: '💧',
        source: 'General Agricultural Practice'
      });
    }

    // ═══════════════════════════════════════════════════════════
    // DECISION: Send Email Only If Alerts Were Triggered
    // ═══════════════════════════════════════════════════════════
    
    if (triggeredAlerts.length === 0) {
      console.log('✅ ALL READINGS WITHIN SAFE RANGES');
      console.log(`   Temperature: ${temperature}°C (Optimal: ${THRESHOLDS.temperature.optimal_min}-${THRESHOLDS.temperature.optimal_max}°C)`);
      console.log(`   Humidity: ${humidity}% (Safe: <${THRESHOLDS.humidity.moderate}%)`);
      console.log(`   Rainfall Rate (Est.): ${rainfall}mm/hr (Safe: <${THRESHOLDS.rainfall.yellow}mm/hr)`);
      console.log('✅ No alerts triggered - No email sent\n');
      
      await firestore.collection('alerts_history').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'normal',
        message: 'All readings within safe thresholds',
        readings: { temperature, humidity, rainfall },
        readingTime: readingTime,
        source: readingSource
      });
      
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // ALERTS TRIGGERED - Prepare and Send Email
    // ═══════════════════════════════════════════════════════════
    
    console.log(`⚠️  ${triggeredAlerts.length} ALERT(S) TRIGGERED - Preparing email...\n`);
    
    triggeredAlerts.forEach((alert, index) => {
      console.log(`${alert.icon} Alert ${index + 1}/${triggeredAlerts.length}:`);
      console.log(`   Type: ${alert.type}`);
      console.log(`   Metric: ${alert.metric}`);
      console.log(`   Current: ${alert.value} (Threshold: ${alert.threshold})`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Action: ${alert.action}`);
      console.log(`   Source: ${alert.source}\n`);
    });

    const hasCritical = triggeredAlerts.some(a => a.severity === 'critical');
    const hasWarning = triggeredAlerts.some(a => a.severity === 'warning');
    
    const emailSubject = hasCritical
      ? '🚨 CRITICAL WEATHER ALERT - Immediate Action Required'
      : hasWarning
      ? '⚠️ Weather Alert - Attention Needed'
      : '📋 Weather Advisory - For Your Information';

    // Build email content
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; background: white; }
    .alert-summary { background: #fee2e2; border-left: 5px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .alert-box { margin: 20px 0; padding: 20px; border-left: 5px solid; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .critical { background: #fee; border-color: #dc2626; }
    .warning { background: #fffbeb; border-color: #f59e0b; }
    .advisory { background: #eff6ff; border-color: #3b82f6; }
    .alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .alert-title { font-size: 18px; font-weight: bold; margin: 0; }
    .alert-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-critical { background: #dc2626; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .badge-advisory { background: #3b82f6; color: white; }
    .alert-details { margin: 10px 0; line-height: 1.8; }
    .detail-row { display: flex; margin: 8px 0; }
    .detail-label { font-weight: 600; min-width: 120px; color: #666; }
    .detail-value { color: #111; }
    .action-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; margin-top: 15px; }
    .action-box strong { color: #1e40af; }
    .readings { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .readings h3 { margin: 0 0 15px 0; color: #374151; }
    .reading-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1d5db; }
    .reading-item:last-child { border-bottom: none; }
    .reading-label { color: #6b7280; }
    .reading-value { font-weight: bold; color: #111827; font-size: 16px; }
    .source-note { font-size: 11px; color: #9ca3af; margin-top: 8px; font-style: italic; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer strong { color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Weather Monitoring Alert</h1>
      <p>Threshold Exceeded - Action Required</p>
      <p style="font-size: 13px; margin-top: 5px;">Detected at ${readingTime} (Philippine Time)</p>
    </div>
    
    <div class="content">
      <div class="alert-summary">
        <strong>${triggeredAlerts.length} Alert${triggeredAlerts.length > 1 ? 's' : ''} Triggered</strong><br>
        Your weather monitoring system has detected conditions exceeding safe thresholds based on IRRI and PAGASA research.
      </div>
      
      ${triggeredAlerts.map(alert => `
        <div class="alert-box ${alert.severity}">
          <div class="alert-header">
            <div class="alert-title">${alert.icon} ${alert.metric}</div>
            <span class="alert-badge badge-${alert.severity}">${alert.type}</span>
          </div>
          <div class="alert-details">
            <div class="detail-row">
              <span class="detail-label">Current Value:</span>
              <span class="detail-value">${alert.value}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Threshold:</span>
              <span class="detail-value">${alert.threshold}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Impact:</span>
              <span class="detail-value">${alert.message}</span>
            </div>
          </div>
          <div class="action-box">
            <strong>⚡ Recommended Action:</strong><br>
            ${alert.action}
          </div>
          <div class="source-note">📚 Based on: ${alert.source}</div>
        </div>
      `).join('')}
      
      <div class="readings">
        <h3>📊 Complete Sensor Readings</h3>
        <div class="reading-item">
          <span class="reading-label">🌡️ Temperature</span>
          <span class="reading-value">${temperature}°C</span>
        </div>
        <div class="reading-item">
          <span class="reading-label">💧 Humidity</span>
          <span class="reading-value">${humidity}%</span>
        </div>
        <div class="reading-item">
          <span class="reading-label">🌧️ Rainfall Rate</span>
          <span class="reading-value">${rainfall}mm/hr</span>
        </div>
        <div class="reading-item">
          <span class="reading-label">⏰ Reading Time</span>
          <span class="reading-value">${readingTime}</span>
        </div>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <strong>⚠️ Important:</strong> These alerts are based on scientifically validated thresholds from IRRI (International Rice Research Institute) and PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration). Please take appropriate action to protect your crops.
      </div>
    </div>
    
    <div class="footer">
      <strong>Automated Weather Monitoring System</strong><br>
      Real-time monitoring continues every 15 minutes<br>
      Thresholds based on: IRRI Research + PAGASA Standards
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `Weather Monitoring System <${gmailEmail}>`,
      to: ALERT_RECIPIENTS.join(', '),
      subject: emailSubject,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log(`   Recipients: ${ALERT_RECIPIENTS.join(', ')}`);
    console.log(`   Subject: ${emailSubject}`);
    console.log(`   Alerts: ${triggeredAlerts.length}\n`);

    await firestore.collection('alerts_history').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'alert',
      alertCount: triggeredAlerts.length,
      alerts: triggeredAlerts.map(a => ({
        type: a.type,
        metric: a.metric,
        value: a.value,
        threshold: a.threshold,
        message: a.message,
        action: a.action,
        source: a.source
      })),
      readings: { temperature, humidity, rainfall },
      readingTime: readingTime,
      emailSent: true,
      recipients: ALERT_RECIPIENTS,
      source: readingSource
    });

    console.log('✅ Alert logged to Firestore: alerts_history collection\n');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error checking alerts:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the alert check
checkAlerts().then(() => {
  console.log('[COMPLETE] Alert monitoring finished.\n');
  process.exit(0);
}).catch((error) => {
  console.error('[FAILED] Alert monitoring encountered an error:', error);
  process.exit(1);
});