<template>
  <div class="bg-surface rounded-2xl shadow-sm p-6 sticky top-8 space-y-6 border border-border">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-bold text-text-main mb-2 flex items-center">
        <Icon icon="ph:shield-check-bold" class="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
        Active Thresholds
      </h2>
      <p class="text-xs text-text-light">Scientific thresholds from IRRI & PAGASA research</p>
    </div>

    <!-- Rice Agriculture Thresholds (IRRI) -->
    <div
      class="border-l-4 border-green-500 dark:border-green-600 pl-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg"
    >
      <h3 class="text-sm font-bold text-text-main mb-3 flex items-center">
        <Icon icon="ph:plant-bold" class="h-5 w-5 mr-2" />
        Rice Agriculture (IRRI)
      </h3>

      <!-- Temperature Thresholds -->
      <div
        v-for="threshold in riceThresholds"
        :key="threshold.label"
        class="mb-3 pb-3 border-b border-green-200 dark:border-green-800 last:border-b-0 last:mb-0 last:pb-0"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold text-text-main">
            {{ threshold.icon }} {{ threshold.label }}
          </span>
          <span class="text-xs font-mono px-2 py-0.5 rounded" :class="threshold.badgeClass">
            {{ threshold.value }}
          </span>
        </div>
        <p class="text-xs text-text-light">{{ threshold.description }}</p>
      </div>

      <!-- Disease Monitoring -->
      <div>
        <p class="text-xs font-semibold text-text-main mb-2">🦠 Disease Detection</p>
        <ul class="text-xs text-text-light space-y-1">
          <li v-for="disease in diseases" :key="disease.name">
            • {{ disease.name }}: {{ disease.condition }}
          </li>
        </ul>
      </div>
    </div>

    <!-- PAGASA Rainfall System -->
    <div
      class="border-l-4 border-blue-500 dark:border-blue-600 pl-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg"
    >
      <h3 class="text-sm font-bold text-text-main mb-3 flex items-center">
        <Icon icon="ph:cloud-rain-bold" class="h-5 w-5 mr-2" />
        PAGASA Rainfall System
      </h3>

      <div class="space-y-2">
        <!-- Yellow Alert -->
        <div
          class="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-900/20"
        >
          <span class="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
            🟡 Yellow Alert
          </span>
          <span class="text-xs font-mono text-yellow-900 dark:text-yellow-100"> ≥7.5 mm/hr </span>
        </div>

        <!-- Orange Alert -->
        <div
          class="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-900/20"
        >
          <span class="text-xs font-semibold text-orange-900 dark:text-orange-100">
            🟠 Orange Alert
          </span>
          <span class="text-xs font-mono text-orange-900 dark:text-orange-100"> ≥15 mm/hr </span>
        </div>

        <!-- Red Alert -->
        <div class="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/30">
          <span class="text-xs font-semibold text-red-900 dark:text-red-100"> 🔴 Red Alert </span>
          <span class="text-xs font-mono text-red-900 dark:text-red-100"> ≥30 mm/hr </span>
        </div>
      </div>

      <p class="text-xs text-text-light mt-3">Color-coded flood risk assessment system</p>
    </div>

    <!-- Email Status -->
    <div class="border-t border-border pt-4">
      <div class="flex items-center justify-between p-3 bg-background rounded-lg">
        <div class="flex items-center space-x-2">
          <Icon icon="ph:envelope-simple-bold" class="h-5 w-5 text-text-light" />
          <span class="text-sm font-medium text-text-main">Email Alerts</span>
        </div>
        <span
          class="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded-full"
        >
          Active
        </span>
      </div>
      <p class="text-xs text-text-light mt-2 text-center">
        Automated via GitHub Actions (every 15 min)
      </p>
    </div>

    <!-- Info Note -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
    >
      <p class="text-xs text-text-main">
        <Icon icon="ph:info-bold" class="inline h-3 w-3 mr-1" />
        <strong>Note:</strong> These thresholds are based on peer-reviewed research and cannot be
        changed from the dashboard. They are configured in the backend monitoring system.
      </p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

// Rice agriculture thresholds
const riceThresholds = [
  {
    icon: '🔥',
    label: 'Heat Stress',
    value: '>35°C',
    description: 'Causes spikelet sterility during flowering',
    badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100',
  },
  {
    icon: '✅',
    label: 'Optimal Range',
    value: '25-33°C',
    description: 'Ideal temperature for rice growth',
    badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
  },
]

// Disease detection conditions
const diseases = [
  { name: 'Rice Blast', condition: '>90% RH + 24-28°C' },
  { name: 'Bacterial Blight', condition: '>85% RH + 30-34°C' },
]
</script>
