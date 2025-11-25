// scripts/check-all-alerts.js
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY not set.');
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      databaseURL: 'https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app/'
    });
  } catch (error) {
    console.error('Error initializing Firebase:', error.message);
    process.exit(1);
  }
}

const rtdb = admin.database();
const firestore = admin.firestore();

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendAlertEmail(recipientEmail, alerts) {
  const alertsList = alerts.map(alert => `
    <div style="margin: 15px 0; padding: 15px; background: #f9fafb; border-left: 4px solid ${alert.color || '#3b82f6'}; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; color: ${alert.color || '#3b82f6'};">${alert.title || alert.type}</h3>
      <p style="margin: 0 0 10px 0; color: #374151;"><strong>${alert.message}</strong></p>
      ${alert.recommendation ? `
        <p style="margin: 0; padding: 10px; background: #dbeafe; border-radius: 4px; color: #1e40af;">
          <strong>💡 Recommendation:</strong> ${alert.recommendation}
        </p>
      ` : ''}
      ${alert.reference ? `
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
          <strong>📚 Source:</strong> ${alert.reference}
        </p>
      ` : ''}
    </div>
  `).join('');

  const mailOptions = {
    from: `"Weather Monitoring System" <${process.env.GMAIL_EMAIL}>`,
    to: recipientEmail,
    subject: `🌡️ Weather Alert - ${alerts.length} Condition(s) Detected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">⚠️ Weather Alert</h1>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 10px 10px;">
          ${alertsList}
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 20px;">
          ${new Date().toLocaleString()}
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`✗ Email failed:`, error.message);
  }
}

async function getAllUserEmails() {
  try {
    const userEmails = [];
    let nextPageToken;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach(user => {
        if (user.email) userEmails.push(user.email);
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);
    return userEmails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
}

async function checkAllAlerts() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE ALERT MONITORING SYSTEM              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`Started: ${new Date().toLocaleString()}\n`);
  
  try {
    // Get thresholds
    const thresholdsDoc = await firestore.collection('alerts').doc('thresholds').get();
    if (!thresholdsDoc.exists) {
      console.log('⚠️  No thresholds configured.');
      return;
    }
    
    const thresholds = thresholdsDoc.data();
    const agricultureMode = thresholds.agriculture_mode_enabled || false;
    
    console.log('📋 Configuration:');
    console.log(`  • Agriculture Mode: ${agricultureMode ? 'ON 🌾' : 'OFF'}`);
    console.log(`  • Email Alerts: ${thresholds.email_notifications_enabled ? 'ON' : 'OFF'}`);
    
    // Get latest sensor data
    const latestSnapshot = await rtdb.ref('sensor_logs')
      .orderByChild('timestamp')
      .limitToLast(1)
      .once('value');
    
    if (!latestSnapshot.exists()) {
      console.log('\n⚠️  No sensor data available.');
      return;
    }
    
    const latestData = Object.values(latestSnapshot.val())[0];
    const { temperature, humidity, rainfall } = latestData;
    
    console.log('\n📊 Current Conditions:');
    console.log(`  • Temperature: ${temperature.toFixed(1)}°C`);
    console.log(`  • Humidity: ${humidity.toFixed(0)}%`);
    console.log(`  • Rainfall: ${rainfall.toFixed(1)}mm`);
    
    const alerts = [];
    const now = admin.firestore.Timestamp.now();
    
    console.log('\n🔍 Checking Thresholds...\n');
    
    // ===== STANDARD ALERTS =====
    console.log('📌 Standard Monitoring:');
    
    if (thresholds.temp_max && temperature > thresholds.temp_max) {
      alerts.push({
        type: 'HIGH_TEMP',
        title: 'High Temperature',
        message: `Temperature ${temperature.toFixed(1)}°C exceeds max threshold of ${thresholds.temp_max}°C`,
        timestamp: now,
        color: '#dc2626'
      });
      console.log(`  ⚠️  HIGH TEMP: ${temperature.toFixed(1)}°C > ${thresholds.temp_max}°C`);
    }
    
    if (thresholds.temp_min && temperature < thresholds.temp_min) {
      alerts.push({
        type: 'LOW_TEMP',
        title: 'Low Temperature',
        message: `Temperature ${temperature.toFixed(1)}°C below min threshold of ${thresholds.temp_min}°C`,
        timestamp: now,
        color: '#2563eb'
      });
      console.log(`  ⚠️  LOW TEMP: ${temperature.toFixed(1)}°C < ${thresholds.temp_min}°C`);
    }
    
    if (thresholds.humidity_max && humidity > thresholds.humidity_max) {
      alerts.push({
        type: 'HIGH_HUMIDITY',
        title: 'High Humidity',
        message: `Humidity ${humidity.toFixed(0)}% exceeds max threshold of ${thresholds.humidity_max}%`,
        timestamp: now,
        color: '#7c3aed'
      });
      console.log(`  ⚠️  HIGH HUMIDITY: ${humidity.toFixed(0)}% > ${thresholds.humidity_max}%`);
    }
    
    if (thresholds.humidity_min && humidity < thresholds.humidity_min) {
      alerts.push({
        type: 'LOW_HUMIDITY',
        title: 'Low Humidity',
        message: `Humidity ${humidity.toFixed(0)}% below min threshold of ${thresholds.humidity_min}%`,
        timestamp: now,
        color: '#ca8a04'
      });
      console.log(`  ⚠️  LOW HUMIDITY: ${humidity.toFixed(0)}% < ${thresholds.humidity_min}%`);
    }
    
    if (thresholds.rainfall_max && rainfall > thresholds.rainfall_max) {
      alerts.push({
        type: 'HEAVY_RAINFALL',
        title: 'Heavy Rainfall',
        message: `Rainfall ${rainfall.toFixed(1)}mm exceeds threshold of ${thresholds.rainfall_max}mm`,
        timestamp: now,
        color: '#0891b2'
      });
      console.log(`  ⚠️  HEAVY RAINFALL: ${rainfall.toFixed(1)}mm > ${thresholds.rainfall_max}mm`);
    }
    
    if (alerts.length === 0) {
      console.log('  ✅ All standard parameters within range');
    }
    
    // ===== AGRICULTURAL ALERTS (if enabled) =====
    if (agricultureMode) {
      console.log('\n🌾 Agricultural Monitoring:');
      
      // Heat Stress
      const tempCritical = thresholds.temp_critical || 35;
      if (temperature > tempCritical) {
        alerts.push({
          type: 'HEAT_STRESS',
          title: '🌡️ Critical Heat Stress',
          message: `Temperature ${temperature.toFixed(1)}°C exceeds critical ${tempCritical}°C. Risk of spikelet sterility.`,
          recommendation: 'URGENT: Flood field to 5-10cm depth to cool soil temperature.',
          reference: 'IRRI: High temps (>35°C) during flowering cause spikelet sterility',
          timestamp: now,
          color: '#dc2626'
        });
        console.log(`  🔴 HEAT STRESS: ${temperature.toFixed(1)}°C`);
      }
      
      // PAGASA Rainfall System
      const rainfallRed = thresholds.rainfall_red || 30;
      const rainfallOrange = thresholds.rainfall_orange || 15;
      const rainfallYellow = thresholds.rainfall_yellow || 7.5;
      
      if (rainfall > rainfallRed) {
        alerts.push({
          type: 'RAINFALL_RED',
          title: '🔴 Red Rainfall Alert',
          message: `Rainfall ${rainfall.toFixed(1)}mm/hr - CRITICAL flood risk`,
          recommendation: 'Clear drainage pathways immediately. Seedlings at risk if flooded >3 days.',
          reference: 'PAGASA: Red alert = immediate flood danger',
          timestamp: now,
          color: '#dc2626'
        });
        console.log(`  🔴 RED ALERT: ${rainfall.toFixed(1)}mm/hr`);
      } else if (rainfall > rainfallOrange) {
        alerts.push({
          type: 'RAINFALL_ORANGE',
          title: '🟠 Orange Rainfall Warning',
          message: `Rainfall ${rainfall.toFixed(1)}mm/hr - Soil saturation`,
          recommendation: 'Open drainage canals, prepare for overflow.',
          reference: 'PAGASA: Orange = overflow risk',
          timestamp: now,
          color: '#ea580c'
        });
        console.log(`  🟠 ORANGE WARNING: ${rainfall.toFixed(1)}mm/hr`);
      } else if (rainfall > rainfallYellow) {
        alerts.push({
          type: 'RAINFALL_YELLOW',
          title: '🟡 Yellow Rainfall Advisory',
          message: `Rainfall ${rainfall.toFixed(1)}mm/hr - Monitor water levels`,
          recommendation: 'Check drainage systems are functioning.',
          reference: 'PAGASA: Yellow = monitoring required',
          timestamp: now,
          color: '#ca8a04'
        });
        console.log(`  🟡 YELLOW ADVISORY: ${rainfall.toFixed(1)}mm/hr`);
      }
      
      // Disease Monitoring
      if (thresholds.disease_monitoring_enabled) {
        // Rice Blast
        if (humidity > 90 && temperature >= 24 && temperature <= 28) {
          alerts.push({
            type: 'RICE_BLAST_RISK',
            title: '🍄 Rice Blast Risk',
            message: `Conditions favor Rice Blast fungus: ${humidity.toFixed(0)}% RH, ${temperature.toFixed(1)}°C`,
            recommendation: 'Monitor for leaf lesions. Consider preventive fungicide if history exists.',
            reference: 'IRRI: Rice blast thrives at high RH (>90%) + cool temps (24-28°C)',
            timestamp: now,
            color: '#2563eb'
          });
          console.log(`  🍄 RICE BLAST RISK`);
        }
        
        // Bacterial Blight
        if (humidity > 85 && temperature > 30) {
          alerts.push({
            type: 'BACTERIAL_BLIGHT_RISK',
            title: '🦠 Bacterial Blight Risk',
            message: `Conditions favor Bacterial Blight: ${humidity.toFixed(0)}% RH, ${temperature.toFixed(1)}°C`,
            recommendation: 'Scout for yellowing leaf tips. Improve air circulation.',
            reference: 'IRRI: Bacterial blight favors high RH (>85%) + heat (>30°C)',
            timestamp: now,
            color: '#ea580c'
          });
          console.log(`  🦠 BACTERIAL BLIGHT RISK`);
        }
      }
      
      const agriAlertsCount = alerts.filter(a => 
        ['HEAT_STRESS', 'RAINFALL_YELLOW', 'RAINFALL_ORANGE', 'RAINFALL_RED', 'RICE_BLAST_RISK', 'BACTERIAL_BLIGHT_RISK'].includes(a.type)
      ).length;
      
      if (agriAlertsCount === 0) {
        console.log('  ✅ Agricultural parameters within safe range');
      }
    }
    
    // Process alerts
    if (alerts.length > 0) {
      console.log(`\n🚨 TOTAL ALERTS: ${alerts.length}\n`);
      
      // Save to Firestore
      const batch = firestore.batch();
      alerts.forEach(alert => {
        const ref = firestore.collection('alerts_history').doc();
        batch.set(ref, alert);
      });
      await batch.commit();
      console.log('💾 Alerts saved to database');
      
      // Send emails
      if (thresholds.email_notifications_enabled) {
        const emails = await getAllUserEmails();
        if (emails.length > 0) {
          console.log(`📧 Sending to ${emails.length} recipient(s)...`);
          for (const email of emails) {
            await sendAlertEmail(email, alerts);
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
      
      console.log('\n📝 Summary:');
      alerts.forEach((a, i) => console.log(`  ${i+1}. ${a.title || a.type}`));
      
    } else {
      console.log('\n✅ All conditions normal - No alerts triggered');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  }
}

checkAllAlerts()
  .then(() => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ MONITORING COMPLETE                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ MONITORING FAILED\n');
    console.error(error);
    process.exit(1);
  });