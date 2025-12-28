<template>
  <div
    class="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors duration-300 hover:shadow-md"
  >
    <div class="p-5 border-b border-border bg-gray-50">
      <h3 class="font-bold text-text-main flex items-center gap-2 text-lg">
        <Icon icon="ph:sliders-horizontal-bold" class="text-primary" />
        Analysis Context
      </h3>
      <p class="text-xs text-text-light mt-1 font-medium">
        AI will analyze these real-time metrics:
      </p>
    </div>

    <div class="p-5 space-y-4">
      <div v-if="isDataLoading" class="space-y-3 animate-pulse">
        <div class="h-12 bg-hover rounded-xl w-full"></div>
        <div class="h-12 bg-hover rounded-xl w-full"></div>
        <div class="h-12 bg-hover rounded-xl w-full"></div>
      </div>

      <div v-else class="space-y-3">
        <div
          class="flex items-center justify-between p-3 rounded-xl bg-background border border-border group hover:border-orange-200 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Icon icon="ph:thermometer-simple-bold" class="w-5 h-5" />
            </div>
            <span class="text-sm font-semibold text-text-light">Temperature</span>
          </div>
          <span class="font-mono font-bold text-text-main">
            {{ latestData?.temperature?.toFixed(1) || '--' }}°C
          </span>
        </div>

        <div
          class="flex items-center justify-between p-3 rounded-xl bg-background border border-border group hover:border-blue-200 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Icon icon="ph:drop-bold" class="w-5 h-5" />
            </div>
            <span class="text-sm font-semibold text-text-light">Humidity</span>
          </div>
          <span class="font-mono font-bold text-text-main">
            {{ latestData?.humidity?.toFixed(1) || '--' }}%
          </span>
        </div>

        <div
          class="flex items-center justify-between p-3 rounded-xl bg-background border border-border group hover:border-purple-200 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Icon icon="ph:cloud-rain-bold" class="w-5 h-5" />
            </div>
            <span class="text-sm font-semibold text-text-light">Rain Rate</span>
          </div>
          <span class="font-mono font-bold text-text-main">
            {{ rainfallRate }} <span class="text-xs text-text-light font-normal">mm/hr</span>
          </span>
        </div>

        <div
          class="flex items-center justify-between p-3 rounded-xl bg-background border border-border group hover:border-green-200 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg text-green-600">
              <Icon icon="ph:chart-line-up-bold" class="w-5 h-5" />
            </div>
            <span class="text-sm font-semibold text-text-light">Total Rain</span>
          </div>
          <span class="font-mono font-bold text-text-main">
            {{ totalRainfall }} <span class="text-xs text-text-light font-normal">mm</span>
          </span>
        </div>
      </div>
    </div>

    <div class="p-5 border-t border-border bg-gray-50">
      <button
        @click="$emit('generate')"
        :disabled="isGenerating || isDataLoading"
        class="w-full py-3.5 px-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all duration-200 ease-in-out active:scale-[0.98]"
        :class="[
          /* 1. Generating State: Keep blue but show wait cursor */
          isGenerating ? 'bg-primary text-primary-text cursor-wait opacity-90' : '',

          /* 2. Loading Data State: Greyed out, unclickable */
          !isGenerating && isDataLoading
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            : '',

          /* 3. Ready State: Bright Blue with Hover interaction */
          !isGenerating && !isDataLoading
            ? 'bg-primary text-primary-text hover:bg-blue-700 hover:shadow-lg'
            : '',
        ]"
      >
        <Icon v-if="isGenerating" icon="ph:spinner-gap-bold" class="animate-spin h-5 w-5" />
        <Icon v-else-if="!isDataLoading" icon="ph:sparkle-fill" class="h-5 w-5" />

        <span>
          {{
            isGenerating
              ? 'Analyzing Crop Data...'
              : isDataLoading
                ? 'Loading Sensors...'
                : 'Generate Insights'
          }}
        </span>
      </button>

      <p
        class="text-[11px] text-center text-text-light mt-3 flex items-center justify-center gap-1 opacity-80"
      >
        <Icon icon="ph:lightning-fill" class="text-orange-400" />
        Powered by Gemini AI. Results may vary.
      </p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  latestData: Object,
  isDataLoading: Boolean,
  isGenerating: Boolean,
  rainfallRate: [Number, String],
  totalRainfall: [Number, String],
})

defineEmits(['generate'])
</script>
