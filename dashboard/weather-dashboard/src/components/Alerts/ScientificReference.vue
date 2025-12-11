<template>
  <div
    class="bg-green-50 dark:bg-green-900/10 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mt-6 border border-green-200 dark:border-green-800"
  >
    <h3 class="text-base sm:text-lg font-bold text-text-main mb-3 sm:mb-4 flex items-center">
      <Icon
        icon="ph:graduation-cap-bold"
        class="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600 dark:text-green-400"
      />
      Scientific Foundation
    </h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
      <div
        v-for="reference in references"
        :key="reference.title"
        class="p-3 sm:p-4 bg-surface rounded-lg border border-border"
      >
        <p class="font-bold text-text-main mb-1 text-sm sm:text-base">
          {{ reference.icon }} {{ reference.title }}
        </p>
        <p class="text-xs text-text-light mb-2 leading-relaxed">
          {{ reference.description }}
        </p>
        <p class="text-xs text-green-700 dark:text-green-300 font-medium">
          Source: {{ reference.source }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const references = [
  {
    icon: '🌡️',
    title: 'Heat Stress Threshold',
    description: 'Temperature >35°C during flowering causes spikelet sterility',
    source: 'IRRI Rice Knowledge Bank',
  },
  {
    icon: '🌧️',
    title: 'Rainfall Warning System',
    description: 'Color-coded thresholds based on flood risk levels',
    source: 'PAGASA Heavy Rainfall Warning System',
  },
  {
    icon: '🍄',
    title: 'Rice Blast Conditions',
    description: 'High humidity (>90%) with cool temperatures (24-28°C)',
    source: 'IRRI Rice Doctor',
  },
  {
    icon: '🦠',
    title: 'Bacterial Blight Conditions',
    description: 'High humidity (>85%) with heat (30-34°C)',
    source: 'IRRI Rice Doctor',
  },
]
</script>
