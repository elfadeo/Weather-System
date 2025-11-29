// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

// Exports
export const auth = getAuth(app)
export const db = getFirestore(app) // Firestore
export const rtdb = getDatabase(app) // Realtime Database
export const storage = getStorage(app)
export const messaging = getMessaging(app)

// Request notification permission and register FCM token
export const requestPermission = async () => {
  console.log('🔔 Requesting notification permission...')

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('⚠️ This browser does not support notifications')
    return false
  }

  try {
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      console.log('✅ Notification permission granted')

      // Get FCM token
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

      if (!vapidKey) {
        console.error('❌ VAPID key not found in environment variables')
        return false
      }

      try {
        const currentToken = await getToken(messaging, { vapidKey })

        if (currentToken) {
          console.log('📱 FCM Token obtained:', currentToken)

          // Check if token already exists in Firestore
          const tokensRef = collection(db, 'fcm_tokens')
          const q = query(tokensRef, where('token', '==', currentToken))
          const querySnapshot = await getDocs(q)

          if (querySnapshot.empty) {
            // Save token to Firestore with metadata
            await addDoc(tokensRef, {
              token: currentToken,
              createdAt: new Date(),
              updatedAt: new Date(),
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              userId: auth.currentUser?.uid || 'anonymous'
            })
            console.log('✅ FCM token saved to Firestore')
          } else {
            console.log('✅ FCM token already registered')
          }

          return currentToken
        } else {
          console.log('⚠️ No registration token available')
          return null
        }
      } catch (err) {
        console.error('❌ Error getting FCM token:', err)
        return null
      }
    } else if (permission === 'denied') {
      console.log('❌ Notification permission denied')
      return false
    } else {
      console.log('⚠️ Notification permission dismissed')
      return false
    }
  } catch (error) {
    console.error('❌ Error requesting permission:', error)
    return false
  }
}

// Listen for foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📨 Foreground message received:', payload)

      // Show notification even in foreground
      const { title, body, icon } = payload.notification || {}

      if (title && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: icon || '/favicon.png',
          badge: '/favicon.png',
          vibrate: [200, 100, 200],
          tag: 'weather-alert',
          requireInteraction: true,
          data: payload.data
        })
      }

      resolve(payload)
    })
  })
}

// Setup foreground message listener (call this in your main App component)
export const setupForegroundListener = () => {
  onMessage(messaging, (payload) => {
    console.log('📨 Message received while app is in foreground:', payload)

    // Extract notification data
    const notificationTitle = payload.notification?.title || '🚨 Weather Alert'
    const notificationBody = payload.notification?.body || 'You have a new alert'
    const notificationIcon = payload.notification?.icon || '/favicon.png'

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: notificationIcon,
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        tag: 'weather-alert',
        requireInteraction: true
      })

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
        // Navigate to alerts page
        window.location.href = '/alerts'
      }
    }
  })
}
