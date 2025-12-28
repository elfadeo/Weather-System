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
  chartData,
  fetchData,
  cleanup,
  onUnmount,
} = useChartsData()

// Computed
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

const summaryStats = computed(() => {
  const temps = chartData.value.temperature.filter(v => v > 0)
  const hums = chartData.value.humidity.filter(v => v > 0)
  const totals = chartData.value.rainfallTotals.filter(v => v >= 0)

  const calcStats = (arr) => {
    if (!arr.length) return { avg: '0.0', min: '0.0', max: '0.0' }
    const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
    const min = Math.min(...arr).toFixed(1)
    const max = Math.max(...arr).toFixed(1)
    return { avg, min, max }
  }

  const rainfall = totals.length >= 2
    ? Math.max(0, totals[totals.length - 1] - totals[0]).toFixed(1)
    : '0.0'

  let rainfallNote = 'Accumulated'
  if (chartData.value.labels.length > 0) {
    const first = chartData.value.labels[0]
    const last = chartData.value.labels[chartData.value.labels.length - 1]

    if (first === last) {
      rainfallNote = 'Single reading'
    } else {
      const shorten = (s) => s.length > 15 ? s.substring(0, 12) + '...' : s
      rainfallNote = `${shorten(first)} to ${shorten(last)}`
    }
  }

  return {
    temp: calcStats(temps),
    humidity: calcStats(hums),
    rainfall,
    rainfallNote,
  }
})

// Dynamic time range labels based on device
const timeRangeOptions = computed(() => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g' ||
    connection.saveData === true
  )

  if (isSlowConnection || isMobile) {
    return [
      { value: 'last7', label: 'Last 7 Readings' },
      { value: 'weekly', label: 'Last 4 Weeks' },
      { value: 'monthly', label: 'Last 6 Months' },
      { value: 'yearly', label: 'Last 2 Years' },
    ]
  }

  return [
    { value: 'last7', label: 'Last 7 Readings' },
    { value: 'weekly', label: 'Last 8 Weeks' },
    { value: 'monthly', label: 'Last 12 Months' },
    { value: 'yearly', label: 'Last 5 Years' },
  ]
})

// Watch with debouncing to prevent rapid switches
let fetchTimeout = null
watch(selectedTimeRange, (newRange) => {
  // Clear any pending fetch
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }

  // Debounce to prevent rapid API calls
  fetchTimeout = setTimeout(() => {
    fetchData(newRange)
  }, 100)
}, { immediate: true })

// Cleanup
onBeforeUnmount(() => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }
  onUnmount()
  cleanup()
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
            v-if="dataAvailabilityInfo"
            class="text-xs text-[var(--color-text-light)] mt-2 flex items-center gap-2"
          >
            <Icon icon="ph:info-duotone" class="h-4 w-4" />
            <span>{{ dataAvailabilityInfo }}</span>
          </p>
        </div>

        <div class="relative min-w-[200px]">
          <label class="sr-only">Select Time Range</label>
          <select
            v-model="selectedTimeRange"
            :disabled="isLoading"
            class="appearance-none w-full rounded-lg border-0 bg-[var(--color-surface)] py-2.5 pl-4 pr-10 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] text-sm font-medium shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option
              v-for="option in timeRangeOptions"
              :key="option.value"
              :value="option.value"
            >
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
          <Icon icon="ph:circle-notch-bold" class="h-5 w-5 text-[var(--color-primary)] animate-spin" />
          <span class="text-sm font-medium text-[var(--color-text-main)]">
            {{ loadingMessage }}
          </span>
        </div>
        <div class="w-full bg-[var(--color-background)] rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
        </div>
        <p class="text-xs text-[var(--color-text-light)] mt-1 text-right">
          {{ loadingProgress }}%
        </p>
      </div>

      <!-- No Data -->
      <div
        v-if="!isLoading && !chartData.labels.length"
        class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center"
      >
        <div class="mb-4 rounded-full bg-[var(--color-background)] p-4 inline-flex">
          <Icon icon="ph:clock-countdown-duotone" class="h-10 w-10 text-[var(--color-text-light)] opacity-50" />
        </div>
        <h3 class="text-lg font-semibold text-[var(--color-text-main)] mb-2">
          No Data for This Time Range
        </h3>
        <p class="text-sm text-[var(--color-text-light)] max-w-md mx-auto">
          Your weather station needs more time to collect data for this view.
        </p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6" v-else>
        <template v-if="isLoading">
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
        </template>

        <template v-else>
          <!-- Temperature Card -->
          <div class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300">
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-red-500)]"></div>
            <div class="pl-4">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="ph:thermometer-simple-duotone" class="h-4 w-4 text-[var(--color-red-500)]" />
                <span class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider">
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
          <div class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300">
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-primary)]"></div>
            <div class="pl-4">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="ph:drop-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                <span class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider">
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
          <div class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300">
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-purple-500)]"></div>
            <div class="pl-4">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="ph:cloud-rain-duotone" class="h-4 w-4 text-[var(--color-purple-500)]" />
                <span class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider">
                  Total Rainfall
                </span>
              </div>
              <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
                {{ summaryStats.rainfall }}<span class="text-lg font-normal text-[var(--color-text-light)] ml-1">mm</span>
              </p>
              <p class="text-xs text-[var(--color-text-light)]">
                {{ summaryStats.rainfallNote }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Temperature Chart -->
        <div class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-red-500)]"></span>
              <h3 class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                Temperature
              </h3>
            </div>
            <span class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded">
              °Celsius
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="!isLoading && temperatureChartData.data.length > 0"
              :chart-data="temperatureChartData"
              color="#dc2626"
              label="Temperature (°C)"
              suffix="°C"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No data" />
          </div>
        </div>

        <!-- Humidity Chart -->
        <div class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-primary)]"></span>
              <h3 class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                Humidity
              </h3>
            </div>
            <span class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded">
              % Percent
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="!isLoading && humidityChartData.data.length > 0"
              :chart-data="humidityChartData"
              color="#1a73e8"
              label="Humidity (%)"
              suffix="%"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No data" />
          </div>
        </div>

        <!-- Rain Rate Chart -->
        <div class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-purple-500)]"></span>
              <h3 class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                Rain Rate
              </h3>
            </div>
            <span class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded">
              mm/hr
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="!isLoading && rainfallChartData.data.length > 0"
              :chart-data="rainfallChartData"
              color="#8b5cf6"
              label="Rain Rate"
              suffix=" mm/hr"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No data" />
          </div>
        </div>

        <!-- Total Rainfall Chart -->
        <div class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-teal-500)]"></span>
              <h3 class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                Total Rainfall
              </h3>
            </div>
            <span class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded">
              mm Total
            </span>
          </div>
          <div class="h-[280px] w-full">
            <SingleMetricChart
              v-if="!isLoading && totalRainfallChartData.data.length > 0"
              :chart-data="totalRainfallChartData"
              color="#14b8a6"
              label="Accumulated Rain"
              suffix=" mm"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No data" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
