<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Profile Settings</h1>
        <p class="text-text-light mt-2">Manage your account information and preferences.</p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center p-12 bg-white/70 dark:bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm"
      >
        <div class="flex flex-col items-center space-y-3">
          <svg
            class="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-gray-600 dark:text-text-light">Loading your profile...</p>
        </div>
      </div>

      <!-- Profile Content -->
      <div v-else class="space-y-6">
        <!-- Profile Information Card -->
        <div
          class="bg-white/70 dark:bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-hover"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-text-main mb-6">
            Profile Information
          </h2>

          <!-- Avatar Section -->
          <div class="flex items-center pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
            <div class="relative">
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold shadow-lg"
              >
                <img
                  v-if="profile.photoURL && profile.photoURL !== ''"
                  :src="profile.photoURL"
                  alt="Profile Avatar"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ avatarInitials }}</span>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-lg font-semibold text-gray-900 dark:text-text-main">
                {{ profile.displayName || 'No name set' }}
              </p>
              <p class="text-sm text-gray-600 dark:text-text-light">{{ user?.email }}</p>
            </div>
          </div>

          <!-- Profile Fields -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-text-light mb-2">
                Email Address
              </label>
              <input
                type="email"
                :value="user?.email"
                disabled
                class="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm cursor-not-allowed text-gray-500 dark:text-gray-400 px-4 py-2.5"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label
                for="displayName"
                class="block text-sm font-medium text-gray-700 dark:text-text-light mb-2"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                v-model="profile.displayName"
                placeholder="e.g., Juan Dela Cruz"
                class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-text-main px-4 py-2.5 transition"
              />
            </div>

            <div>
              <label
                for="location"
                class="block text-sm font-medium text-gray-700 dark:text-text-light mb-2"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                v-model="profile.location"
                placeholder="e.g., Manila, Philippines"
                class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-text-main px-4 py-2.5 transition"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This helps in providing more localized recommendations
              </p>
            </div>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div
          class="bg-white/70 dark:bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-hover"
        >
          <h2 class="text-xl font-bold text-gray-900 dark:text-text-main mb-6">
            Notification Settings
          </h2>

          <div class="space-y-4">
            <!-- Email Notifications -->
            <div
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <Icon
                    icon="ph:envelope-simple-bold"
                    class="h-5 w-5 text-gray-600 dark:text-gray-400"
                  />
                  <span class="text-sm font-medium text-gray-900 dark:text-text-main"
                    >Email Notifications</span
                  >
                </div>
                <p class="text-xs text-gray-600 dark:text-text-light mt-1 ml-7">
                  Receive alert emails when thresholds are exceeded
                </p>
              </div>
              <button
                @click="profile.emailNotifications = !profile.emailNotifications"
                :class="profile.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span
                  :class="profile.emailNotifications ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                ></span>
              </button>
            </div>

            <!-- Push Notifications -->
            <PushNotificationSettings />

            <!-- SMS Notifications with Multiple Numbers -->
            <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <Icon
                      icon="ph:device-mobile-bold"
                      class="h-5 w-5 text-gray-600 dark:text-gray-400"
                    />
                    <span class="text-sm font-medium text-gray-900 dark:text-text-main"
                      >SMS Notifications</span
                    >
                  </div>
                  <p class="text-xs text-gray-600 dark:text-text-light mt-1 ml-7">
                    Receive text alerts via Semaphore (PH provider)
                  </p>
                </div>
                <button
                  @click="smsSettings.enabled = !smsSettings.enabled"
                  :class="smsSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    :class="smsSettings.enabled ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  ></span>
                </button>
              </div>

              <!-- Multiple Phone Numbers Section -->
              <Transition name="fade-slide">
                <div v-if="smsSettings.enabled" class="mt-3 space-y-3">
                  <!-- Header with count -->
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Phone Numbers ({{ smsSettings.phoneNumbers.length }}/5)
                    </label>
                    <button
                      @click="addPhoneNumber"
                      :disabled="smsSettings.phoneNumbers.length >= 5"
                      class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon icon="ph:plus-bold" class="h-3 w-3" />
                      Add Number
                    </button>
                  </div>

                  <!-- List of Phone Numbers -->
                  <div class="space-y-2">
                    <div
                      v-for="(phone, index) in smsSettings.phoneNumbers"
                      :key="index"
                      class="flex items-start gap-2"
                    >
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <input
                            type="tel"
                            v-model="smsSettings.phoneNumbers[index].number"
                            placeholder="09171234567 or +639171234567"
                            class="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-text-main px-3 py-2 text-sm transition"
                            @blur="validatePhoneNumber(index)"
                          />
                          <button
                            @click="removePhoneNumber(index)"
                            class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Remove number"
                          >
                            <Icon icon="ph:trash-bold" class="h-4 w-4" />
                          </button>
                        </div>

                        <!-- Optional Label -->
                        <input
                          type="text"
                          v-model="smsSettings.phoneNumbers[index].label"
                          placeholder="Label (optional): e.g., 'Farm Manager', 'Assistant'"
                          class="mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-text-main px-3 py-1.5 text-xs transition"
                        />

                        <!-- Validation Error for this number -->
                        <p
                          v-if="phone.error"
                          class="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1"
                        >
                          <Icon icon="ph:warning-bold" class="h-3 w-3" />
                          {{ phone.error }}
                        </p>
                      </div>
                    </div>

                    <!-- Empty state -->
                    <div
                      v-if="smsSettings.phoneNumbers.length === 0"
                      class="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <Icon icon="ph:phone-plus-bold" class="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No phone numbers added yet</p>
                      <p class="text-xs mt-1">Click "Add Number" to start receiving SMS alerts</p>
                    </div>
                  </div>

                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Format: 09171234567 or +639171234567 • Maximum 5 numbers
                  </p>

                  <!-- Info Banner -->
                  <div
                    class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div class="flex gap-2">
                      <Icon
                        icon="ph:info-bold"
                        class="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                      />
                      <div class="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <p>
                          All numbers will receive SMS alerts via Semaphore API when weather thresholds are exceeded.
                        </p>
                        <p class="font-medium">
                          💡 Tip: Add multiple numbers for farm managers, assistants, or family members!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- System Information -->
        <div
          class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-sm p-6 border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-start space-x-3">
            <Icon
              icon="ph:info-bold"
              class="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            />
            <div class="flex-1">
              <h3 class="font-bold text-blue-900 dark:text-blue-100 mb-2">About Alert System</h3>
              <div class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  <strong>📧 Email Alerts:</strong> Automated via GitHub Actions every 15 minutes.
                  Emails are sent when sensor readings exceed scientifically validated thresholds
                  (IRRI & PAGASA).
                </p>
                <p>
                  <strong>📱 Push Notifications:</strong> Instant browser notifications delivered to
                  your device, even when the app is closed. Enable above for real-time alerts.
                </p>
                <p>
                  <strong>💬 SMS Alerts:</strong> Text message notifications sent via Semaphore API
                  (Philippine provider) when critical weather conditions are detected. All saved numbers will receive alerts simultaneously.
                </p>
                <p class="text-xs text-blue-600 dark:text-blue-300 mt-2">
                  All thresholds are based on peer-reviewed research from IRRI (International Rice
                  Research Institute) and PAGASA (Philippine weather authority).
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex items-center justify-between pt-4">
          <div class="flex-1">
            <p
              v-if="saveStatus"
              class="text-sm font-medium"
              :class="
                saveStatus.includes('Error')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              "
            >
              <Icon
                :icon="saveStatus.includes('Error') ? 'ph:x-circle-bold' : 'ph:check-circle-bold'"
                class="inline h-4 w-4 mr-1"
              />
              {{ saveStatus }}
            </p>
          </div>
          <button
            @click="saveProfile"
            :disabled="isSaving || !hasChanges"
            class="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Icon v-if="isSaving" icon="ph:circle-notch-bold" class="animate-spin h-5 w-5 mr-2" />
            <Icon v-else icon="ph:floppy-disk-bold" class="h-5 w-5 mr-2" />
            <span v-if="isSaving">Saving...</span>
            <span v-else>{{ hasChanges ? 'Save Changes' : 'No Changes' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase.js'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Icon } from '@iconify/vue'
import PushNotificationSettings from '@/components/PushNotificationSettings.vue'

const router = useRouter()

const user = ref(null)
const profile = ref({
  displayName: '',
  location: '',
  emailNotifications: true,
  photoURL: '',
})
const originalProfile = ref({})

// SMS Settings - Now supports multiple phone numbers
const smsSettings = ref({
  enabled: false,
  phoneNumbers: [], // Array of { number: string, label: string, error: string }
})
const originalSmsSettings = ref({})

const isLoading = ref(true)
const isSaving = ref(false)
const saveStatus = ref('')

const avatarInitials = computed(() => {
  const name = profile.value.displayName || user.value?.email || ''
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || '?'
  )
})

const hasChanges = computed(() => {
  const profileChanged = JSON.stringify(profile.value) !== JSON.stringify(originalProfile.value)
  const smsChanged = JSON.stringify(smsSettings.value) !== JSON.stringify(originalSmsSettings.value)
  return profileChanged || smsChanged
})

// Phone number validation
const isValidPhoneNumber = (phone) => {
  if (!phone) return false
  const cleaned = phone.replace(/\s+/g, '')
  return /^(\+639|09|639)\d{9}$/.test(cleaned)
}

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\s+/g, '')
  if (cleaned.startsWith('+63')) {
    return cleaned
  } else if (cleaned.startsWith('09')) {
    return '+63' + cleaned.substring(1)
  } else if (cleaned.startsWith('639')) {
    return '+' + cleaned
  }
  return cleaned
}

