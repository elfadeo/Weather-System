<template>
  <div
    class="bg-green-50 border border-green-200 rounded-2xl shadow-sm p-5 sm:p-6 mt-6 transition-colors duration-300"
  >
    <h3 class="text-base sm:text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
      <Icon icon="ph:graduation-cap-bold" class="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
      Scientific Foundation
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div
        v-for="reference in references"
        :key="reference.title"
        class="p-4 bg-surface rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
      >
        <div class="flex items-start gap-3 mb-2">
          <div class="p-2 bg-green-50 rounded-lg shrink-0">
            <Icon :icon="reference.icon" class="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p class="font-bold text-text-main text-sm leading-tight">
              {{ reference.title }}
            </p>
            <p class="text-[10px] sm:text-xs font-medium text-green-700 mt-1">
              Source: {{ reference.source }}
            </p>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-text-light leading-relaxed mt-auto pl-[3.25rem]">
          {{ reference.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const references = [
  {
    icon: 'ph:thermometer-hot-bold',
    title: 'Heat Stress Threshold',
    description: 'Temperature >35°C during flowering causes spikelet sterility.',
    source: 'IRRI Rice Knowledge Bank',
  },
  {
    icon: 'ph:cloud-rain-bold',
    title: 'Rainfall Warning System',
    description: 'Color-coded thresholds based on flood risk levels.',
    source: 'PAGASA Warning System',
  },
  {
    icon: 'ph:plant-bold', // Changed to plant icon for Rice Blast
    title: 'Rice Blast Conditions',
    description: 'High humidity (>90%) combined with cool temperatures (24-28°C).',
    source: 'IRRI Rice Doctor',
  },
  {
    icon: 'ph:bug-bold', // Changed to bug/virus icon for Blight
    title: 'Bacterial Blight',
    description: 'High humidity (>85%) combined with high heat (30-34°C).',
    source: 'IRRI Rice Doctor',
  },
]
</script>
