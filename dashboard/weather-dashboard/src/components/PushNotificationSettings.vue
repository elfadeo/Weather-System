<template>
  <div
    class="p-4 bg-surface-soft dark:bg-surface-mute/50 rounded-lg border border-surface-soft dark:border-surface-mute"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- ❗ Missing closing tag was here -->
        <div class="flex items-center space-x-2 mb-1">
          <Icon icon="ph:bell-ringing-bold" class="h-5 w-5 text-text-light" />
          <span class="text-sm font-medium text-text-main">Push Notifications</span>
          <span
            v-if="isPermissionGranted"
            class="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full"
          >
            Active
          </span>
          <span
            v-else
            class="px-2 py-0.5 text-xs font-semibold bg-surface-soft text-text-light rounded-full"
          >
            Inactive
          </span>
        </div>

        <p class="text-xs text-text-light ml-7">
          Get instant browser notifications for weather alerts
        </p>
      </div>
      <!-- ✅ Close .flex-1 -->
    </div>
    <!-- ✅ Close .flex items-start -->

    <!-- Browser Support Check -->
    <div v-if="!isSupported" class="mt-3 p-3 bg-yellow-50 border-yellow-200 rounded-lg">
      <div class="flex items-start space-x-2">
        <Icon icon="ph:warning-bold" class="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <p class="text-xs font-semibold text-yellow-900">Not Supported</p>
          <p class="text-xs text-yellow-700 mt-0.5">
            Push notifications are not supported in your browser. Try Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    </div>

    <!-- Permission Status -->
    <div v-else class="mt-3">
      <!-- Enabled State -->
      <div v-if="isPermissionGranted" class="p-3 bg-green-50 border-green-200 rounded-lg">
        <div class="flex items-start space-x-2">
          <Icon icon="ph:check-circle-bold" class="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-xs font-semibold text-green-900">Enabled</p>
            <p class="text-xs text-green-700 mt-0.5">
              You'll receive instant alerts when thresholds are exceeded
            </p>
            <button
              @click="disableNotifications"
              class="mt-2 text-xs text-green-700 hover:text-green-900 underline"
            >
              Disable notifications
            </button>
          </div>
        </div>
      </div>

      <!-- Blocked State -->
      <div
        v-else-if="notificationPermission === 'denied'"
        class="p-3 bg-red-50 border-red-200 rounded-lg"
      >
        <div class="flex items-start space-x-2">
          <Icon icon="ph:x-circle-bold" class="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-xs font-semibold text-red-900">Blocked</p>
            <p class="text-xs text-red-700 mt-0.5">
              To enable: Click the lock icon in your browser's address bar → Allow notifications
            </p>
          </div>
        </div>
      </div>

      <!-- Default Enable Button -->
      <div v-else class="p-3 bg-blue-50 border-blue-200 rounded-lg">
        <div class="flex items-start space-x-2">
          <Icon icon="ph:bell-bold" class="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-xs font-semibold text-blue-900">Not enabled</p>
            <p class="text-xs text-blue-700 mt-0.5">
              Enable to receive alerts even when the app is closed
            </p>
            <button
              @click="enableNotifications"
              :disabled="isRequesting"
              class="mt-2 px-3 py-1.5 bg-primary hover:bg-primary-dark disabled:bg-primary-light text-white text-xs rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              <span v-if="isRequesting" class="flex items-center">
                <Icon icon="ph:circle-notch-bold" class="h-3 w-3 animate-spin mr-1" />
                Requesting...
              </span>
              <span v-else>Enable Notifications</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- ✅ Close main p-4 container -->
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { usePushNotifications } from '@/composables/usePushNotifications'

const {
  isSupported,
  isPermissionGranted,
  notificationPermission,
  requestPermission,
  unregisterToken,
} = usePushNotifications()

const isRequesting = ref(false)

const enableNotifications = async () => {
  isRequesting.value = true
  try {
    const granted = await requestPermission()
    if (granted) {
      console.log('✅ Push notifications enabled successfully')
    }
  } catch (error) {
    console.error('Error enabling notifications:', error)
  } finally {
    isRequesting.value = false
  }
}

const disableNotifications = async () => {
  try {
    await unregisterToken()
    // Note: We can't programmatically revoke notification permission
    // User must do it manually in browser settings
    alert('To fully disable notifications, please also block them in your browser settings.')
  } catch (error) {
    console.error('Error disabling notifications:', error)
  }
}
</script>
