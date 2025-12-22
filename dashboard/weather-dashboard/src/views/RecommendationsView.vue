<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <PageHeader
        title="AI Recommendations"
        description="Generate actionable insights based on the latest weather data."
      />

      <AnalysisPanel
        :latest-data="latestData"
        :is-data-loading="isDataLoading"
        :is-generating="isGenerating"
        :rainfall-rate="rainfallRate"
        :total-rainfall="totalRainfall"
        @generate="handleGenerate"
      />

      <RecommendationsDisplay
        :is-generating="isGenerating"
        :generation-error="generationError"
        :recommendations="recommendations"
        @retry="handleGenerate"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeatherData } from '@/composables/useWeatherData.js'
import { useHistoricalData } from '@/composables/useHistoricalData.js'
import { useGeminiRecommendations } from '@/composables/useGeminiRecommendations.js'
import PageHeader from '@/components/Recommendations/PageHeader.vue'
import AnalysisPanel from '@/components/Recommendations/AnalysisPanel.vue'
import RecommendationsDisplay from '@/components/Recommendations/RecommendationsDisplay.vue'

const props = defineProps({
  deviceAddress: { type: String, default: 'Philippines' },
})

const { latestData, isLoading: isDataLoading } = useWeatherData()
const { fetchHistoricalData, historicalSummary } = useHistoricalData()
const { generateRecommendations, recommendations, isGenerating, generationError } =
  useGeminiRecommendations()

const rainfallRate = computed(
  () => latestData.value?.rainRateEstimated_mm_hr_bucket?.toFixed(2) || 'N/A',
)

const totalRainfall = computed(
  () => latestData.value?.rainfall_total_estimated_mm_bucket?.toFixed(2) || 'N/A',
)

const handleGenerate = async () => {
  if (!latestData.value) {
    generationError.value = 'Cannot generate insights without current data.'
    return
  }

  const historicalData = await fetchHistoricalData()
  if (!historicalData) return

  await generateRecommendations({
    deviceAddress: props.deviceAddress,
    latestData: latestData.value,
    rainfallRate: rainfallRate.value,
    totalRainfall: totalRainfall.value,
    historicalSummary: historicalSummary.value,
  })
}
</script>
