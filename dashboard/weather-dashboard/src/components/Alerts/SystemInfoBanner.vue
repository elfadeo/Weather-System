<template>
  <div
    class="bg-blue-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 border border-blue-200 transition-colors duration-300"
  >
    <div class="flex items-start gap-4">
      <div class="p-2 bg-blue-100 rounded-lg shrink-0 border border-blue-200">
        <Icon icon="ph:info-bold" class="h-6 w-6 text-blue-700" />
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-blue-900 mb-4 text-base sm:text-lg">
          How the Alert System Works
        </h3>

        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="(info, index) in systemInfo" :key="index" class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2 mb-1">
              <Icon :icon="info.icon" class="h-4 w-4 text-blue-600" />
              <span class="font-bold text-sm text-blue-900">
                {{ info.title }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-blue-800 leading-relaxed opacity-90">
              {{ info.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const systemInfo = [
  {
    icon: 'ph:siren-fill',
    title: 'Real-Time Email Alerts',
    description:
      'Automated monitoring runs every 15 minutes via GitHub Actions. If sensor readings exceed critical thresholds (defined by IRRI & PAGASA), emails are sent instantly.',
  },
  {
    icon: 'ph:chart-bar-fill',
    title: 'Data-Driven Thresholds',
    description:
      'Alerts are triggered based on peer-reviewed scientific data for rice agriculture. This history log tracks every incident for long-term analysis.',
  },
]
</script>
