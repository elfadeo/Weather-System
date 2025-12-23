<template>
  <div class="min-h-full">
    <!-- Hero Section with Status -->
    <section
      class="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border-b border-border"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <!-- Title -->
          <div>
            <h1 class="text-3xl font-bold text-text-main tracking-tight"> Weather Dashboard</h1>
            <p class="text-sm text-text-light mt-1">Real-time weather monitoring</p>
          </div>

          <!-- Status Badge with Accessibility -->
          <div class="flex items-center gap-3 self-start sm:self-auto">
            <div
              role="status"
              aria-live="polite"
              class="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all duration-300"
              :class="statusClasses"
            >
              <span class="relative flex h-2 w-2" :aria-hidden="true">
                <span
                  v-if="deviceStatus === 'online'"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2"
                  :class="statusDotColor"
                ></span>
              </span>
              <span class="text-xs sm:text-sm font-semibold" :class="statusTextColor">
                {{ statusLabel }}
              </span>
            </div>

            <!-- Last Updated -->
            <div
              v-if="lastUpdated"
              class="hidden sm:flex items-center gap-2 text-xs lg:text-sm text-text-light"
              :title="absoluteTimestamp"
            >
              <Icon icon="ph:clock-bold" class="w-4 h-4" />
              <span>{{ relativeTimestamp }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <!-- Weather Cards -->
      <section aria-label="Current weather conditions">
        <WeatherCards :weather-data="weatherCards" :is-loading="isLoading" />
      </section>

      <!-- Two Column Layout -->
      <div class="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <!-- Left Column: Insights -->
        <section class="space-y-6 lg:space-y-8" aria-labelledby="insights-heading">
          <div>
            <h2
              id="insights-heading"
              class="text-lg sm:text-xl lg:text-2xl font-bold text-text-main mb-4 sm:mb-6 flex items-center gap-2"
            >
              <Icon
                icon="ph:sparkle-bold"
                class="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                aria-hidden="true"
              />
              Insights
            </h2>
            <InsightCard />
          </div>

          <!-- Calibration Note -->
          <div
            class="p-4 sm:p-5 rounded-2xl bg-surface border border-border"
            role="note"
            aria-label="Calibration information"
          >
            <div class="flex gap-3">
              <Icon
                icon="ph:info-bold"
                class="w-5 h-5 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h3 class="text-sm font-semibold text-text-main mb-1">Calibration Notice</h3>
                <p class="text-xs sm:text-sm text-text-light leading-relaxed">
                  Rainfall measurements use provisional calibration. For optimal accuracy, calibrate
                  sensors against a reference gauge.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Right Column: Map -->
        <section class="space-y-4 sm:space-y-6" aria-labelledby="location-heading">
          <h2
            id="location-heading"
            class="text-lg sm:text-xl lg:text-2xl font-bold text-text-main flex items-center gap-2"
          >
            <Icon
              icon="ph:map-pin-bold"
              class="w-5 h-5 sm:w-6 sm:h-6 text-primary"
              aria-hidden="true"
            />
            Station Location
          </h2>

          <!-- Map Container -->
          <div class="rounded-2xl overflow-hidden shadow-lg border border-border bg-surface">
            <WeatherMap
              v-if="isMapReady && !mapError"
              :map-center="mapCenter"
              :marker-lat-lng="markerLatLng"
              :device-address="deviceAddress"
              :temperature="numericTemperature"
              :humidity="numericHumidity"
              :rainfall="numericRainfallRate"
            />

            <!-- Loading State -->
            <div
              v-else-if="!mapError"
              class="h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-gradient-to-br from-surface to-background"
              role="status"
              aria-label="Loading map"
            >
              <div class="text-center">
                <Icon
                  icon="ph:spinner-bold"
                  class="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mx-auto mb-2"
                  aria-hidden="true"
                />
                <p class="text-sm text-text-light">Loading map...</p>
              </div>
            </div>

            <!-- Error State -->
            <div
              v-else
              class="h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-gradient-to-br from-surface to-background"
              role="alert"
              aria-label="Map loading error"
            >
              <div class="text-center px-4">
                <Icon
                  icon="ph:warning-bold"
                  class="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-2"
                  aria-hidden="true"
                />
                <p class="text-sm text-text-main font-medium mb-1">Unable to load map</p>
                <p class="text-xs text-text-light">Location data unavailable</p>
              </div>
            </div>
          </div>

          <!-- Location Info -->
          <div
            v-if="deviceAddress && isMapReady"
            class="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-surface border border-border"
            role="region"
            aria-label="Location details"
          >
            <Icon
              icon="ph:buildings-bold"
              class="w-5 h-5 text-primary shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p class="text-xs sm:text-sm font-medium text-text-main">{{ deviceAddress }}</p>
              <p v-if="markerLatLng" class="text-xs text-text-light mt-1">
                {{ markerLatLng[0].toFixed(4) }}, {{ markerLatLng[1].toFixed(4) }}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watchEffect, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useWeatherData } from '@/composables/useWeatherData'

// Components
import WeatherCards from '@/components/Dashboard/WeatherCards.vue'
import WeatherMap from '@/components/Dashboard/WeatherMap.vue'
import InsightCard from '@/components/Dashboard/InsightCard.vue'

// Constants
const STATUS_THRESHOLDS = {
  ONLINE: 30000, // 30 seconds
  WARNING: 60000, // 1 minute
  OFFLINE: Infinity,
}

