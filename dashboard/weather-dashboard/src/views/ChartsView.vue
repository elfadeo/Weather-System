<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Weather Charts
          </h1>
          <p class="text-sm text-[var(--color-text-light)] mt-1">
            Historical analysis of weather parameters
          </p>
        </div>

        <div class="relative min-w-[200px]">
          <label class="sr-only">Select Time Range</label>
          <select
            v-model="selectedTimeRange"
            :disabled="isLoading"
            class="appearance-none w-full rounded-lg border-0 bg-[var(--color-surface)] py-2.5 pl-4 pr-10 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] text-sm font-medium shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="last7">Last 7 Readings</option>
            <option value="weekly">Weekly Average</option>
            <option value="monthly">Monthly Average</option>
            <option value="yearly">Yearly Average</option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-light)]"
          >
            <Icon icon="ph:caret-down-bold" class="h-4 w-4" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

        <template v-else-if="chartData.labels.length > 0">
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
                  >Temperature</span
                >
              </div>
              <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
                {{ summaryStats.temp.avg }}°C
              </p>
              <p class="text-xs text-[var(--color-text-light)]">
                Range:
                <span class="font-medium text-[var(--color-text-main)]"
                  >{{ summaryStats.temp.min }}°</span
                >
                <span class="opacity-50 mx-1">/</span>
                <span class="font-medium text-[var(--color-text-main)]"
                  >{{ summaryStats.temp.max }}°</span
                >
              </p>
            </div>
          </div>

          <div
            class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300"
          >
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-primary)]"></div>
            <div class="pl-4">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="ph:drop-duotone" class="h-4 w-4 text-[var(--color-primary)]" />
                <span
                  class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider"
                  >Humidity</span
                >
              </div>
              <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
                {{ summaryStats.humidity.avg }}%
              </p>
              <p class="text-xs text-[var(--color-text-light)]">
                Range:
                <span class="font-medium text-[var(--color-text-main)]"
                  >{{ summaryStats.humidity.min }}%</span
                >
                <span class="opacity-50 mx-1">/</span>
                <span class="font-medium text-[var(--color-text-main)]"
                  >{{ summaryStats.humidity.max }}%</span
                >
              </p>
            </div>
          </div>

          <div
            class="group relative overflow-hidden rounded-xl bg-[var(--color-surface)] p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-300"
          >
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-purple-500)]"></div>
            <div class="pl-4">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="ph:cloud-rain-duotone" class="h-4 w-4 text-[var(--color-purple-500)]" />
                <span
                  class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider"
                  >Total Rainfall</span
                >
              </div>
              <p class="text-3xl font-bold text-[var(--color-text-main)] mb-1 tabular-nums">
                {{ summaryStats.rainfall
                }}<span class="text-lg font-normal text-[var(--color-text-light)] ml-1">mm</span>
              </p>
              <p class="text-xs text-[var(--color-text-light)]">Accumulated over period</p>
            </div>
          </div>
        </template>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-red-500)]"></span>
              <div>
                <h3
                  class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
                >
                  Temperature
                </h3>
              </div>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
              >°Celsius</span
            >
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
            <EmptyState v-else message="No temperature data" />
          </div>
        </div>

        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-primary)]"></span>
              <div>
                <h3
                  class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
                >
                  Humidity
                </h3>
              </div>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
              >% Percent</span
            >
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
            <EmptyState v-else message="No humidity data" />
          </div>
        </div>

        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-purple-500)]"></span>
              <div>
                <h3
                  class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
                >
                  Rain Rate
                </h3>
              </div>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
              >mm/hr</span
            >
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
            <EmptyState v-else message="No rain data" />
          </div>
        </div>

        <div
          class="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 rounded-full bg-[var(--color-teal-500)]"></span>
              <div>
                <h3
                  class="text-sm font-semibold text-[var(--color-text-main)] uppercase tracking-wide"
                >
                  Total Rainfall
                </h3>
              </div>
            </div>
            <span
              class="text-xs font-medium text-[var(--color-text-light)] bg-[var(--color-background)] px-2 py-1 rounded"
              >mm Total</span
            >
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
            <EmptyState v-else message="No rain data" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { rtdb } from '@/firebase.js'
import {
  ref as dbRef,
  onValue,
  off,
  query,
  limitToLast,
  orderByChild,
  startAt,
} from 'firebase/database'
import SingleMetricChart from '@/components/Charts/SingleMetricChart.vue'

// -- Internal Components (Inlined for simplicity, but preferably separate files) --

const LoadingState = {
  template: `
    <div class="flex h-full w-full items-center justify-center">
      <div class="flex flex-col items-center">
        <span class="animate-spin text-[var(--color-primary)] mb-2">
          <svg class="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
        <span class="text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wide">Loading Data...</span>
      </div>
    </div>
  `,
}

const EmptyState = {
  props: ['message'],
  components: { Icon },
  template: `
    <div class="flex h-full w-full items-center justify-center">
      <div class="flex flex-col items-center text-center">
        <div class="mb-3 rounded-full bg-[var(--color-background)] p-3">
           <svg class="h-6 w-6 text-[var(--color-text-light)] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
           </svg>
        </div>
        <p class="text-sm font-medium text-[var(--color-text-light)]">{{ message }}</p>
      </div>
    </div>
  `,
}

// --- STATE & LOGIC (Unchanged) ---
const isLoading = ref(true)
const selectedTimeRange = ref('last7')
const firebaseListener = ref(null)

