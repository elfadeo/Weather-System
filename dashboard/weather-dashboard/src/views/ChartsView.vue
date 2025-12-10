<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Charts & Trends</h1>
        <p class="text-text-light mt-2">View historical graphs of weather parameters</p>
      </div>

      <!-- Control Panel -->
      <div
        class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 mb-6 border border-border"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-text-main">Data Time Range</h3>
            <p class="text-sm text-text-light mt-1">Select the time period to visualize</p>
          </div>
          <select
            v-model="selectedTimeRange"
            :disabled="isLoading"
            class="bg-surface border border-border rounded-lg py-2.5 px-4 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="last7">Last 7 Readings</option>
            <option value="weekly">Weekly Average</option>
            <option value="monthly">Monthly Average</option>
            <option value="yearly">Yearly Average</option>
          </select>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Temperature Chart -->
        <div class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-border">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <h3 class="text-lg font-semibold text-text-main">Temperature</h3>
            </div>
            <span class="text-xs text-text-light">°Celsius</span>
          </div>
          <div class="h-[300px]">
            <SingleMetricChart
              v-if="!isLoading && temperatureChartData.data.length > 0"
              :chart-data="temperatureChartData"
              :color="'#ef4444'"
              :label="'Temperature (°C)'"
              :suffix="'°C'"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No temperature data available" />
          </div>
        </div>

        <!-- Humidity Chart -->
        <div class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-border">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <h3 class="text-lg font-semibold text-text-main">Humidity</h3>
            </div>
            <span class="text-xs text-text-light">Percentage</span>
          </div>
          <div class="h-[300px]">
            <SingleMetricChart
              v-if="!isLoading && humidityChartData.data.length > 0"
              :chart-data="humidityChartData"
              :color="'#3b82f6'"
              :label="'Humidity (%)'"
              :suffix="'%'"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No humidity data available" />
          </div>
        </div>

        <!-- Rainfall Rate Chart -->
        <div class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-border">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
              <h3 class="text-lg font-semibold text-text-main">Rainfall Rate (Est.)</h3>
            </div>
            <span class="text-xs text-text-light">mm/hr</span>
          </div>
          <div class="h-[300px]">
            <SingleMetricChart
              v-if="!isLoading && rainfallChartData.data.length > 0"
              :chart-data="rainfallChartData"
              :color="'#6366f1'"
              :label="'Rainfall Rate (mm/hr)'"
              :suffix="' mm/hr'"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No rainfall rate data available" />
          </div>
        </div>

        <!-- Total Rainfall Chart -->
        <div class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-border">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-teal-500"></div>
              <h3 class="text-lg font-semibold text-text-main">Total Rainfall (Est.)</h3>
            </div>
            <span class="text-xs text-text-light">mm</span>
          </div>
          <div class="h-[300px]">
            <SingleMetricChart
              v-if="!isLoading && totalRainfallChartData.data.length > 0"
              :chart-data="totalRainfallChartData"
              :color="'#14b8a6'"
              :label="'Total Rainfall (mm)'"
              :suffix="' mm'"
            />
            <LoadingState v-else-if="isLoading" />
            <EmptyState v-else message="No total rainfall data available" />
          </div>
        </div>
      </div>

      <!-- Data Summary -->
      <div
        v-if="!isLoading && chartData.labels.length > 0"
        class="mt-6 bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-border"
      >
        <h3 class="text-lg font-semibold text-text-main mb-4">Period Summary</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30"
          >
            <p class="text-xs text-red-800 dark:text-red-400 font-medium mb-1">Temperature</p>
            <p class="text-2xl font-bold text-red-900 dark:text-red-300">
              {{ averageTemp.toFixed(1) }}°C
            </p>
            <p class="text-xs text-red-800 dark:text-red-400 mt-1">
              {{ minTemp.toFixed(1) }}°C - {{ maxTemp.toFixed(1) }}°C
            </p>
          </div>
          <div
            class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30"
          >
            <p class="text-xs text-blue-800 dark:text-blue-400 font-medium mb-1">Humidity</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {{ averageHumidity.toFixed(1) }}%
            </p>
            <p class="text-xs text-blue-800 dark:text-blue-400 mt-1">
              {{ minHumidity.toFixed(1) }}% - {{ maxHumidity.toFixed(1) }}%
            </p>
          </div>
          <div
            class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/30"
          >
            <p class="text-xs text-indigo-800 dark:text-indigo-400 font-medium mb-1">
              Total Rainfall (Est.)
            </p>
            <p class="text-2xl font-bold text-indigo-900 dark:text-indigo-300">
              {{ totalRainfall.toFixed(1) }}mm
            </p>
            <p class="text-xs text-indigo-800 dark:text-indigo-400 mt-1">over period</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, watch, computed } from 'vue'
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
import SingleMetricChart from '@/components/SingleMetricChart.vue'
import LoadingState from '@/components/LoadingState.vue'