// Add new phone number
const addPhoneNumber = () => {
  if (smsSettings.value.phoneNumbers.length < 5) {
    smsSettings.value.phoneNumbers.push({
      number: '',
      label: '',
      error: ''
    })
  }
}

// Remove phone number
const removePhoneNumber = (index) => {
  smsSettings.value.phoneNumbers.splice(index, 1)
}

// Validate individual phone number
const validatePhoneNumber = (index) => {
  const phone = smsSettings.value.phoneNumbers[index]
  phone.error = ''

  if (!phone.number) {
    phone.error = 'Phone number is required'
  } else if (!isValidPhoneNumber(phone.number)) {
    phone.error = 'Invalid format. Use 09171234567 or +639171234567'
  } else {
    // Check for duplicates
    const formatted = formatPhoneNumber(phone.number)
    const duplicates = smsSettings.value.phoneNumbers.filter(
      (p, i) => i !== index && formatPhoneNumber(p.number) === formatted
    )
    if (duplicates.length > 0) {
      phone.error = 'This number is already added'
    }
  }
}

let unsubscribe = null

onMounted(() => {
  if (!unsubscribe) {
    unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        user.value = currentUser
        await fetchUserProfile(currentUser.uid)
        await fetchSmsSettings()
      } else {
        router.push('/login')
      }
      isLoading.value = false
    })
  }
})

