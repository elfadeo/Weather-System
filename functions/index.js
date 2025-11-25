/**
 * NOTE: This Cloud Function requires Firebase Blaze (paid) plan.
 * Currently using GitHub Actions (check-alerts.js) for the free tier.
 * This function is kept for future scalability and documentation purposes.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Get the email and password from environment variables
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Configure the email transporter using nodemailer
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

/**
 * Sends an alert email to a specific recipient.
 */
async function sendAlertEmail(recipientEmail, alertType, message) {
  const mailOptions = {
    from: `"Weather Monitoring System" <${gmailEmail}>`,
    to: recipientEmail,
    subject: `Weather Alert: ${alertType}`,
    html: `
      <h1>Weather Alert</h1>
      <p>An important weather alert has been triggered.</p>
      <p><strong>Alert Type:</strong> ${alertType}</p>
      <p><strong>Details:</strong> ${message}</p>
      <p>Please check the dashboard for more information.</p>
    `,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Alert email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
  }
}

/**
 * Fetches all user emails from Firebase Authentication.
 */
async function getAllUserEmails() {
  const userEmails = [];
  let nextPageToken;
  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach((userRecord) => {
        if (userRecord.email) {
          userEmails.push(userRecord.email);
        }
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    return userEmails;
  } catch (error) {
    console.error("Error fetching user list:", error);
    return [];
  }
}

/**
 * Checks all weather conditions and triggers alerts if necessary.
 */
exports.checkWeatherDataAndBroadcast = functions.firestore
  .document("weather_data/{dataId}")
  .onCreate(async (snap, context) => {
    const newData = snap.data();
    const { temperature, humidity } = newData;
    const now = admin.firestore.Timestamp.now();

    const thresholdsDoc = await admin.firestore().collection("alerts").doc("thresholds").get();
    if (!thresholdsDoc.exists) {
      console.log("Thresholds document does not exist.");
      return null;
    }
    const thresholds = thresholdsDoc.data();

    const alertsToBroadcast = [];

    // --- Temperature and Humidity Checks (Instantaneous) ---
    if (thresholds.temp_max != null && temperature > thresholds.temp_max) {
      alertsToBroadcast.push({
        type: "HIGH_TEMP",
        message: `Temperature ${temperature.toFixed(1)}°C exceeds the maximum of ${thresholds.temp_max}°C.`,
      });
    }
    if (thresholds.temp_min != null && temperature < thresholds.temp_min) {
      alertsToBroadcast.push({
        type: "LOW_TEMP",
        message: `Temperature ${temperature.toFixed(1)}°C is below the minimum of ${thresholds.temp_min}°C.`,
      });
    }
    if (thresholds.humidity_max != null && humidity > thresholds.humidity_max) {
      alertsToBroadcast.push({
        type: "HIGH_HUMIDITY",
        message: `Humidity ${humidity.toFixed(0)}% exceeds the maximum of ${thresholds.humidity_max}%.`,
      });
    }
    if (thresholds.humidity_min != null && humidity < thresholds.humidity_min) {
      alertsToBroadcast.push({
        type: "LOW_HUMIDITY",
        message: `Humidity ${humidity.toFixed(0)}% is below the minimum of ${thresholds.humidity_min}%.`,
      });
    }

    // --- Rainfall Check (Cumulative over 30 minutes) ---
    if (thresholds.rainfall_max != null) {
      const thirtyMinutesAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 30 * 60 * 1000);

      // Check if a rainfall alert was sent recently to avoid spam
      const recentAlerts = await admin.firestore().collection("alerts_history")
        .where("type", "==", "HEAVY_RAINFALL")
        .where("timestamp", ">", thirtyMinutesAgo)
        .limit(1)
        .get();

      if (recentAlerts.empty) {
        const weatherDataInLast30Mins = await admin.firestore().collection("weather_data")
          .where("timestamp", ">", thirtyMinutesAgo)
          .get();

        let totalRainfall = 0;
        weatherDataInLast30Mins.forEach((doc) => {
          totalRainfall += doc.data().rainfall || 0;
        });

        if (totalRainfall > thresholds.rainfall_max) {
          alertsToBroadcast.push({
            type: "HEAVY_RAINFALL",
            message: `Total rainfall of ${totalRainfall.toFixed(1)}mm in the last 30 minutes exceeds the threshold of ${thresholds.rainfall_max}mm.`,
          });
        }
      } else {
        console.log("A heavy rainfall alert was sent recently. Skipping check.");
      }
    }

    // --- Broadcast Alerts ---
    if (alertsToBroadcast.length > 0) {
      console.log(`${alertsToBroadcast.length} alert(s) triggered.`);
      if (thresholds.email_notifications_enabled) {
        const userEmails = await getAllUserEmails();
        if (userEmails.length > 0) {
          for (const alert of alertsToBroadcast) {
            const emailPromises = userEmails.map((email) => sendAlertEmail(email, alert.type, alert.message));
            await Promise.all(emailPromises);
          }
        }
      }

      // Log alerts to history
      const historyPromises = alertsToBroadcast.map((alert) =>
        admin.firestore().collection("alerts_history").add({
          type: alert.type,
          message: alert.message,
          timestamp: now,
        })
      );
      await Promise.all(historyPromises);
    }

    return null;
  });