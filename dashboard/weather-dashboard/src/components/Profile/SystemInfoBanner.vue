<template>
  <div
    class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-md p-4 sm:p-6 border border-blue-200 dark:border-blue-800 ring-1 ring-border"
  >
    <div class="flex items-start space-x-2 sm:space-x-3">
      <Icon
        icon="ph:info-bold"
        class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
      />
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-text-main mb-2 text-sm sm:text-base">About Alert System</h3>
        <div class="text-xs sm:text-sm text-text-light space-y-2 sm:space-y-2.5">
          <p>
            <strong class="text-text-main">📧 Email Alerts:</strong> Automated via GitHub Actions
            every 15 minutes. Emails are sent when sensor readings exceed scientifically validated
            thresholds (IRRI & PAGASA).
          </p>
          <p>
            <strong class="text-text-main">📱 Push Notifications:</strong> Instant browser
            notifications delivered to your device, even when the app is closed. Enable above for
            real-time alerts.
          </p>
          <p>
            <strong class="text-text-main">💬 SMS Alerts:</strong> Text message notifications sent
            via Semaphore API (Philippine provider) when critical weather conditions are detected.
            All saved numbers will receive alerts simultaneously.
          </p>
          <p class="text-xs text-text-light mt-2">
            All thresholds are based on peer-reviewed research from IRRI (International Rice
            Research Institute) and PAGASA (Philippine weather authority).
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
