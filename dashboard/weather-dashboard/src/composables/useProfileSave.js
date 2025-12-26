import { ref } from 'vue'
import { auth, db } from '@/firebase'
import { updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { formatPhoneNumber } from '@/utils/phoneUtils'

export function useProfileSave(user, profile, originalProfile, smsSettings, originalSmsSettings) {
  const isSaving = ref(false)
  const saveStatus = ref('')

  const saveProfile = async () => {
    if (!user.value) return

    // Validation
    if (!profile.value.displayName.trim()) {
      saveStatus.value = 'Error: Display name cannot be empty'
      return
    }

    if (smsSettings.value.enabled) {
      if (smsSettings.value.phoneNumbers.length === 0) {
        saveStatus.value = 'Error: Add at least one phone number'
        return
      }

      const hasErrors = smsSettings.value.phoneNumbers.some((phone) => phone.error)
      if (hasErrors) {
        saveStatus.value = 'Error: Fix invalid phone numbers'
        return
      }
    }

    isSaving.value = true
    saveStatus.value = ''

    try {
      // Update Firebase Auth profile
      if (auth.currentUser && auth.currentUser.displayName !== profile.value.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: profile.value.displayName,
          photoURL: profile.value.photoURL || auth.currentUser.photoURL || '',
        })
      }

      // Save user profile to Firestore
      const userDocRef = doc(db, 'users', user.value.uid)
      await setDoc(
        userDocRef,
        {
          displayName: profile.value.displayName,
          location: profile.value.location,
          emailNotifications: profile.value.emailNotifications,
          photoURL: profile.value.photoURL,
          email: user.value.email,
          updatedAt: new Date(),
        },
        { merge: true },
      )

      // Format and save phone numbers
      const formattedPhoneNumbers = smsSettings.value.phoneNumbers
        .filter((phone) => phone.number)
        .map((phone) => ({
          number: formatPhoneNumber(phone.number),
          label: phone.label || '',
        }))

      const settingsRef = doc(db, 'settings', 'thresholds')
      await setDoc(
        settingsRef,
        {
          sms_notifications_enabled: smsSettings.value.enabled,
          recipient_phone_numbers: formattedPhoneNumbers,
          recipient_phone_number: formattedPhoneNumbers[0]?.number || '',
        },
        { merge: true },
      )

      // 🔧 FIX: Preserve IDs when updating local state
      smsSettings.value.phoneNumbers = smsSettings.value.phoneNumbers.map((phone, index) => ({
        id: phone.id || Date.now() + index, // Preserve or create ID
        number: formatPhoneNumber(phone.number),
        label: phone.label || '',
        error: '',
      }))

      // Update originals for change detection
      originalProfile.value = { ...profile.value }
      originalSmsSettings.value = JSON.parse(JSON.stringify(smsSettings.value))

      saveStatus.value = 'Saved successfully!'

      // Auto-clear success message
      setTimeout(() => {
        if (!saveStatus.value.includes('Error')) {
          saveStatus.value = ''
        }
      }, 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      saveStatus.value = `Error: ${error.message}`
    } finally {
      isSaving.value = false
    }
  }

  return {
    isSaving,
    saveStatus,
    saveProfile,
  }
}
