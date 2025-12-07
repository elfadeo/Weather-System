<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-[var(--color-surface)]/40 pb-4 gap-4 sm:gap-0"
      >
        <!-- Left Side: Title -->
        <h1 class="text-3xl sm:text-4xl font-bold text-[var(--color-text-main)] tracking-tight">
          Dashboard
        </h1>

        <!-- Right Side: Status Indicators -->
        <div
          class="flex items-center text-sm text-[var(--color-text-light)]"
          aria-live="polite"
          role="status"
        >
          <!-- Connecting State -->
          <span v-if="lastUpdated === null">Connecting...</span>

          <!-- Online/Offline State -->
          <template v-else>
            <div class="flex items-center space-x-2">
              <!-- Status Dot -->
              <span
                class="relative flex h-3 w-3"
                :aria-label="isOnline ? 'Device Online' : 'Device Offline'"
              >
                <span
                  v-if="isOnline"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/70"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-3 w-3"
                  :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
                ></span>
              </span>

              <!-- Status Label -->
              <span
                :class="
                  isOnline
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                "
                class="px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-200"
              >
                {{ isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>

            <!-- Last Updated Timestamp -->
            <div v-if="lastUpdated" class="flex items-center ml-4 text-xs sm:text-sm">
              <span class="mx-2 text-[var(--color-text-light)]/50">|</span>
              <span>
                Last updated:
                <strong class="text-[var(--color-text-main)]">
                  {{ new Date(lastUpdated).toLocaleString() }}
                </strong>
              </span>
            </div>
          </template>
        </div>
      </header>

      <!-- Weather Cards -->
      <WeatherCards :weather-data="weatherData" :is-loading="isLoading" />

      <!-- Calibration Note -->
      <section class="mt-6 text-center">
        <p class="text-xs text-[var(--color-text-light)] italic">
          Note: Rainfall data is based on provisional calibration values. For highest accuracy,
          sensor calibration against a reference gauge is recommended.
        </p>
      </section>

      <!-- Predictive Insight Card -->
      <section class="mt-10">
        <InsightCard />
      </section>

      <!-- Map Section -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-[var(--color-text-main)] mb-4">Station Location</h2>

        <!-- Map -->
        <WeatherMap
          v-if="mapCenter && markerLatLng"
          :map-center="mapCenter"
          :marker-lat-lng="markerLatLng"
          :device-address="deviceAddress"
          :temperature="temperature"
          :humidity="humidity"
          :rainfall="rainfallRate"
        />

        <!-- Fallback -->
        <div
          v-else
          class="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)] rounded-3xl shadow-lg p-6 h-96 flex items-center justify-center transition-all duration-300"
        >
          <p class="text-[var(--color-text-light)] animate-pulse">Loading map data...</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, watchEffect, ref } from 'vue'
import { useWeatherData } from '@/composables/useWeatherData'

// Components
import WeatherCards from '@/components/WeatherCards.vue'
import WeatherMap from '@/components/WeatherMap.vue'
import InsightCard from '@/components/InsightCard.vue'

// Centralized weather data
const { latestData, isLoading } = useWeatherData()

// Reactive state for map
const mapCenter = ref(null)
const markerLatLng = ref(null)
const deviceAddress = ref('Weather Station Location')

// Computed properties derived from the composable's state
const temperature = computed(() => latestData.value?.temperature?.toFixed(1) ?? 'N/A')
const humidity = computed(() => latestData.value?.humidity?.toFixed(0) ?? 'N/A')
const rainfallRate = computed(
  () => latestData.value?.rainRateEstimated_mm_hr_bucket?.toFixed(2) ?? 'N/A',
)
const totalRainfall = computed(
  () => latestData.value?.rainfall_total_estimated_mm_bucket?.toFixed(2) ?? 'N/A',
)
const lastUpdated = computed(() => latestData.value?.timestamp)

// Device status
const isOnline = computed(() => {
  if (!lastUpdated.value) return false
  return Date.now() - lastUpdated.value < 30000 // within 30s considered online
})

// Weather card data
const weatherData = computed(() => [
  {
    id: 'temp',
    title: 'Temperature',
    value: temperature.value,
    unit: '°C',
    icon: 'ph:thermometer-cold-bold',
    color: 'text-red-600',
    bgColor:
      'bg-red-200',
  },
  {
    id: 'humidity',
    title: 'Humidity',
    value: humidity.value,
    unit: '%',
    icon: 'ph:drop-bold',
    color: 'text-blue-600',
    bgColor:
      'bg-blue-200',
  },
  {
    id: 'rainfall_rate',
    title: 'Rainfall Rate (Est.)',
    value: rainfallRate.value,
    unit: 'mm/hr',
    icon: 'ph:cloud-rain-bold',
    color: 'text-indigo-600',
    bgColor:
      'bg-indigo-200',
  },
  {
    id: 'total_rainfall',
    title: 'Total Rainfall (Est.)',
    value: totalRainfall.value,
    unit: 'mm',
    icon: 'ph:chart-line-up-bold',
    color: 'text-teal-600',
    bgColor:
      'bg-teal-200',
  },
])

// Watch for changes in latestData to update the map
watchEffect(() => {
  const data = latestData.value
  if (data?.location) {
    try {
      const { lat, lng, address } = data.location
      const latNum = Number(lat)
      const lngNum = Number(lng)

      if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
        mapCenter.value = [latNum, lngNum]
        markerLatLng.value = [latNum, lngNum]
        deviceAddress.value = address || 'Weather Station Location'
      }
    } catch (error) {
      console.error('Error updating device location:', error)
    }
  }
})
</script>