const chartData = ref({
  labels: [],
  temperature: [],
  humidity: [],
  rainfall: [],
  rainfallTotals: [],
})

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
  const temps = chartData.value.temperature.filter((v) => v > 0)
  const hums = chartData.value.humidity.filter((v) => v > 0)
  const totals = chartData.value.rainfallTotals.filter((v) => v >= 0)

  const calcStats = (arr) => {
    if (!arr.length) return { avg: '0.0', min: '0.0', max: '0.0' }
    const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
    const min = Math.min(...arr).toFixed(1)
    const max = Math.max(...arr).toFixed(1)
    return { avg, min, max }
  }

  const rainfall =
    totals.length >= 2 ? Math.max(0, totals[totals.length - 1] - totals[0]).toFixed(1) : '0.0'

  return {
    temp: calcStats(temps),
    humidity: calcStats(hums),
    rainfall,
  }
})

// --- HELPERS ---
const TIME_RANGES = {
  LAST_7: 'last7',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

const formatTimestamp = (date, range) => {
  const phtDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))

  switch (range) {
    case TIME_RANGES.LAST_7:
      return phtDate.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    case TIME_RANGES.WEEKLY:
      return `Week ${getWeekNumber(phtDate)}, ${phtDate.getFullYear()}`
    case TIME_RANGES.MONTHLY:
      return phtDate.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        year: 'numeric',
      })
    case TIME_RANGES.YEARLY:
      return phtDate.getFullYear().toString()
    default:
      return phtDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

const processRecords = (records, range) => {
  if (range === TIME_RANGES.LAST_7) {
    return {
      labels: records.map((r) => formatTimestamp(new Date(r.timestamp), range)),
      temperature: records.map((r) => Number(r.temperature) || 0),
      humidity: records.map((r) => Number(r.humidity) || 0),
      rainfall: records.map((r) => Number(r.rainRateEstimated_mm_hr_bucket) || 0),
      rainfallTotals: records.map((r) => Number(r.rainfall_total_estimated_mm_bucket) || 0),
    }
  }

  const groupedData = records.reduce((acc, record) => {
    const date = new Date(record.timestamp)
    let key

    if (range === TIME_RANGES.WEEKLY) {
      key = `${date.getFullYear()}-W${getWeekNumber(date)}`
    } else if (range === TIME_RANGES.MONTHLY) {
      key = `${date.getFullYear()}-${date.getMonth()}`
    } else if (range === TIME_RANGES.YEARLY) {
      key = `${date.getFullYear()}`
    }

    if (!acc[key]) {
      acc[key] = {
        timestamp: date,
        temps: [],
        hums: [],
        rains: [],
        rainTotals: [],
        count: 0,
      }
    }

    const temp = Number(record.temperature)
    const hum = Number(record.humidity)
    const rain = Number(record.rainRateEstimated_mm_hr_bucket)
    const rainTotal = Number(record.rainfall_total_estimated_mm_bucket)

    if (!isNaN(temp)) acc[key].temps.push(temp)
    if (!isNaN(hum)) acc[key].hums.push(hum)
    if (!isNaN(rain)) acc[key].rains.push(rain)
    if (!isNaN(rainTotal)) acc[key].rainTotals.push(rainTotal)
    acc[key].count++

    return acc
  }, {})

  const sortedGroups = Object.values(groupedData).sort((a, b) => a.timestamp - b.timestamp)
  const labels = []
  const temperature = []
  const humidity = []
  const rainfall = []
  const rainfallTotals = []

  sortedGroups.forEach((g) => {
    labels.push(formatTimestamp(g.timestamp, range))
    temperature.push(g.temps.length ? g.temps.reduce((a, b) => a + b, 0) / g.temps.length : 0)
    humidity.push(g.hums.length ? g.hums.reduce((a, b) => a + b, 0) / g.hums.length : 0)
    rainfall.push(g.rains.length ? g.rains.reduce((a, b) => a + b, 0) / g.rains.length : 0)
    rainfallTotals.push(g.rainTotals.length ? Math.max(...g.rainTotals) : 0)
  })

  return { labels, temperature, humidity, rainfall, rainfallTotals }
}

const listenForHistoricalData = () => {
  isLoading.value = true

  if (firebaseListener.value) {
    const { ref: oldRef, callback } = firebaseListener.value
    off(oldRef, 'value', callback)
    firebaseListener.value = null
  }

  const historyRef = dbRef(rtdb, 'sensor_logs')
  const range = selectedTimeRange.value
  let historyQuery

  if (range === TIME_RANGES.LAST_7) {
    historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(7))
  } else {
    const startTime = Date.now() - 365 * 86400000
    historyQuery = query(historyRef, orderByChild('timestamp'), startAt(startTime))
  }

  const callback = (snap) => {
    if (!snap.exists()) {
      chartData.value = {
        labels: [],
        temperature: [],
        humidity: [],
        rainfall: [],
        rainfallTotals: [],
      }
    } else {
      const processed = processRecords(Object.values(snap.val()), range)
      chartData.value = processed
    }
    isLoading.value = false
  }

  firebaseListener.value = { ref: historyRef, callback }

  onValue(historyQuery, callback, (error) => {
    console.error('Firebase onValue error:', error)
    isLoading.value = false
  })
}

watch(selectedTimeRange, listenForHistoricalData, { immediate: true })

onBeforeUnmount(() => {
  if (firebaseListener.value) {
    const { ref: oldRef, callback } = firebaseListener.value
    off(oldRef, 'value', callback)
  }
})
</script>
