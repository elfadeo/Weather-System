<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useWeatherData } from '@/composables/useWeatherData'
import { useSensorHistory } from '@/composables/useSensorHistory'
import { useGeminiRecommendations } from '@/composables/useGeminiRecommendations'

import AnalysisPanel from '@/components/Recommendations/AnalysisPanel.vue'
import RecommendationsDisplay from '@/components/Recommendations/RecommendationsDisplay.vue'

const props = defineProps({
  deviceAddress: { type: String, default: 'Brgy. Angayen, Balo-i' },
})

const { latestData, isLoading: isDataLoading, error: dataError } = useWeatherData()

const rainfallRate = computed(() => {
  const data = latestData.value || {}
  const val = data.rainRateEstimated_mm_hr_bucket || data.rainfall_rate || data.rain_rate || 0
  return typeof val === 'number' ? val.toFixed(2) : parseFloat(val).toFixed(2)
})

const totalRainfall = computed(() => {
  const data = latestData.value || {}
  const val =
    data.rainfall_total_estimated_mm_bucket || data.rainfall_total || data.total_rainfall || 0
  return typeof val === 'number' ? val.toFixed(2) : parseFloat(val).toFixed(2)
})

const { historicalSummary, fetchHistoricalData } = useSensorHistory()
const { recommendations, isGenerating, generationError, generateRecommendations } =
  useGeminiRecommendations()

const handleGenerate = async () => {
  if (!latestData.value) {
    generationError.value = 'Cannot generate insights without current data.'
    return
  }
  isGenerating.value = true
  generationError.value = null
  try {
    await fetchHistoricalData()
  } catch (e) {
    console.warn(e)
  }

  await generateRecommendations({
    deviceAddress: props.deviceAddress,
    latestData: latestData.value,
    rainfallRate: rainfallRate.value,
    totalRainfall: totalRainfall.value,
    historicalSummary: historicalSummary.value,
  })
}
</script>

<template>
  <div
    class="min-h-screen bg-background font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300"
  >
    <div class="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            class="text-2xl sm:text-3xl font-bold text-text-main tracking-tight flex items-center gap-3"
          >
            <div class="p-2 bg-green-100 rounded-lg border border-green-200 shadow-sm">
              <Icon icon="ph:plant-fill" class="h-6 w-6 text-green-600" />
            </div>
            AI Recommendations
          </h1>
          <p class="text-text-light mt-2 max-w-2xl leading-relaxed text-sm sm:text-base">
            Generates actionable insights by analyzing real-time sensor data against IRRI & PAGASA
            standards.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        <aside class="lg:col-span-1 space-y-6 lg:sticky lg:top-6 transition-all z-10">
          <AnalysisPanel
            :latest-data="latestData"
            :is-data-loading="isDataLoading"
            :is-generating="isGenerating"
            :rainfall-rate="rainfallRate"
            :total-rainfall="totalRainfall"
            @generate="handleGenerate"
          />

          <div
            v-if="dataError"
            class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3"
          >
            <Icon icon="ph:warning-circle-fill" class="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{{ dataError }}</p>
          </div>
        </aside>

        <main class="lg:col-span-2">
          <RecommendationsDisplay
            :is-generating="isGenerating"
            :error="generationError"
            :recommendations="recommendations"
          />
        </main>
      </div>
    </div>
  </div>
</template>
