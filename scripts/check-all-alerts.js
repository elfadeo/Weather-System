// scripts/check-all-alerts.js
// PURPOSE: Monitor real-time sensor readings and send EMAIL + SMS alerts when thresholds are exceeded
// THRESHOLDS: Based on IRRI and PAGASA existing studies (see documentation)
// SMS: Uses Semaphore API (Philippine-based service - perfect for PH numbers!)
// ENHANCEMENTS: Smart cooldown + Sensor offline detection

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
// COOLDOWN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const COOLDOWN_CONFIG = {
  // Don't resend same severity alert for this duration
  critical: 60,   // 60 minutes for CRITICAL alerts
  warning: 120,   // 2 hours for WARNING alerts
  advisory: 180   // 3 hours for ADVISORY alerts
};

// Sensor health check
const SENSOR_OFFLINE_THRESHOLD = 30; // minutes - alert if no data for 30 min

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
// SMART COOLDOWN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

async function shouldSendAlert(alertMetric, alertSeverity, currentValue) {
  try {
    // Get last alert of this type
    const lastAlertQuery = await firestore
      .collection('alerts_history')
      .where('status', '==', 'alert')
      .orderBy('timestamp', 'desc')
      .limit(50) // Check last 50 alerts
      .get();

    if (lastAlertQuery.empty) {
      console.log(`   ✅ No previous alerts - sending ${alertMetric} alert`);
      return { shouldSend: true, reason: 'first_alert' };
    }

    // Find the most recent alert for this specific metric
    let lastMatchingAlert = null;
    for (const doc of lastAlertQuery.docs) {
      const data = doc.data();
      if (data.alerts && data.alerts.some(a => a.metric === alertMetric)) {
        lastMatchingAlert = data;
        break;
      }
    }

    if (!lastMatchingAlert) {
      console.log(`   ✅ No previous ${alertMetric} alerts - sending alert`);
      return { shouldSend: true, reason: 'first_metric_alert' };
    }

    // Calculate time since last alert
    const lastTimestamp = lastMatchingAlert.timestamp.toMillis();
    const minutesSince = (Date.now() - lastTimestamp) / 60000;
    const cooldownPeriod = COOLDOWN_CONFIG[alertSeverity] || COOLDOWN_CONFIG.warning;

    // Check if cooldown period has passed
    if (minutesSince < cooldownPeriod) {
      // Check if conditions worsened significantly
      const lastAlert = lastMatchingAlert.alerts.find(a => a.metric === alertMetric);
      const hasWorsened = checkIfConditionsWorsened(alertMetric, lastAlert, currentValue);
      
      if (hasWorsened) {
        console.log(`   ⚠️  ${alertMetric}: Conditions WORSENED - overriding cooldown`);
        console.log(`      Previous: ${lastAlert.value} → Current: ${currentValue}`);
        return { shouldSend: true, reason: 'conditions_worsened' };
      }

      console.log(`   ⏱️  ${alertMetric}: Cooldown active (${minutesSince.toFixed(0)}/${cooldownPeriod} min)`);
      console.log(`      Last alert: ${new Date(lastTimestamp).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);
      return { shouldSend: false, reason: 'cooldown_active', minutesRemaining: Math.ceil(cooldownPeriod - minutesSince) };
    }

    console.log(`   ✅ ${alertMetric}: Cooldown expired - sending new alert`);
    return { shouldSend: true, reason: 'cooldown_expired' };

  } catch (error) {
    console.error(`   ⚠️  Error checking cooldown for ${alertMetric}:`, error.message);
    // On error, allow the alert (fail-safe)
    return { shouldSend: true, reason: 'error_failsafe' };
  }
}

// Check if conditions significantly worsened
function checkIfConditionsWorsened(metric, lastAlert, currentValue) {
  if (!lastAlert || !lastAlert.value) return false;

  // Extract numeric value from strings like "36°C" or "95%"
  const extractNumber = (str) => parseFloat(str.toString().replace(/[^0-9.]/g, ''));
  
  const lastValue = extractNumber(lastAlert.value);
  const currentNumeric = extractNumber(currentValue);

  // Define "significant worsening" thresholds
  const worseningThresholds = {
    'Temperature': 2,        // 2°C increase
    'Rainfall Rate': 10,     // 10mm/hr increase
    'Humidity': 5,           // 5% increase
    'Disease Risk': 0        // Any change in disease risk
  };

  const threshold = worseningThresholds[metric] || 0;
  
  if (metric === 'Temperature' && currentNumeric > lastValue + threshold) {
    return true; // Temperature increased significantly
  } else if (metric === 'Rainfall Rate' && currentNumeric > lastValue + threshold) {
    return true; // Rainfall increased significantly
  } else if (metric === 'Humidity' && currentNumeric > lastValue + threshold) {
    return true; // Humidity increased significantly
  } else if (metric === 'Disease Risk') {
    return true; // Always alert on disease risk changes
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENSOR OFFLINE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

async function checkSensorHealth(timestamp) {
  try {
    const dataAge = (Date.now() - timestamp) / 60000; // minutes
    
    console.log(`\n🔍 SENSOR HEALTH CHECK:`);
    console.log(`   Last data received: ${dataAge.toFixed(1)} minutes ago`);
    console.log(`   Offline threshold: ${SENSOR_OFFLINE_THRESHOLD} minutes`);

    if (dataAge > SENSOR_OFFLINE_THRESHOLD) {
      console.log(`   ⚠️  SENSOR OFFLINE DETECTED!`);
      
      // Check if we already sent an offline alert recently
      const recentOfflineAlert = await firestore
        .collection('alerts_history')
        .where('status', '==', 'sensor_offline')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      let shouldAlert = true;
      if (!recentOfflineAlert.empty) {
        const lastOfflineAlert = recentOfflineAlert.docs[0].data();
        const minutesSinceOfflineAlert = (Date.now() - lastOfflineAlert.timestamp.toMillis()) / 60000;
        
        // Only send offline alert once every 2 hours
        if (minutesSinceOfflineAlert < 120) {
          console.log(`   ℹ️  Offline alert already sent ${minutesSinceOfflineAlert.toFixed(0)} min ago`);
          shouldAlert = false;
        }
      }

      if (shouldAlert) {
        await sendSensorOfflineAlert(dataAge, timestamp);
      }
      
      return false; // Sensor is offline
    }

    console.log(`   ✅ Sensor is ONLINE and healthy`);
    return true; // Sensor is online

  } catch (error) {
    console.error(`   ⚠️  Error checking sensor health:`, error.message);
    return true; // Assume online on error (fail-safe)
  }
}

async function sendSensorOfflineAlert(minutesOffline, lastTimestamp) {
  try {
    console.log(`\n📧 SENDING SENSOR OFFLINE ALERT...`);
    
    const lastReadingTime = new Date(lastTimestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const emailSubject = '🔴 SYSTEM ALERT: Weather Sensor Offline';
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.07); }
    .header { background: linear-gradient(120deg, #dc2626, #991b1b); color: #ffffff; padding: 26px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 26px 28px; }
    .alert-box { padding: 20px; border-radius: 14px; margin: 18px 0; background: #fef2f2; border-left: 6px solid #dc2626; }
    .info-row { margin: 10px 0; font-size: 15px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔴 Sensor Offline Alert</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top:0; color:#991b1b;">⚠️ Weather Sensor Not Responding</h2>
        <div class="info-row"><strong>Status:</strong> OFFLINE</div>
        <div class="info-row"><strong>Last Reading:</strong> ${lastReadingTime} (Philippine Time)</div>
        <div class="info-row"><strong>Time Offline:</strong> ${minutesOffline.toFixed(0)} minutes (${(minutesOffline/60).toFixed(1)} hours)</div>
      </div>
      
      <h3 style="color:#991b1b;">📋 Troubleshooting Steps:</h3>
      <ol style="line-height: 1.8;">
        <li><strong>Check Power:</strong> Ensure the ESP32/sensor has power</li>
        <li><strong>Check WiFi:</strong> Verify internet connectivity</li>
        <li><strong>Check Wiring:</strong> Inspect sensor connections</li>
        <li><strong>Restart Device:</strong> Try power cycling the sensor</li>
        <li><strong>Check Firebase:</strong> Verify database is accessible</li>
      </ol>

      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 10px; border-left: 4px solid #2563eb;">
        <strong>⚠️ Important:</strong> No weather alerts can be sent while the sensor is offline. Please restore connectivity as soon as possible.
      </div>
    </div>
    <div class="footer">
      <div style="font-weight: 700; color: #065f46;">🌾 AgriSmart Weather Monitoring System</div>
      <p>Automated System Alert</p>
    </div>
  </div>
</body>
</html>
    `;

    // Get email recipients
    const emailRecipients = await getEmailRecipients();

    // Send email
    await transporter.sendMail({
      from: `Weather Monitoring System <${gmailEmail}>`,
      to: emailRecipients.join(', '),
      subject: emailSubject,
      html: emailBody
    });

    console.log(`   ✅ Sensor offline email sent to: ${emailRecipients.join(', ')}`);

    // Get SMS settings
    const smsSettings = await getSmsSettings();
    
    // Send SMS to all recipients if enabled
    if (smsSettings.enabled && smsSettings.phoneNumbers.length > 0 && semaphoreApiKey) {
      const smsMessage = `SENSOR OFFLINE ALERT\n\nWeather sensor has not reported data for ${minutesOffline.toFixed(0)} minutes.\n\nLast reading: ${lastReadingTime}\n\nPlease check sensor power and connectivity immediately.`;
      
      console.log(`   📱 Sending SMS to ${smsSettings.phoneNumbers.length} recipient(s)...`);
      
      for (const phoneObj of smsSettings.phoneNumbers) {
        const label = phoneObj.label ? ` (${phoneObj.label})` : '';
        console.log(`      → ${phoneObj.number}${label}`);
        await sendSimpleSms(phoneObj.number, smsMessage);
      }
    }

    // Log to Firestore
    await firestore.collection('alerts_history').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sensor_offline',
      message: `Sensor offline for ${minutesOffline.toFixed(0)} minutes`,
      lastDataTimestamp: new Date(lastTimestamp),
      minutesOffline: minutesOffline,
      emailSent: true,
      recipients: emailRecipients
    });

    console.log(`   ✅ Sensor offline alert logged to Firestore\n`);

  } catch (error) {
    console.error(`   ❌ Error sending sensor offline alert:`, error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEMAPHORE SMS NOTIFICATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function sendAlertSms(recipientPhone, alerts, temperature, humidity, rainfall) {
  if (!semaphoreApiKey || !recipientPhone) {
    console.log('⚠️  SMS notification skipped - Semaphore not configured or no recipient phone');
    return false;
  }

  try {
    // Clean phone number
    let cleanPhone = recipientPhone.trim().replace(/\s+/g, '');
    
    if (cleanPhone.startsWith('+63')) {
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('63')) {
      cleanPhone = '0' + cleanPhone.substring(2);
    }
    
    // Format SMS message
    let smsBody = 'WEATHER ALERT\n\n';
    
    // Add current readings
    smsBody += `Temp: ${temperature}C\n`;
    smsBody += `Humidity: ${humidity}%\n`;
    smsBody += `Rainfall: ${rainfall}mm/hr\n\n`;
    
    // Add top 2 most critical alerts
    const topAlerts = alerts.slice(0, 2);
    smsBody += `Alerts (${alerts.length}):\n`;
    topAlerts.forEach((alert, index) => {
      // Determine alert level from threshold
      let alertLevel = '';
      if (alert.threshold.includes('YELLOW')) {
        alertLevel = 'YELLOW ALERT';
      } else if (alert.threshold.includes('ORANGE')) {
        alertLevel = 'ORANGE ALERT';
      } else if (alert.threshold.includes('RED')) {
        alertLevel = 'RED ALERT';
      }
      
      smsBody += `${index + 1}. ${alert.metric}: ${alert.value}\n`;
      
      if (alertLevel) {
        smsBody += `   ${alertLevel}\n`;
      }
      
      // Add short description (remove PAGASA mentions)
      let shortMsg = alert.message
        .replace(/PAGASA YELLOW ALERT:/g, '')
        .replace(/PAGASA ORANGE ALERT:/g, '')
        .replace(/PAGASA RED ALERT:/g, '')
        .replace(/PAGASA/g, '')
        .trim()
        .split('.')[0]; // Get first sentence only
      
      smsBody += `   ${shortMsg}\n`;
    });
    
    if (alerts.length > 2) {
      smsBody += `+ ${alerts.length - 2} more\n`;
    }
    
    smsBody += `\nCheck dashboard for details.`;
    
    // Ensure within SMS limits
    if (smsBody.length > 450) {
      smsBody = smsBody.substring(0, 447) + '...';
    }

    return await sendSmsViaApi(cleanPhone, smsBody);

  } catch (error) {
    console.error(`❌ SMS FAILED:`, error.message);
    return false;
  }
}

// Simple SMS function for system alerts
async function sendSimpleSms(recipientPhone, message) {
  if (!semaphoreApiKey || !recipientPhone) return false;

  try {
    let cleanPhone = recipientPhone.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('+63')) {
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('63')) {
      cleanPhone = '0' + cleanPhone.substring(2);
    }

    return await sendSmsViaApi(cleanPhone, message);
  } catch (error) {
    console.error(`❌ SMS FAILED:`, error.message);
    return false;
  }
}

// Core SMS sending function with enhanced debugging
async function sendSmsViaApi(cleanPhone, message) {
  console.log('\n🔍 SMS DEBUG INFO:');
  console.log(`   API Endpoint: https://api.semaphore.co/api/v4/messages`);
  console.log(`   Recipient: ${cleanPhone}`);
  console.log(`   Message Length: ${message.length} characters`);
  console.log(`   API Key Present: ${semaphoreApiKey ? 'YES' : 'NO'}`);
  console.log(`   API Key Length: ${semaphoreApiKey ? semaphoreApiKey.length : 0} characters`);
  console.log(`   API Key First 8 chars: ${semaphoreApiKey ? semaphoreApiKey.substring(0, 8) : 'MISSING'}...`);

  const postData = new URLSearchParams({
    apikey: semaphoreApiKey,
    number: cleanPhone,
    message: message
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

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        console.log(`\n📡 HTTP Response:`);
        console.log(`   Status Code: ${res.statusCode}`);
        console.log(`   Status Message: ${res.statusMessage}`);
        
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`   Raw Response: ${data}\n`);
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ success: false, error: 'Invalid JSON response', raw: data });
          }
        });
      });
      req.on('error', (error) => reject(error));
      req.write(postData);
      req.end();
    });

    console.log('📊 Full Response:', JSON.stringify(response, null, 2));

    if (response.message_id || response[0]?.message_id) {
      const messageId = response.message_id || response[0]?.message_id;
      console.log(`\n✅ SMS SENT SUCCESSFULLY`);
      console.log(`   To: ${cleanPhone}`);
      console.log(`   Message ID: ${messageId}`);
      return true;
    } else {
      console.error(`\n❌ SMS FAILED - Detailed Error:`);
      console.error(`   Error: ${response.error || 'Unknown'}`);
      console.error(`   Code: ${response.code || 'N/A'}`);
      console.error(`   Message: ${response.message || 'N/A'}`);
      console.error(`   Full Response: ${JSON.stringify(response)}`);
      return false;
    }
  } catch (error) {
    console.error(`\n❌ SMS REQUEST EXCEPTION:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET EMAIL RECIPIENTS
// ═══════════════════════════════════════════════════════════════════════════════

async function getEmailRecipients() {
  try {
    console.log('📧 Fetching email recipients from Firestore...');
    
    // Get all users who have email notifications enabled
    const usersSnapshot = await firestore.collection('users')
      .where('emailNotifications', '==', true)
      .get();
    
    const recipients = [];
    
    if (!usersSnapshot.empty) {
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.email) {
          recipients.push(userData.email);
        }
      });
    }
    
    // Always include the system admin email as fallback
    if (!recipients.includes(gmailEmail)) {
      recipients.push(gmailEmail);
    }
    
    console.log(`   Found ${recipients.length} email recipient(s)`);
    recipients.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email}`);
    });
    
    return recipients;
    
  } catch (error) {
    console.error('⚠️  Error fetching email recipients:', error.message);
    // Fallback to admin email
    return [gmailEmail];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET SMS SETTINGS FROM FIRESTORE (UPDATED FOR APPROVAL SYSTEM)
// ═══════════════════════════════════════════════════════════════════════════════

async function getSmsSettings() {
  try {
    console.log('📱 Fetching SMS recipients from Firestore...');
    
    // Get ONLY approved and enabled recipients from sms_recipients collection
    const recipientsSnapshot = await firestore.collection('sms_recipients')
      .where('enabled', '==', true)
      .get();
    
    if (recipientsSnapshot.empty) {
      console.log('⚠️  No active SMS recipients found');
      console.log('   → Check if any requests have been approved in admin panel');
      console.log('   → Approved requests should create entries in sms_recipients collection');
      return { enabled: false, phoneNumbers: [] };
    }
    
    // Extract phone numbers with validation
    const phoneNumbers = [];
    
    recipientsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Validate that we have required fields
      if (data.phone && data.enabled === true) {
        phoneNumbers.push({
          number: data.phone,
          label: data.label || 'No label',
          userEmail: data.userEmail || 'unknown',
          addedBy: data.addedBy || 'unknown',
          approvedBy: data.approvedBy || 'unknown'
        });
      }
    });
    
    if (phoneNumbers.length === 0) {
      console.log('⚠️  Found recipient documents but none are valid/enabled');
      return { enabled: false, phoneNumbers: [] };
    }
    
    console.log(`✅ Found ${phoneNumbers.length} approved & active SMS recipient(s):`);
    phoneNumbers.forEach((phone, index) => {
      console.log(`   ${index + 1}. ${phone.number} (${phone.label}) - User: ${phone.userEmail}`);
    });
    
    return {
      enabled: true,
      phoneNumbers: phoneNumbers
    };
    
  } catch (error) {
    console.error('⚠️  Error fetching SMS settings:', error.message);
    console.error('   Stack trace:', error.stack);
    return { enabled: false, phoneNumbers: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ALERT CHECKING FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function checkAlerts() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚨 REAL-TIME ALERT MONITORING SYSTEM (Enhanced)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[${new Date().toISOString()}] Checking sensor readings...`);
  console.log('✨ NEW: Smart cooldown + Sensor offline detection');
  console.log('Thresholds based on: IRRI Research + PAGASA Standards\n');

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
      
      const logsSnapshot = await db.ref('sensor_logs')
        .orderByChild('timestamp')
        .limitToLast(1)
        .once('value');

      if (!logsSnapshot.exists()) {
        console.log('❌ No sensor data found in either location.');
        
        // Send sensor offline alert
        await sendSensorOfflineAlert(999, Date.now() - (999 * 60 * 1000)); // Indicate long offline
        
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

    // **SENSOR HEALTH CHECK**
    const sensorOnline = await checkSensorHealth(timestamp);
    if (!sensorOnline) {
      console.log('⚠️  Sensor is offline - skipping threshold checks');
      console.log('═══════════════════════════════════════════════════════════');
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

    // CHECK TEMPERATURE
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

    // CHECK RAINFALL
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

    // CHECK DISEASE RISK
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

    // **APPLY SMART COOLDOWN FILTER**
    console.log('\n🔍 SMART COOLDOWN CHECK:');
    const alertsToSend = [];
    const suppressedAlerts = [];

    for (const alert of triggeredAlerts) {
      const cooldownCheck = await shouldSendAlert(alert.metric, alert.severity, alert.value);
      
      if (cooldownCheck.shouldSend) {
        alertsToSend.push({
          ...alert,
          cooldownReason: cooldownCheck.reason
        });
      } else {
        suppressedAlerts.push({
          ...alert,
          suppressReason: cooldownCheck.reason,
          minutesRemaining: cooldownCheck.minutesRemaining
        });
      }
    }

    // Show suppressed alerts
    if (suppressedAlerts.length > 0) {
      console.log(`\n⏸️  ${suppressedAlerts.length} ALERT(S) SUPPRESSED (Cooldown Active):`);
      suppressedAlerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. ${alert.metric}: ${alert.value}`);
        console.log(`      → Suppressed: ${alert.suppressReason} (${alert.minutesRemaining} min remaining)\n`);
      });
    }

    // NO ALERTS TO SEND - EXIT EARLY
    if (alertsToSend.length === 0 && triggeredAlerts.length === 0) {
      console.log('\n✅ ALL READINGS WITHIN SAFE RANGES');
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

    if (alertsToSend.length === 0 && suppressedAlerts.length > 0) {
      console.log('\n✅ All alerts suppressed by cooldown - No notifications sent');
      console.log(`   ${suppressedAlerts.length} alert(s) still active but in cooldown period\n`);
      
      await firestore.collection('alerts_history').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'suppressed',
        message: 'Alerts suppressed by cooldown',
        suppressedCount: suppressedAlerts.length,
        readings: { temperature, humidity, rainfall },
        readingTime: readingTime,
        source: readingSource
      });
      
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    // SEND NOTIFICATIONS FOR APPROVED ALERTS
    console.log(`\n⚠️  ${alertsToSend.length} ALERT(S) APPROVED - Sending notifications...\n`);
    
    alertsToSend.forEach((alert, index) => {
      console.log(`${alert.icon} Alert ${index + 1}/${alertsToSend.length}:`);
      console.log(`   Type: ${alert.type}`);
      console.log(`   Metric: ${alert.metric}`);
      console.log(`   Current: ${alert.value} (Threshold: ${alert.threshold})`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Action: ${alert.action}`);
      console.log(`   Source: ${alert.source}`);
      console.log(`   Cooldown Status: ${alert.cooldownReason}\n`);
    });

    const hasCritical = alertsToSend.some(a => a.severity === 'critical');
    const hasWarning = alertsToSend.some(a => a.severity === 'warning');
    
    const emailSubject = hasCritical
      ? '🚨 CRITICAL WEATHER ALERT - Immediate Action Required'
      : hasWarning
      ? '⚠️ Weather Alert - Attention Needed'
      : '📋 Weather Advisory - For Your Information';

    // Build email HTML (same as before)
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.07); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(120deg, ${hasCritical ? '#ef4444, #b91c1c' : hasWarning ? '#fbbf24, #d97706' : '#3b82f6, #1e40af'}); color: #ffffff; padding: 26px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; }
    .content { padding: 26px 28px; }
    .readings { background: #f9fafb; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; text-align: center; flex-wrap: wrap; margin-bottom: 25px; }
    .reading-item { flex: 1; min-width: 120px; background: #ffffff; padding: 12px; border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,0.04); margin: 6px; font-size: 15px; font-weight: 600; color: #1f2937; }
    .alert-box { padding: 20px; border-radius: 14px; margin: 18px 0; border-left: 6px solid; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background: #ffffff; }
    .alert-box.critical { border-left-color: #b91c1c; background: #fef2f2; }
    .alert-box.warning { border-left-color: #d97706; background: #fffbeb; }
    .alert-box.advisory { border-left-color: #1e40af; background: #eff6ff; }
    .alert-title { font-size: 19px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; color: #111827; }
    .alert-detail { font-size: 14px; margin: 6px 0; color: #1f2937; }
    .alert-action { margin-top: 12px; padding: 10px 12px; background: rgba(0,0,0,0.04); border-radius: 8px; font-size: 14px; font-weight: 600; }
    .alert-source { font-size: 12px; color: #6b7280; font-style: italic; margin-top: 8px; display: block; }
    .note { margin-top: 26px; padding: 18px; background: #f0f9ff; border-left: 5px solid #2563eb; border-radius: 10px; font-size: 14px; font-weight: 500; }
    .footer { background: linear-gradient(to top, #f9fafb, #ffffff); padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .footer .brand { font-size: 13px; font-weight: 700; color: #065f46; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${hasCritical ? '🚨' : hasWarning ? '⚠️' : '📋'} Weather Alert</h1>
      <p>${readingTime}</p>
    </div>
    <div class="content">
      <div class="readings">
        <div class="reading-item">🌡️ ${temperature}°C</div>
        <div class="reading-item">💧 ${humidity}%</div>
        <div class="reading-item">🌧️ ${rainfall}mm/hr</div>
      </div>
      <hr style="border: none; height: 1px; background: #e5e7eb; margin: 20px 0;">
      <h3 style="font-size:17px;font-weight:700;color:#111827;">${alertsToSend.length} Alert(s) Triggered:</h3>
      ${alertsToSend.map(alert => `
        <div class="alert-box ${alert.severity}">
          <div class="alert-title">${alert.icon} ${alert.type}: ${alert.metric}</div>
          <div class="alert-detail"><strong>Current:</strong> ${alert.value}</div>
          <div class="alert-detail"><strong>Threshold:</strong> ${alert.threshold}</div>
          <div class="alert-detail">${alert.message}</div>
          <div class="alert-action">📌 <strong>Recommended Action:</strong> ${alert.action}</div>
          <span class="alert-source">Source: ${alert.source}</span>
        </div>
      `).join('')}
      <div class="note">
        <strong>📌 Note:</strong> This is an automated alert with smart cooldown. 
        ${suppressedAlerts.length > 0 ? `${suppressedAlerts.length} additional alert(s) are in cooldown period.` : ''} 
        Check your dashboard for real-time updates.
      </div>
    </div>
    <div class="footer">
      <div class="brand">🌾 AgriSmart Weather Monitoring System</div>
      <p>Smart alerts for Filipino rice farmers • Enhanced with cooldown</p>
    </div>
  </div>
</body>
</html>
    `;

    // Get email recipients dynamically from users who enabled notifications
    const emailRecipients = await getEmailRecipients();

    const mailOptions = {
      from: `Weather Monitoring System <${gmailEmail}>`,
      to: emailRecipients.join(', '),
      subject: emailSubject,
      html: emailBody
    };

    // SEND EMAIL
    await transporter.sendMail(mailOptions);
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log(`   Recipients: ${emailRecipients.join(', ')}`);
    console.log(`   Subject: ${emailSubject}`);
    console.log(`   Alerts: ${alertsToSend.length}\n`);

    // GET SMS SETTINGS AND SEND SMS TO ALL RECIPIENTS
    const smsSettings = await getSmsSettings();
    let smsSentCount = 0;
    let smsFailedCount = 0;
    
    if (smsSettings.enabled && smsSettings.phoneNumbers.length > 0) {
      console.log(`📱 SMS notifications enabled - sending to ${smsSettings.phoneNumbers.length} recipient(s) via Semaphore...`);
      
      for (const phoneObj of smsSettings.phoneNumbers) {
        const label = phoneObj.label ? ` (${phoneObj.label})` : '';
        console.log(`   → Sending to ${phoneObj.number}${label}...`);
        
        const success = await sendAlertSms(phoneObj.number, alertsToSend, temperature, humidity, rainfall);
        
        if (success) {
          smsSentCount++;
          console.log(`      ✅ Sent successfully`);
        } else {
          smsFailedCount++;
          console.log(`      ❌ Failed to send`);
        }
      }
      
      console.log(`\n📊 SMS Summary: ${smsSentCount} sent, ${smsFailedCount} failed\n`);
    } else if (!smsSettings.enabled) {
      console.log('ℹ️  SMS notifications disabled in dashboard settings\n');
    } else if (smsSettings.phoneNumbers.length === 0) {
      console.log('⚠️  SMS enabled but no recipient phone numbers configured\n');
    }

    // LOG TO FIRESTORE
    await firestore.collection('alerts_history').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'alert',
      alertCount: alertsToSend.length,
      suppressedCount: suppressedAlerts.length,
      alerts: alertsToSend.map(a => ({
        type: a.type,
        metric: a.metric,
        value: a.value,
        threshold: a.threshold,
        message: a.message,
        action: a.action,
        source: a.source,
        cooldownReason: a.cooldownReason
      })),
      suppressedAlerts: suppressedAlerts.map(a => ({
        metric: a.metric,
        value: a.value,
        suppressReason: a.suppressReason
      })),
      readings: { temperature, humidity, rainfall },
      readingTime: readingTime,
      emailSent: true,
      smsSentCount: smsSentCount,  // ✅ Use smsSentCount instead
      smsFailedCount: smsFailedCount,  // ✅ Add failed count
      smsProvider: 'semaphore',
      recipients: emailRecipients,
      smsRecipients: smsSettings.enabled ? smsSettings.phoneNumbers.map(p => p.number) : [],  // ✅ Array of numbers
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
  console.log('[COMPLETE] Enhanced alert monitoring finished.\n');
  process.exit(0);
}).catch((error) => {
  console.error('[FAILED] Alert monitoring encountered an error:', error);
  process.exit(1);
});