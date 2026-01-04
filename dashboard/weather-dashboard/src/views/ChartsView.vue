<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useChartsData } from '@/composables/useChartsData'
import SingleMetricChart from '@/components/Charts/SingleMetricChart.vue'
import LoadingState from '@/components/Charts/LoadingState.vue'
import EmptyState from '@/components/Charts/EmptyState.vue'

// State
const selectedTimeRange = ref('last7')

// Composable
const {
  isLoading,
  loadingProgress,
  loadingMessage,
  dataAvailabilityInfo,
  error,
  chartData,
  fetchData,
} = useChartsData()

// Chart data computed properties
const temperatureChartData = computed(() => ({
  labels: chartData.value.labels,
  data: chartData.value.temperature,
}))

const humidityChartData = computed(() => ({
  labels: chartData.value.labels,
  data: chartData.value.humidity,
}))

const rainfallChartData = computed(() => ({
  labels: chartData.value.labels,
  data: chartData.value.rainfall,
}))

const totalRainfallChartData = computed(() => ({
  labels: chartData.value.labels,
  data: chartData.value.rainfallTotals,
}))

// Calculate accumulated rainfall with reset detection
const calculateAccumulatedRainfall = (totals) => {
  if (totals.length === 0) return 0

  // For single reading, return the value
  if (totals.length === 1) return totals[0]

  let accumulated = 0
  let lastValue = totals[0]

  for (let i = 1; i < totals.length; i++) {
    const current = totals[i]

    // Check if sensor was reset (value decreased significantly)
    if (current < lastValue * 0.9) {
      // Reset detected - add the accumulated amount before reset
      accumulated += lastValue
      lastValue = current
    } else {
      lastValue = current
    }
  }

  // Add final accumulated amount
  accumulated += lastValue

  // If no resets were detected, calculate the difference
  if (accumulated === totals[totals.length - 1]) {
    accumulated = Math.max(0, totals[totals.length - 1] - totals[0])
  }

  return accumulated
}

// Format date range for display
const formatDateRange = (labels) => {
  if (labels.length === 0) return ''
  if (labels.length === 1) return 'Single reading'

  const first = labels[0]
  const last = labels[labels.length - 1]

  if (first === last) return first

  // Shorten long labels intelligently
  const shorten = (str, maxLen = 25) => {
    if (str.length <= maxLen) return str

    // For week ranges (contains ' - '), preserve structure
    if (str.includes(' - ')) {
      const parts = str.split(' - ')
      if (str.length <= 35) return str // Allow slightly longer for week ranges

      // Truncate each part
      const firstPart = parts[0].length > 12 ? parts[0].substring(0, 9) + '...' : parts[0]
      const secondPart =
        parts[1].length > 12 ? '...' + parts[1].substring(parts[1].length - 9) : parts[1]
      return `${firstPart} - ${secondPart}`
    }

    // For regular strings, truncate with ellipsis
    return str.substring(0, maxLen - 3) + '...'
  }

  return `${shorten(first)} to ${shorten(last)}`
}

// Summary statistics
const summaryStats = computed(() => {
  // Filter valid values
  const temps = chartData.value.temperature.filter((v) => !isNaN(v) && isFinite(v))
  const hums = chartData.value.humidity.filter((v) => !isNaN(v) && isFinite(v))
  const totals = chartData.value.rainfallTotals.filter((v) => !isNaN(v) && isFinite(v) && v >= 0)

  // Calculate statistics helper
  const calcStats = (arr) => {
    if (arr.length === 0) return { avg: '0.0', min: '0.0', max: '0.0' }
    const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
    const min = Math.min(...arr).toFixed(1)
    const max = Math.max(...arr).toFixed(1)
    return { avg, min, max }
  }

  // Calculate rainfall based on time range
  let rainfall = '0.0'
  let rainfallNote = 'No data'

  if (totals.length > 0) {
    if (selectedTimeRange.value === 'last7') {
      // Calculate accumulated rainfall with reset detection
      const accumulated = calculateAccumulatedRainfall(totals)
      rainfall = accumulated.toFixed(1)
      rainfallNote = totals.length >= 2 ? 'Accumulated over readings' : 'Single reading'
    } else {
      // For aggregated views, show the maximum total
      rainfall = Math.max(...totals).toFixed(1)
      rainfallNote = 'Peak in period'
    }

    // Add date range if available
    const dateRange = formatDateRange(chartData.value.labels)
    if (dateRange && dateRange !== 'Single reading') {
      rainfallNote = dateRange
    }
  }

  return {
    temp: calcStats(temps),
    humidity: calcStats(hums),
    rainfall,
    rainfallNote,
  }
})

