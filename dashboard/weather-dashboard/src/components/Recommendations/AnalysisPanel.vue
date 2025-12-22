<template>
  <div class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 mb-8">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="flex-1">
        <h2 class="text-xl font-bold text-text-main">Analysis Input</h2>
        <p class="text-text-light mt-1">Using the latest sensor readings to generate insights:</p>

        <CurrentDataDisplay
          :is-loading="isDataLoading"
          :data="latestData"
          :rainfall-rate="rainfallRate"
          :total-rainfall="totalRainfall"
        />
      </div>

      <GenerateButton
        :is-generating="isGenerating"
        :is-disabled="isDataLoading || !latestData"
        @click="$emit('generate')"
      />
    </div>
  </div>
</template>

<script setup>
import CurrentDataDisplay from './CurrentDataDisplay.vue'
import GenerateButton from './GenerateButton.vue'

defineProps({
  latestData: { type: Object, default: null },
  isDataLoading: { type: Boolean, default: false },
  isGenerating: { type: Boolean, default: false },
  rainfallRate: { type: [String, Number], default: 'N/A' },
  totalRainfall: { type: [String, Number], default: 'N/A' },
})

defineEmits(['generate'])
</script>
