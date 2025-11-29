// composables/usePushNotifications.js
import { ref, onMounted } from 'vue'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { db } from '@/firebase'
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore'

export function usePushNotifications() {
  const isSupported = ref(false)
  const isPermissionGranted = ref(false)
  const currentToken = ref(null)
  const notificationPermission = ref(Notification.permission)

  // Check if push notifications are supported
  const checkSupport = () => {
    isSupported.value = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    return isSupported.value
  }

  // Request notification permission and register FCM token
  const requestPermission = async () => {
    if (!checkSupport()) {
      console.log('❌ Push notifications not supported in this browser')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission
      isPermissionGranted.value = permission === 'granted'

      if (isPermissionGranted.value) {
        console.log('✅ Notification permission granted')
        await registerToken()
      } else {
        console.log('⚠️ Notification permission denied')
      }

      return isPermissionGranted.value
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      return false
    }
  }

  // Register FCM token to Firestore
  const registerToken = async () => {
    try {
      const messaging = getMessaging()

      // Get VAPID key from environment variable
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

      if (!vapidKey) {
        console.error('❌ VAPID key not found in environment variables')
        console.error('   Add VITE_FIREBASE_VAPID_KEY to your .env file')
        return null
      }

      // Get FCM token
      const token = await getToken(messaging, { vapidKey })

      if (token) {
        currentToken.value = token
        console.log('📱 FCM Token obtained:', token.substring(0, 20) + '...')

        // Check if token already exists in Firestore
        const tokensRef = collection(db, 'fcm_tokens')
        const q = query(tokensRef, where('token', '==', token))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          // Save new token to Firestore
          await addDoc(tokensRef, {
            token: token,
            createdAt: new Date(),
            updatedAt: new Date(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
          })
          console.log('✅ FCM token registered in Firestore')
        } else {
          console.log('✅ FCM token already registered')
        }

        return token
      } else {
        console.log('⚠️ No FCM token available')
        return null
      }
    } catch (error) {
      console.error('❌ Error registering FCM token:', error)
      if (error.code === 'messaging/permission-blocked') {
        console.error('   User has blocked notifications')
      }
      return null
    }
  }

  // Unregister token (when user disables notifications)
  const unregisterToken = async () => {
    if (!currentToken.value) {
      console.log('⚠️ No token to unregister')
      return
    }

    try {
      const tokensRef = collection(db, 'fcm_tokens')
      const q = query(tokensRef, where('token', '==', currentToken.value))
      const querySnapshot = await getDocs(q)

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      currentToken.value = null
      console.log('✅ FCM token unregistered from Firestore')
    } catch (error) {
      console.error('❌ Error unregistering FCM token:', error)
    }
  }

  // Listen for foreground messages
  const setupForegroundListener = () => {
    try {
      const messaging = getMessaging()

      onMessage(messaging, (payload) => {
        console.log('📨 Foreground message received:', payload)

        // Show custom notification when app is in foreground
        const { title, body, icon } = payload.notification || {}

        if (title && Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body: body,
            icon: icon || '/favicon.png',
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
    } catch (error) {
      console.error('❌ Error setting up foreground listener:', error)
    }
  }

  // Initialize on mount
  onMounted(() => {
    checkSupport()

    if (isSupported.value && Notification.permission === 'granted') {
      isPermissionGranted.value = true
      registerToken()
      setupForegroundListener()
    }
  })

  return {
    isSupported,
    isPermissionGranted,
    notificationPermission,
    currentToken,
    requestPermission,
    unregisterToken,
    checkSupport
  }
}