// Time range options
const timeRangeOptions = [
  { value: 'last7', label: 'Last 7 Readings' },
  { value: 'weekly', label: 'Last 4 Weeks' },
  { value: 'monthly', label: 'Last 6 Months' },
  { value: 'yearly', label: 'Last 2 Years' },
]

// State checks
const hasError = computed(() => {
  return (
    !isLoading.value &&
    (error.value !== null ||
      (dataAvailabilityInfo.value &&
        (dataAvailabilityInfo.value.toLowerCase().includes('error') ||
          dataAvailabilityInfo.value.toLowerCase().includes('failed'))))
  )
})

const hasData = computed(() => {
  return !isLoading.value && !hasError.value && chartData.value.labels.length > 0
})

// Watch time range changes with debouncing
let fetchTimeout = null
let lastFetchedRange = null

watch(
  selectedTimeRange,
  (newRange) => {
    // Prevent duplicate fetches
    if (newRange === lastFetchedRange && !hasError.value) {
      return
    }

    // Clear any pending fetch
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
      fetchTimeout = null
    }

    // Debounce the fetch to prevent rapid requests
    fetchTimeout = setTimeout(() => {
      lastFetchedRange = newRange
      fetchData(newRange)
      fetchTimeout = null
    }, 300)
  },
  { immediate: true },
)

