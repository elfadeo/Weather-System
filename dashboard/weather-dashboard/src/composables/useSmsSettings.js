import { ref } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

export function useSmsSettings() {
  const smsSettings = ref({
    enabled: false,
    phoneNumbers: [],
  })
  const originalSmsSettings = ref({})

  const fetchSmsSettings = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'thresholds')
      const settingsSnap = await getDoc(settingsRef)

      if (settingsSnap.exists()) {
        const data = settingsSnap.data()

        // Handle new array format
        if (data.recipient_phone_numbers && Array.isArray(data.recipient_phone_numbers)) {
          smsSettings.value = {
            enabled: data.sms_notifications_enabled || false,
            phoneNumbers: data.recipient_phone_numbers.map((item, index) => ({
              id: item.id || Date.now() + index, // 🔧 FIX: Add unique ID
              number: item.number || '',
              label: item.label || '',
              error: '',
            })),
          }
        }
        // Migrate from old single number format
        else if (data.recipient_phone_number) {
          smsSettings.value = {
            enabled: data.sms_notifications_enabled || false,
            phoneNumbers: [
              {
                id: Date.now(), // 🔧 FIX: Add unique ID
                number: data.recipient_phone_number,
                label: 'Primary',
                error: '',
              },
            ],
          }
        }
        // No numbers saved
        else {
          smsSettings.value = { enabled: false, phoneNumbers: [] }
        }
      }

      originalSmsSettings.value = JSON.parse(JSON.stringify(smsSettings.value))
    } catch (error) {
      console.error('Error fetching SMS settings:', error)
      throw error
    }
  }

  return {
    smsSettings,
    originalSmsSettings,
    fetchSmsSettings,
  }
}