onUnmounted(() => {
  unsubscribe?.()
})

const fetchUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid)
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      profile.value = { ...profile.value, ...(docSnap.data() ?? {}) }
    } else {
      profile.value.displayName = user.value?.displayName || ''
      profile.value.photoURL = user.value?.photoURL || ''
    }
    originalProfile.value = { ...profile.value }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    saveStatus.value = 'Error: Could not load profile.'
  }
}

const fetchSmsSettings = async () => {
  try {
    const settingsRef = doc(db, 'settings', 'thresholds')
    const settingsSnap = await getDoc(settingsRef)

    if (settingsSnap.exists()) {
      const data = settingsSnap.data()

      // Handle both old single number format and new multiple numbers format
      if (data.recipient_phone_numbers && Array.isArray(data.recipient_phone_numbers)) {
        // New format: array of phone objects
        smsSettings.value = {
          enabled: data.sms_notifications_enabled || false,
          phoneNumbers: data.recipient_phone_numbers.map(item => ({
            number: item.number || '',
            label: item.label || '',
            error: ''
          }))
        }
      } else if (data.recipient_phone_number) {
        // Old format: single phone number - migrate to new format
        smsSettings.value = {
          enabled: data.sms_notifications_enabled || false,
          phoneNumbers: [{
            number: data.recipient_phone_number,
            label: 'Primary',
            error: ''
          }]
        }
      } else {
        // No numbers saved yet
        smsSettings.value = {
          enabled: false,
          phoneNumbers: []
        }
      }
    }
    originalSmsSettings.value = JSON.parse(JSON.stringify(smsSettings.value))
  } catch (error) {
    console.error('Error fetching SMS settings:', error)
  }
}