// Simple empty state component (inline)
const EmptyState = {
  props: ['message'],
  template: `
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <p class="text-sm text-text-light">{{ message }}</p>
      </div>
    </div>
  `,
}

// --- STATE ---
const isLoading = ref(true)
const selectedTimeRange = ref('last7')
let unsubscribeRef = null
let unsubscribeCallback = null

const chartData = ref({
  labels: [],
  temperature: [],
  humidity: [],
  rainfall: [],
  rainfallTotals: [],
})

// Separate chart data for each metric
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

// Summary statistics with safe fallbacks
const averageTemp = computed(() => {
  const data = chartData.value.temperature.filter((v) => v > 0)
  return data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0
})

const minTemp = computed(() => {
  const data = chartData.value.temperature.filter((v) => v > 0)
  return data.length ? Math.min(...data) : 0
})

const maxTemp = computed(() => {
  const data = chartData.value.temperature.filter((v) => v > 0)
  return data.length ? Math.max(...data) : 0
})

const averageHumidity = computed(() => {
  const data = chartData.value.humidity.filter((v) => v > 0)
  return data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0
})

const minHumidity = computed(() => {
  const data = chartData.value.humidity.filter((v) => v > 0)
  return data.length ? Math.min(...data) : 0
})

const maxHumidity = computed(() => {
  const data = chartData.value.humidity.filter((v) => v > 0)
  return data.length ? Math.max(...data) : 0
})

const totalRainfall = computed(() => {
  const totals = chartData.value.rainfallTotals.filter((v) => v >= 0)
  if (totals.length < 2) return 0
  return Math.max(0, totals[totals.length - 1] - totals[0])
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

// Get ISO week number
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

    // Only add valid numbers
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

    // Calculate averages safely
    temperature.push(g.temps.length ? g.temps.reduce((a, b) => a + b, 0) / g.temps.length : 0)
    humidity.push(g.hums.length ? g.hums.reduce((a, b) => a + b, 0) / g.hums.length : 0)
    rainfall.push(g.rains.length ? g.rains.reduce((a, b) => a + b, 0) / g.rains.length : 0)

    // For rainfall total, use the maximum value in the group (cumulative)
    if (g.rainTotals.length) {
      rainfallTotals.push(Math.max(...g.rainTotals))
    } else {
      rainfallTotals.push(0)
    }
  })

  return { labels, temperature, humidity, rainfall, rainfallTotals }
}

// --- FIREBASE LISTENER ---
const listenForHistoricalData = () => {
  isLoading.value = true

  if (unsubscribeRef && unsubscribeCallback) {
    off(unsubscribeRef, 'value', unsubscribeCallback)
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

  unsubscribeRef = historyRef
  unsubscribeCallback = (snap) => {
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

  onValue(historyQuery, unsubscribeCallback, (error) => {
    console.error('Firebase onValue error:', error)
    isLoading.value = false
  })
}

// --- LIFECYCLE ---
watch(selectedTimeRange, listenForHistoricalData, { immediate: true })
onUnmounted(() => {
  if (unsubscribeRef && unsubscribeCallback) {
    off(unsubscribeRef, 'value', unsubscribeCallback)
  }
})
</script>
