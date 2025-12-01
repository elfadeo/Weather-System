<template>
  <div
    class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- ❗ Missing closing tag was here -->
        <div class="flex items-center space-x-2 mb-1">
          <Icon icon="ph:bell-ringing-bold" class="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span class="text-sm font-medium text-gray-900 dark:text-text-main"
            >Push Notifications</span
          >
          <span
            v-if="isPermissionGranted"
            class="px-2 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full"
          >
            Active
          </span>
          <span
            v-else
            class="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
          >
            Inactive
          </span>
        </div>

        <p class="text-xs text-gray-600 dark:text-text-light ml-7">
          Get instant browser notifications for weather alerts
        </p>
      </div>
      <!-- ✅ Close .flex-1 -->
    </div>
    <!-- ✅ Close .flex items-start -->

    <!-- Browser Support Check -->
    <div
      v-if="!isSupported"
      class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
    >
      <div class="flex items-start space-x-2">
        <Icon
          icon="ph:warning-bold"
          class="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
        />
        <div>
          <p class="text-xs font-semibold text-yellow-900 dark:text-yellow-100">Not Supported</p>
          <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
            Push notifications are not supported in your browser. Try Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    </div>

    <!-- Permission Status -->
    <div v-else class="mt-3">
      <!-- Enabled State -->
      <div
        v-if="isPermissionGranted"
        class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
      >
        <div class="flex items-start space-x-2">
          <Icon
            icon="ph:check-circle-bold"
            class="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
          />
          <div class="flex-1">
            <p class="text-xs font-semibold text-green-900 dark:text-green-100">Enabled</p>
            <p class="text-xs text-green-700 dark:text-green-300 mt-0.5">
              You'll receive instant alerts when thresholds are exceeded
            </p>
            <button
              @click="disableNotifications"
              class="mt-2 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline"
            >
              Disable notifications
            </button>
          </div>
        </div>
      </div>

      <!-- Blocked State -->
      <div
        v-else-if="notificationPermission === 'denied'"
        class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-start space-x-2">
          <Icon
            icon="ph:x-circle-bold"
            class="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
          />
          <div>
            <p class="text-xs font-semibold text-red-900 dark:text-red-100">Blocked</p>
            <p class="text-xs text-red-700 dark:text-red-300 mt-0.5">
              To enable: Click the lock icon in your browser's address bar → Allow notifications
            </p>
          </div>
        </div>
      </div>

      <!-- Default Enable Button -->
      <div
        v-else
        class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div class="flex items-start space-x-2">
          <Icon
            icon="ph:bell-bold"
            class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
          />
          <div class="flex-1">
            <p class="text-xs font-semibold text-blue-900 dark:text-blue-100">Not enabled</p>
            <p class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Enable to receive alerts even when the app is closed
            </p>
            <button
              @click="enableNotifications"
              :disabled="isRequesting"
              class="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
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
