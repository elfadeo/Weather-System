<template>
  <div
    class="bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-200 dark:border-blue-800"
  >
    <div class="flex items-start space-x-3 sm:space-x-4">
      <Icon
        icon="ph:info-bold"
        class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 sm:mt-1"
      />
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-text-main mb-2 text-base sm:text-lg">
          How the Alert System Works
        </h3>
        <div class="text-xs sm:text-sm text-text-main space-y-2 sm:space-y-3">
          <p v-for="(info, index) in systemInfo" :key="index" class="leading-relaxed">
            <strong class="block sm:inline">{{ info.icon }} {{ info.title }}:</strong>
            <span class="block sm:inline sm:ml-1">{{ info.description }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const systemInfo = [
  {
    icon: '🚨',
    title: 'Real-Time Email Alerts',
    description:
      'Automated monitoring runs every 15 minutes via GitHub Actions. When sensor readings exceed critical thresholds (based on IRRI & PAGASA research), emails are sent automatically.',
  },
  {
    icon: '📊',
    title: 'Dashboard History',
    description:
      'This page displays the history of triggered alerts. Thresholds are pre-configured based on scientific research for rice agriculture.',
  },
]
</script>