const saveProfile = async () => {
  if (!user.value) return
  if (!profile.value.displayName.trim()) {
    saveStatus.value = 'Error: Display name cannot be empty.'
    return
  }

  // Validate all phone numbers if SMS is enabled
  if (smsSettings.value.enabled) {
    if (smsSettings.value.phoneNumbers.length === 0) {
      saveStatus.value = 'Error: Please add at least one phone number for SMS notifications.'
      return
    }

    // Validate all numbers
    let hasErrors = false
    smsSettings.value.phoneNumbers.forEach((phone, index) => {
      validatePhoneNumber(index)
      if (phone.error) hasErrors = true
    })

    if (hasErrors) {
      saveStatus.value = 'Error: Please fix invalid phone numbers.'
      return
    }
  }

  isSaving.value = true
  saveStatus.value = ''

  try {
    // Update Firebase Auth profile if changed
    if (auth.currentUser && auth.currentUser.displayName !== profile.value.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: profile.value.displayName,
        photoURL: profile.value.photoURL || auth.currentUser.photoURL || '',
      })
    }

    // Save user profile to Firestore
    const { displayName, location, emailNotifications, photoURL } = profile.value
    const userDocRef = doc(db, 'users', user.value.uid)
    await setDoc(
      userDocRef,
      {
        displayName,
        location,
        emailNotifications,
        photoURL,
        email: user.value.email,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    // Save SMS settings with multiple numbers
    const formattedPhoneNumbers = smsSettings.value.phoneNumbers
      .filter(phone => phone.number) // Only include non-empty numbers
      .map(phone => ({
        number: formatPhoneNumber(phone.number),
        label: phone.label || ''
      }))

    const settingsRef = doc(db, 'settings', 'thresholds')
    await setDoc(
      settingsRef,
      {
        sms_notifications_enabled: smsSettings.value.enabled,
        recipient_phone_numbers: formattedPhoneNumbers, // New field: array of objects
        // Keep old field for backward compatibility
        recipient_phone_number: formattedPhoneNumbers[0]?.number || '',
      },
      { merge: true },
    )

    // Update local values with formatted versions
    smsSettings.value.phoneNumbers = formattedPhoneNumbers.map(phone => ({
      ...phone,
      error: ''
    }))

    saveStatus.value = `Profile saved successfully! ${formattedPhoneNumbers.length} phone number(s) will receive SMS alerts.`
    originalProfile.value = { ...profile.value }
    originalSmsSettings.value = JSON.parse(JSON.stringify(smsSettings.value))

    // Auto-clear success messages
    setTimeout(() => {
      if (!saveStatus.value.includes('Error')) saveStatus.value = ''
    }, 4000)
  } catch (error) {
    console.error('Error saving profile:', error.code, error.message)
    saveStatus.value = `Error: Could not save profile. (${error.code})`
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  max-height: 0;
}
.fade-slide-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
