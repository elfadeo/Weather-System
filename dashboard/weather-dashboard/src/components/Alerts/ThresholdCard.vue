<template>
  <div
    class="bg-surface rounded-2xl shadow-sm p-5 sm:p-6 sticky top-8 space-y-6 border border-border transition-colors duration-300"
  >
    <div>
      <h2 class="text-lg sm:text-xl font-bold text-text-main mb-2 flex items-center">
        <Icon icon="ph:shield-check-bold" class="h-6 w-6 mr-2 text-blue-600" />
        Active Thresholds
      </h2>
      <p class="text-xs text-text-light leading-relaxed">
        Scientific thresholds based on IRRI & PAGASA research standards.
      </p>
    </div>

    <div
      class="rounded-r-lg border-l-4 border-green-600 bg-green-50 p-4 transition-colors duration-300"
    >
      <h3 class="text-sm font-bold text-green-900 mb-4 flex items-center">
        <Icon icon="ph:plant-bold" class="h-5 w-5 mr-2 text-green-700" />
        Rice Agriculture (IRRI)
      </h3>

      <div class="space-y-3">
        <div
          v-for="threshold in riceThresholds"
          :key="threshold.label"
          class="pb-3 border-b border-green-200 last:border-0 last:pb-0"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-green-900 flex items-center gap-1.5">
              <Icon :icon="threshold.icon" class="h-4 w-4" :class="threshold.iconClass" />
              {{ threshold.label }}
            </span>
            <span
              class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              :class="threshold.badgeClass"
            >
              {{ threshold.value }}
            </span>
          </div>
          <p class="text-[11px] sm:text-xs text-green-800 opacity-90 leading-snug">
            {{ threshold.description }}
          </p>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-green-200">
        <p class="text-xs font-bold text-green-900 mb-2 flex items-center gap-1.5">
          <Icon icon="ph:virus-bold" class="h-4 w-4 text-green-700" />
          Disease Detection
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="disease in diseases"
            :key="disease.name"
            class="text-[11px] sm:text-xs text-green-800 flex items-start gap-2"
          >
            <span class="mt-1.5 h-1 w-1 rounded-full bg-green-700 shrink-0"></span>
            <span>
              <span class="font-semibold">{{ disease.name }}:</span>
              <span class="opacity-80 ml-1">{{ disease.condition }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <div
      class="rounded-r-lg border-l-4 border-blue-600 bg-blue-50 p-4 transition-colors duration-300"
    >
      <h3 class="text-sm font-bold text-blue-900 mb-3 flex items-center">
        <Icon icon="ph:cloud-rain-bold" class="h-5 w-5 mr-2 text-blue-700" />
        PAGASA Rainfall System
      </h3>

      <div class="space-y-2">
        <div
          class="flex items-center justify-between p-2.5 rounded bg-orange-50 border border-orange-200"
        >
          <span class="text-xs font-bold text-orange-800 flex items-center gap-1.5">
            <Icon icon="ph:warning-circle-fill" class="h-3.5 w-3.5 text-orange-600" />
            Yellow Alert
          </span>
          <span class="text-[10px] font-mono font-semibold text-orange-900"> ≥7.5 mm/hr </span>
        </div>

        <div
          class="flex items-center justify-between p-2.5 rounded bg-orange-100 border border-orange-200"
        >
          <span class="text-xs font-bold text-orange-900 flex items-center gap-1.5">
            <Icon icon="ph:warning-fill" class="h-3.5 w-3.5 text-orange-700" />
            Orange Alert
          </span>
          <span class="text-[10px] font-mono font-semibold text-orange-900"> ≥15 mm/hr </span>
        </div>

        <div
          class="flex items-center justify-between p-2.5 rounded bg-red-50 border border-red-200"
        >
          <span class="text-xs font-bold text-red-900 flex items-center gap-1.5">
            <Icon icon="ph:siren-fill" class="h-3.5 w-3.5 text-red-600" />
            Red Alert
          </span>
          <span class="text-[10px] font-mono font-semibold text-red-900"> ≥30 mm/hr </span>
        </div>
      </div>

      <p class="text-[10px] text-blue-800 mt-3 opacity-80">
        Automatic classification based on hourly rainfall volume.
      </p>
    </div>

    <div class="border-t border-border pt-5">
      <div
        class="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
      >
        <div class="flex items-center space-x-2">
          <Icon icon="ph:envelope-simple-bold" class="h-5 w-5 text-text-light" />
          <span class="text-sm font-medium text-text-main">Email Alerts</span>
        </div>
        <span
          class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-full border border-green-200"
        >
          Active
        </span>
      </div>
      <p class="text-[10px] text-text-light mt-2 text-center opacity-70">
        Automated monitoring runs every 15 minutes via GitHub Actions
      </p>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
      <Icon icon="ph:info-bold" class="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
      <p class="text-xs text-blue-900 leading-relaxed">
        <strong>System Note:</strong> These thresholds are locked to ensure compliance with national
        agricultural standards.
      </p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

// Rice agriculture thresholds
const riceThresholds = [
  {
    icon: 'ph:thermometer-hot-bold',
    // Uses Red variables for critical items
    iconClass: 'text-red-600',
    label: 'Heat Stress',
    value: '>35°C',
    description: 'Causes spikelet sterility during flowering',
    badgeClass: 'bg-red-50 text-red-900 border border-red-200',
  },
  {
    icon: 'ph:check-circle-bold',
    // Uses Green variables for good items
    iconClass: 'text-green-600',
    label: 'Optimal Range',
    value: '25-33°C',
    description: 'Ideal temperature for rice growth',
    badgeClass: 'bg-green-100 text-green-800 border border-green-200',
  },
]

// Disease detection conditions
const diseases = [
  { name: 'Rice Blast', condition: '>90% RH + 24-28°C' },
  { name: 'Bacterial Blight', condition: '>85% RH + 30-34°C' },
]
</script>
