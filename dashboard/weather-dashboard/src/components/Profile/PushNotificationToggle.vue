<template>
  <div class="group transition-colors duration-300 hover:bg-hover/40">
    <div class="flex items-center justify-between p-5 min-h-[5rem]">
      <div class="flex items-center gap-5 mr-4">
        <div
          class="flex-shrink-0 transition-colors duration-300"
          :class="
            isEnabled
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-text-light group-hover:text-purple-500'
          "
        >
          <Icon icon="ph:bell-ringing" class="w-6 h-6" />
        </div>

        <div>
          <p class="text-sm font-medium text-text-main leading-none">Push Notifications</p>
          <p class="text-xs text-text-light mt-1.5 leading-tight">
            {{ notificationStatus }}
          </p>
        </div>
      </div>

      <div class="flex-shrink-0 ml-auto flex items-center">
        <button
          @click="toggleNotifications"
          :disabled="!isSupported || isLoading"
          :class="[
            isEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700',
            (!isSupported || isLoading) && 'opacity-50 cursor-not-allowed',
          ]"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <span class="sr-only">Toggle Push Notifications</span>
          <span
            :class="isEnabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white shadow-sm'"
            class="inline-block h-4 w-4 transform rounded-full transition-transform duration-300"
          />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="errorMessage"
        class="px-5 pb-4 ml-[3.25rem] text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5"
      >
        <Icon icon="ph:warning" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
})

const isEnabled = ref(false)
const isSupported = ref(false)
const isLoading = ref(false)
const permission = ref('default')
const errorMessage = ref('')

const notificationStatus = computed(() => {
  if (!isSupported.value) return 'Not supported'
  if (permission.value === 'denied') return 'Blocked - check browser settings'
  if (isEnabled.value) return 'Active'
  return 'Inactive'
})

onMounted(async () => {
  // Check browser support
  isSupported.value = 'Notification' in window && 'serviceWorker' in navigator

  if (isSupported.value) {
    permission.value = Notification.permission

    // Load saved preference from Firestore
    try {
      const userDocRef = doc(db, 'users', props.userId)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        isEnabled.value = userData?.pushNotifications?.enabled || false
      }
    } catch (error) {
      console.error('Error loading push notification settings:', error)
    }
  }
})

const toggleNotifications = async () => {
  if (!isSupported.value) return

  errorMessage.value = ''

  // Store original state in case we need to revert
  const originalState = isEnabled.value

  // Optimistically update UI
  isEnabled.value = !isEnabled.value
  isLoading.value = true

  try {
    // Check if blocked
    if (permission.value === 'denied') {
      errorMessage.value = 'Notifications blocked. Enable them in your browser settings.'
      isEnabled.value = originalState
      isLoading.value = false
      return
    }

    // Request permission if needed
    if (permission.value === 'default') {
      const result = await Notification.requestPermission()
      permission.value = result

      if (result !== 'granted') {
        errorMessage.value = 'Permission denied. You can change this in browser settings.'
        isEnabled.value = originalState
        isLoading.value = false
        return
      }
    }

    // Save to Firestore using setDoc with merge
    const userDocRef = doc(db, 'users', props.userId)
    await setDoc(
      userDocRef,
      {
        pushNotifications: {
          enabled: isEnabled.value,
          updatedAt: new Date().toISOString(),
        },
      },
      { merge: true },
    )

    console.log('Push notification settings saved successfully:', isEnabled.value)

    // Show test notification when enabling
    if (isEnabled.value && permission.value === 'granted') {
      new Notification('Push Notifications Enabled', {
        body: "You'll now receive alerts for weather conditions.",
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      })
    }
  } catch (error) {
    console.error('Error toggling notifications:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      userId: props.userId,
    })

    errorMessage.value = `Failed to save settings: ${error.message}`

    // Revert the toggle on error
    isEnabled.value = originalState
  } finally {
    isLoading.value = false
  }
}
</script>