// Cleanup on unmount
onBeforeUnmount(() => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
    fetchTimeout = null
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Weather Charts
          </h1>
          <p class="text-sm text-[var(--color-text-light)] mt-1">
            Historical analysis of weather parameters
          </p>
          <p
            v-if="dataAvailabilityInfo && !hasError"
            class="text-xs text-[var(--color-text-light)] mt-2 flex items-center gap-2"
          >
            <Icon icon="ph:info-duotone" class="h-4 w-4" />
            <span>{{ dataAvailabilityInfo }}</span>
          </p>
        </div>

        <div class="relative min-w-[200px]">
          <label for="time-range-select" class="sr-only">Select Time Range</label>
          <select
            id="time-range-select"
            v-model="selectedTimeRange"
            :disabled="isLoading"
            class="appearance-none w-full rounded-lg border-0 bg-[var(--color-surface)] py-2.5 pl-4 pr-10 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] text-sm font-medium shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-light)]"
          >
            <Icon icon="ph:caret-down-bold" class="h-4 w-4" />
          </div>
        </div>
      </div>

      <!-- Loading Progress -->
      <div
        v-if="isLoading && loadingProgress > 0"
        class="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-4 shadow-sm"
      >
        <div class="flex items-center gap-3 mb-2">
          <Icon
            icon="ph:circle-notch-bold"
            class="h-5 w-5 text-[var(--color-primary)] animate-spin"
          />
          <span class="text-sm font-medium text-[var(--color-text-main)]">
            {{ loadingMessage || 'Loading...' }}
          </span>
        </div>
        <div class="w-full bg-[var(--color-background)] rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
        </div>
        <p class="text-xs text-[var(--color-text-light)] mt-1 text-right">{{ loadingProgress }}%</p>
      </div>

      <!-- Error State -->
      <div
        v-if="hasError"
        class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
        role="alert"
      >
        <div class="mb-4 rounded-full bg-red-100 dark:bg-red-900/20 p-4 inline-flex">
          <Icon icon="ph:warning-circle-duotone" class="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
          Error Loading Data
        </h3>
        <p class="text-sm text-red-700 dark:text-red-300 mb-4">
          {{ error || dataAvailabilityInfo || 'An unexpected error occurred.' }}
        </p>
        <button
          @click="fetchData(selectedTimeRange)"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Icon icon="ph:arrow-clockwise-bold" class="inline h-4 w-4 mr-2" />
          Retry
        </button>
      </div>

      <!-- No Data State -->
      <div
        v-if="!isLoading && !hasError && chartData.labels.length === 0"
        class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center"
      >
        <div class="mb-4 rounded-full bg-[var(--color-background)] p-4 inline-flex">
          <Icon
            icon="ph:clock-countdown-duotone"
            class="h-10 w-10 text-[var(--color-text-light)] opacity-50"
          />
        </div>
        <h3 class="text-lg font-semibold text-[var(--color-text-main)] mb-2">
          No Data for This Time Range
        </h3>
        <p class="text-sm text-[var(--color-text-light)] max-w-md mx-auto">
          Your weather station needs more time to collect data for this view.
        </p>
      </div>

      <!-- Summary Cards -->
      <div v-if="hasData" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <!-- Temperature Card -->
        <div
          class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300"
        >
          <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-red-500)]"></div>
          <div class="pl-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon
                icon="ph:thermometer-simple-duotone"
                class="h-4 w-4 text-[var(--color-red-500)]"
              />
              <span
                class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider"
              >
                Temperature
              </span>
            </div>
            <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
              {{ summaryStats.temp.avg }}°C
            </p>
            <p class="text-xs text-[var(--color-text-light)]">
              Range: {{ summaryStats.temp.min }}° / {{ summaryStats.temp.max }}°
            </p>
          </div>
        </div>

        <!-- Humidity Card -->
        <div
          class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300"
        >
          <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-primary)]"></div>
          <div class="pl-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="ph:drop-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
              <span
                class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider"
              >
                Humidity
              </span>
            </div>
            <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
              {{ summaryStats.humidity.avg }}%
            </p>
            <p class="text-xs text-[var(--color-text-light)]">
              Range: {{ summaryStats.humidity.min }}% / {{ summaryStats.humidity.max }}%
            </p>
          </div>
        </div>

        <!-- Rainfall Card -->
        <div
          class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300"
        >
          <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-purple-500)]"></div>
          <div class="pl-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="ph:cloud-rain-duotone" class="h-4 w-4 text-[var(--color-purple-500)]" />
              <span
                class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider"
              >
                Total Rainfall
              </span>
            </div>
            <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
              {{ summaryStats.rainfall
              }}<span class="text-lg font-normal text-[var(--color-text-light)] ml-1">mm</span>
            </p>
            <p class="text-xs text-[var(--color-text-light)] break-words">
              {{ summaryStats.rainfallNote }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton for Summary Cards -->
      <div
        v-if="isLoading"
        class="grid grid-cols-1 sm:grid-cols-3 gap-6"
        aria-label="Loading summary statistics"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-sm animate-pulse h-32 relative overflow-hidden"
        >
          <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-border)]/50"></div>
          <div class="pl-4 space-y-4">
            <div class="h-3 w-20 bg-[var(--color-border)] rounded"></div>
            <div class="h-8 w-24 bg-[var(--color-border)] rounded"></div>
            <div class="h-3 w-32 bg-[var(--color-border)] rounded"></div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Temperature Chart -->
        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span
                class="flex h-3 w-3 rounded-full bg-[var(--color-red-500)]"
                aria-hidden="true"
              ></span>
              <h3
                class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
              >
                Temperature
              </h3>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
            >
              °Celsius
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="hasData && temperatureChartData.data.length > 0"
              :chart-data="temperatureChartData"
              color="#dc2626"
              label="Temperature (°C)"
              suffix="°C"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No temperature data" />
          </div>
        </div>

        <!-- Humidity Chart -->
        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span
                class="flex h-3 w-3 rounded-full bg-[var(--color-primary)]"
                aria-hidden="true"
              ></span>
              <h3
                class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
              >
                Humidity
              </h3>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
            >
              % Percent
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="hasData && humidityChartData.data.length > 0"
              :chart-data="humidityChartData"
              color="#1a73e8"
              label="Humidity (%)"
              suffix="%"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No humidity data" />
          </div>
        </div>

        <!-- Rain Rate Chart -->
        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span
                class="flex h-3 w-3 rounded-full bg-[var(--color-purple-500)]"
                aria-hidden="true"
              ></span>
              <h3
                class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
              >
                Rain Rate
              </h3>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
            >
              mm/hr
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="hasData && rainfallChartData.data.length > 0"
              :chart-data="rainfallChartData"
              color="#8b5cf6"
              label="Rain Rate"
              suffix=" mm/hr"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No rainfall data" />
          </div>
        </div>

        <!-- Total Rainfall Chart -->
        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span
                class="flex h-3 w-3 rounded-full bg-[var(--color-teal-500)]"
                aria-hidden="true"
              ></span>
              <h3
                class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
              >
                Total Rainfall
              </h3>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
            >
              mm Total
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="hasData && totalRainfallChartData.data.length > 0"
              :chart-data="totalRainfallChartData"
              color="#14b8a6"
              label="Accumulated Rain"
              suffix=" mm"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No rainfall data" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
