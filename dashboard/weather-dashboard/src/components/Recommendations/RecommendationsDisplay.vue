<template>
  <div class="h-full flex flex-col">
    <div
      v-if="!isGenerating && (!recommendations || recommendations.length === 0) && !generationError"
      class="flex-1 min-h-[400px] bg-surface border border-border rounded-2xl shadow-sm flex flex-col items-center justify-center text-center p-8 transition-colors duration-300"
    >
      <div
        class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-border"
      >
        <Icon icon="ph:brain-light" class="w-12 h-12 text-text-light" />
      </div>
      <h3 class="text-lg font-bold text-text-main mb-2">Ready to Analyze</h3>
      <p class="text-sm text-text-light max-w-sm mx-auto leading-relaxed">
        Click "Generate Insights" to process current sensor data and receive crop management advice.
      </p>
    </div>

    <div
      v-else-if="isGenerating"
      class="flex-1 min-h-[400px] bg-surface border border-border rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center transition-colors duration-300"
    >
      <div class="relative w-20 h-20 mb-6">
        <div class="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
        <div
          class="absolute inset-0 border-4 border-primary/40 border-t-primary rounded-full animate-spin"
        ></div>
        <Icon
          icon="ph:sparkle-fill"
          class="absolute inset-0 m-auto text-primary h-8 w-8 animate-pulse"
        />
      </div>
      <h3 class="text-lg font-bold text-text-main animate-pulse">Consulting AI Model...</h3>
      <p class="text-sm text-text-light mt-2">Correlating humidity patterns with rainfall data</p>
    </div>

    <div
      v-else-if="generationError"
      class="flex-1 min-h-[200px] bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
    >
      <div class="p-3 bg-red-100 rounded-full mb-4">
        <Icon icon="ph:warning-circle-fill" class="w-8 h-8 text-red-600" />
      </div>
      <h3 class="font-bold text-red-900 text-lg">Analysis Failed</h3>
      <p class="text-sm text-red-700 mt-2 mb-6 max-w-md">{{ generationError }}</p>
      <button
        @click="$emit('retry')"
        class="text-sm font-bold bg-surface border border-red-200 text-red-700 px-5 py-2.5 rounded-lg hover:bg-red-50 hover:shadow-sm transition-all"
      >
        Try Again
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div
        v-for="(rec, index) in recommendations"
        :key="index"
        class="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-all p-6 group flex flex-col hover:border-primary/30"
      >
        <div class="flex items-start gap-4 mb-3">
          <div
            class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors border"
            :class="[getIconDetails(rec.category).bg, getIconDetails(rec.category).border]"
          >
            <Icon
              :icon="getIconDetails(rec.category).icon"
              class="h-6 w-6"
              :class="getIconDetails(rec.category).text"
            />
          </div>
          <div>
            <h3 class="font-bold text-text-main text-lg group-hover:text-primary transition-colors">
              {{ rec.category }}
            </h3>
          </div>
        </div>

        <div class="flex-1">
          <p class="text-sm text-text-light leading-relaxed font-medium">
            {{ rec.recommendation }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  isGenerating: Boolean,
  generationError: String,
  recommendations: { type: Array, default: () => [] },
})

defineEmits(['retry'])

// FIX: Updated to strictly use palettes defined in your tailwind.config.js
// (green instead of emerald, gray instead of slate)
const getIconDetails = (category) => {
  const normalized = category?.toLowerCase() || ''

  // Water / Rain -> Blue Palette
  if (
    normalized.includes('water') ||
    normalized.includes('irrigation') ||
    normalized.includes('rain') ||
    normalized.includes('flood')
  ) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      icon: 'ph:drop-bold',
    }
  }
  // Pest / Disease -> Red Palette
  if (
    normalized.includes('pest') ||
    normalized.includes('disease') ||
    normalized.includes('fungus')
  ) {
    return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: 'ph:bug-bold' }
  }
  // Plant / Fertilizer -> Green Palette
  if (
    normalized.includes('fertilizer') ||
    normalized.includes('nutrient') ||
    normalized.includes('growth')
  ) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-100',
      icon: 'ph:plant-bold',
    }
  }
  // Soil / Harvest / Heat -> Orange Palette
  if (
    normalized.includes('soil') ||
    normalized.includes('harvest') ||
    normalized.includes('heat') ||
    normalized.includes('stress')
  ) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100',
      icon: 'ph:sun-dim-bold',
    }
  }
  // Default -> Gray Palette
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: 'ph:lightbulb-bold',
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