const MAP_LOAD_TIMEOUT = 10000 // 10 seconds

// Centralized weather data
const { latestData, isLoading } = useWeatherData()

// Reactive state for map
const mapCenter = ref(null)
const markerLatLng = ref(null)
const deviceAddress = ref('Weather Station Location')
const mapError = ref(false)
const mapLoadTimer = ref(null)

// Numeric values (for calculations and map component)
const numericTemperature = computed(() => {
  const temp = latestData.value?.temperature
  return typeof temp === 'number' ? temp : null
})

const numericHumidity = computed(() => {
  const hum = latestData.value?.humidity
  return typeof hum === 'number' ? hum : null
})

const numericRainfallRate = computed(() => {
  const rate = latestData.value?.rainRateEstimated_mm_hr_bucket
  return typeof rate === 'number' ? rate : null
})

const numericTotalRainfall = computed(() => {
  const total = latestData.value?.rainfall_total_estimated_mm_bucket
  return typeof total === 'number' ? total : null
})

// Display values (formatted strings)
const temperature = computed(() =>
  numericTemperature.value !== null ? numericTemperature.value.toFixed(1) : 'N/A',
)

const humidity = computed(() =>
  numericHumidity.value !== null ? numericHumidity.value.toFixed(0) : 'N/A',
)

const rainfallRate = computed(() =>
  numericRainfallRate.value !== null ? numericRainfallRate.value.toFixed(2) : 'N/A',
)

const totalRainfall = computed(() =>
  numericTotalRainfall.value !== null ? numericTotalRainfall.value.toFixed(2) : 'N/A',
)

const lastUpdated = computed(() => latestData.value?.timestamp)

// Device status with three states
const deviceStatus = computed(() => {
  if (!lastUpdated.value) return 'offline'

  const timeSinceUpdate = Date.now() - lastUpdated.value

  if (timeSinceUpdate < STATUS_THRESHOLDS.ONLINE) return 'online'
  if (timeSinceUpdate < STATUS_THRESHOLDS.WARNING) return 'warning'
  return 'offline'
})

// Status styling
const statusClasses = computed(() => {
  switch (deviceStatus.value) {
    case 'online':
      return 'bg-green-500/10 border border-green-500/20'
    case 'warning':
      return 'bg-yellow-500/10 border border-yellow-500/20'
    case 'offline':
      return 'bg-red-500/10 border border-red-500/20'
    default:
      return 'bg-gray-500/10 border border-gray-500/20'
  }
})

const statusDotColor = computed(() => {
  switch (deviceStatus.value) {
    case 'online':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
})

const statusTextColor = computed(() => {
  switch (deviceStatus.value) {
    case 'online':
      return 'text-green-700 dark:text-green-400'
    case 'warning':
      return 'text-yellow-700 dark:text-yellow-400'
    case 'offline':
      return 'text-red-700 dark:text-red-400'
    default:
      return 'text-gray-700 dark:text-gray-400'
  }
})

const statusLabel = computed(() => {
  switch (deviceStatus.value) {
    case 'online':
      return 'Live'
    case 'warning':
      return 'Delayed'
    case 'offline':
      return 'Offline'
    default:
      return 'Unknown'
  }
})

// Timestamp formatting
const relativeTimestamp = computed(() => {
  if (!lastUpdated.value) return ''
  return formatTimestamp(lastUpdated.value)
})

const absoluteTimestamp = computed(() => {
  if (!lastUpdated.value) return ''
  return new Date(lastUpdated.value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
})

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'

  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins}m ago`
  }

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Map ready state
const isMapReady = computed(
  () => mapCenter.value !== null && markerLatLng.value !== null && !mapError.value,
)

// Weather card data (memoized)
const weatherCards = computed(() => [
  {
    id: 'temp',
    title: 'Temperature',
    value: temperature.value,
    unit: '°C',
    icon: 'ph:thermometer-cold-bold',
    color: 'text-red-600',
    bgColor: 'bg-red-200',
  },
  {
    id: 'humidity',
    title: 'Humidity',
    value: humidity.value,
    unit: '%',
    icon: 'ph:drop-bold',
    color: 'text-blue-600',
    bgColor: 'bg-blue-200',
  },
  {
    id: 'rainfall_rate',
    title: 'Rainfall Rate',
    value: rainfallRate.value,
    unit: 'mm/hr',
    icon: 'ph:cloud-rain-bold',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-200',
  },
  {
    id: 'total_rainfall',
    title: 'Total Rainfall',
    value: totalRainfall.value,
    unit: 'mm',
    icon: 'ph:chart-line-up-bold',
    color: 'text-teal-600',
    bgColor: 'bg-teal-200',
  },
])

// Watch for location data changes
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
        mapError.value = false

        // Clear timeout if location loaded
        if (mapLoadTimer.value) {
          clearTimeout(mapLoadTimer.value)
          mapLoadTimer.value = null
        }
      } else {
        console.warn('Invalid location coordinates:', { lat, lng })
      }
    } catch (error) {
      console.error('Error updating device location:', error)
      mapError.value = true
    }
  } else if (!mapLoadTimer.value) {
    // Set timeout for map loading
    mapLoadTimer.value = setTimeout(() => {
      if (!mapCenter.value) {
        console.warn('Map load timeout: No location data received')
        mapError.value = true
      }
    }, MAP_LOAD_TIMEOUT)
  }
})
</script>
