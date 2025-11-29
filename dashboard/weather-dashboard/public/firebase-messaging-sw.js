// public/firebase-messaging-sw.js
/* eslint-env serviceworker */
/* global firebase */

// ⚠️ Service workers CANNOT use ES6 imports - must use importScripts

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCtavnWUJxu5bpcEvv5_WQGEHbhlqYydBM",
  authDomain: "weather-monitoring-syste-3c1ea.firebaseapp.com",
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "weather-monitoring-syste-3c1ea",
  storageBucket: "weather-monitoring-syste-3c1ea.firebasestorage.app",
  messagingSenderId: "522088136121",
  appId: "1:522088136121:web:0d4a62ec896bca53170a68",
  measurementId: "G-DZPJWXG5J0"
})

const messaging = firebase.messaging()

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || '🚨 Weather Alert'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new weather alert',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    tag: 'weather-alert', // Replace old notifications
    requireInteraction: true, // Keep visible until user clicks
    data: {
      url: payload.fcmOptions?.link || payload.data?.link || '/alerts',
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event.action)

  event.notification.close()

  if (event.action === 'close') {
    return // Just close the notification
  }

  // Get the URL to open (default to alerts page)
  const urlToOpen = new URL(event.notification.data?.url || '/alerts', self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // First, try to find an existing window with our app
      for (const client of windowClients) {
        // Check if this is our app's domain
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // Navigate to the alerts page and focus the window
          client.focus()
          return client.navigate(urlToOpen)
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
