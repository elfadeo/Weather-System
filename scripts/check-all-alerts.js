// scripts/check-all-alerts.js
// PURPOSE: Monitor real-time sensor readings and send EMAIL + SMS alerts when thresholds are exceeded
// THRESHOLDS: Based on IRRI and PAGASA existing studies (see documentation)
// SMS: Uses Semaphore API (Philippine-based service - perfect for PH numbers!)

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const https = require('https');

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;
const semaphoreApiKey = process.env.SEMAPHORE_API_KEY;

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

// Check Semaphore API availability
if (semaphoreApiKey) {
  console.log('✅ Semaphore SMS API initialized successfully');
} else {
  console.log('ℹ️  Semaphore API key not found - SMS notifications disabled');
}

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
// SEMAPHORE SMS NOTIFICATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function sendAlertSms(recipientPhone, alerts, temperature, humidity, rainfall) {
  if (!semaphoreApiKey || !recipientPhone) {
    console.log('⚠️  SMS notification skipped - Semaphore not configured or no recipient phone');
    return false;
  }

  try {
    // Clean phone number (remove spaces, ensure it starts with 09 or +639)
    let cleanPhone = recipientPhone.trim().replace(/\s+/g, '');
    
    // Convert to proper format for Semaphore
    if (cleanPhone.startsWith('+63')) {
      cleanPhone = '0' + cleanPhone.substring(3); // +639171234567 -> 09171234567
    } else if (cleanPhone.startsWith('63')) {
      cleanPhone = '0' + cleanPhone.substring(2); // 639171234567 -> 09171234567
    }
    
    // Format SMS message (keep concise)
    let smsBody = 'WEATHER ALERT\n\n';
    
    // Add current readings
    smsBody += `Temp: ${temperature}C\n`;
    smsBody += `Humidity: ${humidity}%\n`;
    smsBody += `Rainfall: ${rainfall}mm/hr\n\n`;
    
    // Add top 2 most critical alerts
    const topAlerts = alerts.slice(0, 2);
    smsBody += `Alerts (${alerts.length}):\n`;
    topAlerts.forEach((alert, index) => {
      smsBody += `${index + 1}. ${alert.metric}: ${alert.value}\n`;
      // Truncate message to fit SMS limits
      const shortMsg = alert.message.substring(0, 60);
      smsBody += `   ${shortMsg}...\n`;
    });
    
    if (alerts.length > 2) {
      smsBody += `+ ${alerts.length - 2} more\n`;
    }
    
    smsBody += `\nCheck dashboard for details.`;
    
    // Ensure message is within 160 chars for single SMS or 480 for multi-part
    if (smsBody.length > 450) {
      smsBody = smsBody.substring(0, 447) + '...';
    }

    // Prepare Semaphore API request
    const postData = new URLSearchParams({
      apikey: semaphoreApiKey,
      number: cleanPhone,
      message: smsBody,
      sendername: 'WEATHER' // Optional: Your sender name (max 11 chars)
    }).toString();

    const options = {
      hostname: 'api.semaphore.co',
      port: 443,
      path: '/api/v4/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // Send SMS via Semaphore API
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            resolve({ success: false, error: 'Invalid JSON response', raw: data });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });

    // Check response
    if (response.message_id || response[0]?.message_id) {
      const messageId = response.message_id || response[0]?.message_id;
      console.log(`✅ SMS SENT SUCCESSFULLY`);
      console.log(`   To: ${cleanPhone}`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Length: ${smsBody.length} chars\n`);
      return true;
    } else {
      console.error(`❌ SMS FAILED:`, response.message || response.error || 'Unknown error');
      console.error(`   Raw response:`, JSON.stringify(response));
      return false;
    }

  } catch (error) {
    console.error(`❌ SMS FAILED:`, error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET SMS SETTINGS FROM FIRESTORE
// ═══════════════════════════════════════════════════════════════════════════════

async function getSmsSettings() {
  try {
    const settingsDoc = await firestore.collection('settings').doc('thresholds').get();
    
    if (!settingsDoc.exists) {
      console.log('⚠️  Settings document not found');
      return { enabled: false, phone: null };
    }
    
    const data = settingsDoc.data();
    
    // Debug logging
    console.log('📄 SMS Settings from Firestore:');
    console.log(`   sms_notifications_enabled: ${data.sms_notifications_enabled}`);
    console.log(`   recipient_phone_number: ${data.recipient_phone_number}`);
    
    return {
      enabled: data.sms_notifications_enabled || false,
      phone: data.recipient_phone_number || null
    };
  } catch (error) {
    console.error('⚠️  Error fetching SMS settings:', error.message);
    return { enabled: false, phone: null };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ALERT CHECKING FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function checkAlerts() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚨 REAL-TIME ALERT MONITORING SYSTEM');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[${new Date().toISOString()}] Checking sensor readings...`);
  console.log('Thresholds based on: IRRI Research + PAGASA Standards');
  console.log('Note: Notifications sent ONLY if thresholds are exceeded\n');

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
    // DECISION: Send Notifications Only If Alerts Were Triggered
    // ═══════════════════════════════════════════════════════════
    
    if (triggeredAlerts.length === 0) {
      console.log('✅ ALL READINGS WITHIN SAFE RANGES');
      console.log(`   Temperature: ${temperature}°C (Optimal: ${THRESHOLDS.temperature.optimal_min}-${THRESHOLDS.temperature.optimal_max}°C)`);
      console.log(`   Humidity: ${humidity}% (Safe: <${THRESHOLDS.humidity.moderate}%)`);
      console.log(`   Rainfall Rate (Est.): ${rainfall}mm/hr (Safe: <${THRESHOLDS.rainfall.yellow}mm/hr)`);
      console.log('✅ No alerts triggered - No notifications sent\n');
      
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
    // ALERTS TRIGGERED - Prepare and Send Notifications
    // ═══════════════════════════════════════════════════════════
    
    console.log(`⚠️  ${triggeredAlerts.length} ALERT(S) TRIGGERED - Preparing notifications...\n`);
    
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

    // Build email content (keeping your existing email HTML - not showing for brevity)
    const emailBody = `<!DOCTYPE html>...`; // Your existing email template

    const mailOptions = {
      from: `Weather Monitoring System <${gmailEmail}>`,
      to: ALERT_RECIPIENTS.join(', '),
      subject: emailSubject,
      html: emailBody
    };

    // Send EMAIL notification
    await transporter.sendMail(mailOptions);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log(`   Recipients: ${ALERT_RECIPIENTS.join(', ')}`);
    console.log(`   Subject: ${emailSubject}`);
    console.log(`   Alerts: ${triggeredAlerts.length}\n`);

    // Get SMS settings from Firestore
    const smsSettings = await getSmsSettings();
    
    let smsSent = false;
    
    // Send SMS notification if enabled
    if (smsSettings.enabled && smsSettings.phone) {
      console.log('📱 SMS notifications enabled - sending via Semaphore...');
      smsSent = await sendAlertSms(
        smsSettings.phone, 
        triggeredAlerts, 
        temperature, 
        humidity, 
        rainfall
      );
    } else if (!smsSettings.enabled) {
      console.log('ℹ️  SMS notifications disabled in dashboard settings\n');
    } else if (!smsSettings.phone) {
      console.log('⚠️  SMS enabled but no recipient phone number configured\n');
    }

    // Log to Firestore
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
      smsSent: smsSent,
      smsProvider: 'semaphore',
      recipients: ALERT_RECIPIENTS,
      smsRecipient: smsSettings.enabled ? smsSettings.phone : null,
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