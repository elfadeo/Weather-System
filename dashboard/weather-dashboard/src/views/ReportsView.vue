<template>
  <div class="reports-page p-4 sm:p-6 lg:p-8 font-sans relative">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Data Reports</h1>
        <p class="text-text-light mt-2">
          Generate comprehensive weather data reports with flexible time ranges and grouping
          options.
        </p>
      </div>

      <!-- Quick Time Range Shortcuts -->
      <div class="bg-surface rounded-2xl shadow-md p-6 mb-6 ring-1 ring-border">
        <h3 class="text-sm font-semibold text-text-main mb-3 uppercase tracking-wide">
          Quick Time Range
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in timePresets"
            :key="preset.value"
            @click="applyTimePreset(preset.value)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center',
              activePreset === preset.value
                ? 'bg-primary text-primary-text shadow-md'
                : 'bg-background hover:bg-hover border border-border text-text-main',
            ]"
          >
            <Icon :icon="preset.icon" class="inline h-4 w-4 mr-1" />
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Filters & Actions -->
      <div class="bg-surface rounded-2xl shadow-md p-6 mb-8 ring-1 ring-border">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <!-- Filters -->
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <label for="startDate" class="block text-sm font-medium text-text-main mb-1"
                >Start Date & Time</label
              >
              <input
                id="startDate"
                type="datetime-local"
                v-model="startDateTime"
                @change="onCustomRangeSelected"
                :disabled="Boolean(isExporting) || isLoading"
                class="border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-main px-3 py-2"
              />
            </div>

            <div>
              <label for="endDate" class="block text-sm font-medium text-text-main mb-1"
                >End Date & Time</label
              >
              <input
                id="endDate"
                type="datetime-local"
                v-model="endDateTime"
                @change="onCustomRangeSelected"
                :disabled="Boolean(isExporting) || isLoading"
                class="border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-main px-3 py-2"
              />
            </div>

            <div>
              <label for="groupBy" class="block text-sm font-medium text-text-main mb-1"
                >Group By</label
              >
              <select
                id="groupBy"
                v-model="groupBy"
                :disabled="Boolean(isExporting) || isLoading"
                class="border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-main px-3 py-2"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <!-- Export Buttons -->
          <div class="flex items-center space-x-3">
            <!-- Export CSV Button -->
            <button
              @click="exportToCSV"
              :disabled="!aggregatedData.length || Boolean(isExporting) || isLoading"
              class="flex items-center justify-center px-4 py-2 min-w-[140px] bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isExporting === 'csv' || isLoading" class="flex items-center">
                <Icon icon="ph:circle-notch-bold" class="h-5 w-5 mr-2 animate-spin" />
                Exporting...
              </span>
              <span v-else class="flex items-center">
                <Icon icon="ph:file-csv-bold" class="h-5 w-5 mr-2" />
                Export CSV
              </span>
            </button>

            <!-- Export PDF Button -->
            <button
              @click="exportToPDF"
              :disabled="!aggregatedData.length || Boolean(isExporting) || isLoading"
              class="flex items-center justify-center px-4 py-2 min-w-[140px] bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isExporting === 'pdf' || isLoading" class="flex items-center">
                <Icon icon="ph:circle-notch-bold" class="h-5 w-5 mr-2 animate-spin" />
                Exporting...
              </span>
              <span v-else class="flex items-center">
                <Icon icon="ph:file-pdf-bold" class="h-5 w-5 mr-2" />
                Export PDF
              </span>
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="aggregatedData.length" class="mt-4 pt-4 border-t border-border">
          <div class="flex items-center justify-between text-sm">
            <p class="text-text-light">
              <Icon icon="ph:info-bold" class="inline h-4 w-4 mr-1" />
              Showing <strong>{{ aggregatedData.length }}</strong> {{ groupBy }} period(s) •
              <strong>{{ rawReportData.length }}</strong> total readings •
              <strong>{{ dataTimeRange }}</strong>
            </p>
          </div>
        </div>
      </div>

      <!-- Table + Loading Overlay -->
      <div
        class="bg-surface rounded-2xl shadow-md overflow-hidden ring-1 ring-border relative min-h-[500px]"
      >
        <!-- Loading Overlay (floats on top) -->
        <div
          v-if="isLoading"
          class="absolute inset-0 bg-surface/90 backdrop-blur-sm z-10 flex items-center justify-center"
        >
          <div class="text-center">
            <Icon
              icon="ph:circle-notch-bold"
              class="h-12 w-12 text-primary mx-auto mb-4 animate-spin"
            />
            <p class="text-text-light">Loading data...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!aggregatedData.length && !isLoading" class="p-12 text-center">
          <Icon icon="ph:database-bold" class="h-16 w-16 text-text-light opacity-50 mx-auto mb-4" />
          <p class="text-lg font-medium text-text-main mb-2">No data available</p>
          <p class="text-sm text-text-light">
            Try selecting a different date range or check if your sensors are sending data.
          </p>
        </div>

        <!-- Data Table -->
        <div v-if="aggregatedData.length" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-border">
            <thead class="bg-hover">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider"
                >
                  Avg. Temp (°C)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider"
                >
                  Avg. Humidity (%)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider"
                >
                  Avg. Rain Rate (mm/hr)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider"
                >
                  Period Rainfall (mm)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider"
                >
                  Readings
                </th>
              </tr>
            </thead>
            <tbody class="bg-surface divide-y divide-border">
              <tr
                v-for="record in aggregatedData"
                :key="record.sortKey"
                class="hover:bg-background dark:hover:bg-hover transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                  {{ record.period }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded leading-none',
                      getTempColor(record.temperature),
                    ]"
                  >
                    {{ record.temperature }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded leading-none',
                      getHumidityColor(record.humidity),
                    ]"
                  >
                    {{ record.humidity }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  {{ record.rainfallRate }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded font-medium leading-none',
                      getRainfallColor(record.periodRainfall),
                    ]"
                  >
                    {{ record.periodRainfall }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                  {{ record.count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/*
  Professional Rebuild of Data Reports component
  - Optimized performance with debouncing
  - Smart data fetching for large datasets
  - Robust getFieldValue(...fields)
  - Proper unsubscribe handling
  - Loading overlay & disabled actions during load/export
  - CSV & PDF export using Papa & jsPDF+autoTable
  - Improved rainfall aggregation logic
*/

import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, endAt, onValue, get } from 'firebase/database'
import { Icon } from '@iconify/vue'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ---------- STATE ----------
const startDateTime = ref('')
const endDateTime = ref('')
const groupBy = ref('hourly')
const activePreset = ref('last24h')
const rawReportData = ref([])
const isLoading = ref(false)
const isExporting = ref(false) // false | 'csv' | 'pdf'

let unsubscribe = null
let fetchTimeout = null

// ---------- PRESETS ----------
const timePresets = [
  { value: 'last3h', label: 'Last 3 Hours', icon: 'ph:clock-bold', hours: 3 },
  { value: 'last6h', label: 'Last 6 Hours', icon: 'ph:clock-bold', hours: 6 },
  { value: 'last12h', label: 'Last 12 Hours', icon: 'ph:clock-bold', hours: 12 },
  { value: 'last24h', label: 'Last 24 Hours', icon: 'ph:clock-bold', hours: 24 },
  { value: 'last7d', label: 'Last 7 Days', icon: 'ph:calendar-blank-bold', days: 7 },
  { value: 'last30d', label: 'Last 30 Days', icon: 'ph:calendar-blank-bold', days: 30 },
  { value: 'custom', label: 'Custom Range', icon: 'ph:funnel-bold' },
]

// ---------- UTILITIES ----------
const formatDateTimeLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const applyTimePreset = (presetValue) => {
  activePreset.value = presetValue
  const now = new Date()
  const preset = timePresets.find((p) => p.value === presetValue)
  if (!preset) return

  endDateTime.value = formatDateTimeLocal(now)
  const start = new Date(now)

  if (preset.hours) {
    start.setHours(now.getHours() - preset.hours)
    groupBy.value = preset.hours <= 12 ? 'hourly' : 'daily'
  } else if (preset.days) {
    start.setDate(now.getDate() - preset.days)
    groupBy.value = preset.days <= 7 ? 'daily' : 'weekly'
  } else if (preset.type === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    groupBy.value = 'daily'
  }

  startDateTime.value = formatDateTimeLocal(start)
}

const onCustomRangeSelected = () => {
  activePreset.value = 'custom'
}

// Accepts any number of field names and returns Number or null
const getFieldValue = (record, ...fields) => {
  if (!record || !fields || !fields.length) return null
  for (const f of fields) {
    if (!f) continue
    const v = record[f]
    if (v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v))) {
      return Number(v)
    }
  }
  return null
}

// ---------- OPTIMIZED FETCH DATA ----------
const fetchData = () => {
  // Clear any pending fetch
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }

  // Validate input
  if (!startDateTime.value || !endDateTime.value) {
    rawReportData.value = []
    return
  }

  const startTs = new Date(startDateTime.value).getTime()
  const endTs = new Date(endDateTime.value).getTime()
  if (Number.isNaN(startTs) || Number.isNaN(endTs) || startTs > endTs) {
    rawReportData.value = []
    return
  }

  // Debounce: Wait 300ms before actually fetching
  fetchTimeout = setTimeout(() => {
    performFetch(startTs, endTs)
  }, 300)
}

const performFetch = (startTs, endTs) => {
  // Set loading state
  isLoading.value = true

  // Cleanup previous listener
  if (unsubscribe) {
    try {
      unsubscribe()
    } catch (err) {
      console.warn('Unsubscribe error:', err)
    }
    unsubscribe = null
  }

  const sensorLogsRef = query(
    dbRef(rtdb, 'sensor_logs'),
    orderByChild('timestamp'),
    startAt(startTs),
    endAt(endTs),
  )

  // Check if it's a large dataset (more than 7 days)
  const timeDiff = endTs - startTs
  const isLargeDataset = timeDiff > 7 * 24 * 60 * 60 * 1000

  if (isLargeDataset) {
    // For large datasets, use one-time read
    get(sensorLogsRef)
      .then((snapshot) => {
        const data = snapshot.val()
        rawReportData.value = data ? Object.values(data) : []
        isLoading.value = false
      })
      .catch((error) => {
        console.error('Error fetching report data:', error)
        rawReportData.value = []
        isLoading.value = false
      })
  } else {
    // For smaller datasets, use real-time listener
    unsubscribe = onValue(
      sensorLogsRef,
      (snapshot) => {
        const data = snapshot.val()
        rawReportData.value = data ? Object.values(data) : []
        isLoading.value = false
      },
      (error) => {
        console.error('Error fetching report data:', error)
        rawReportData.value = []
        isLoading.value = false
      },
    )
  }
}

// watch for time changes
watch([startDateTime, endDateTime], fetchData, { immediate: false })

onMounted(() => {
  applyTimePreset('last24h')
})

onUnmounted(() => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }
  if (unsubscribe) {
    try {
      unsubscribe()
    } catch (err) {
      console.warn('Cleanup error:', err)
    }
    unsubscribe = null
  }
})

// ---------- COMPUTED: dataTimeRange ----------
const dataTimeRange = computed(() => {
  if (!rawReportData.value.length) return 'No data'
  const timestamps = rawReportData.value
    .map((r) => (r && typeof r.timestamp !== 'undefined' ? Number(r.timestamp) : NaN))
    .filter((t) => !Number.isNaN(t))
  if (!timestamps.length) return 'No data'
  const earliest = new Date(Math.min(...timestamps))
  const latest = new Date(Math.max(...timestamps))
  const fmt = (d) =>
    d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  return `${fmt(earliest)} to ${fmt(latest)}`
})

// ---------- COMPUTED: aggregatedData ----------
const aggregatedData = computed(() => {
  if (!rawReportData.value.length) return []

  const getGroupKey = (record, period) => {
    if (!record || typeof record.timestamp === 'undefined') return null
    const date = new Date(Number(record.timestamp))
    if (Number.isNaN(date.getTime())) return null

    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const hour = date.getHours()

    switch (period) {
      case 'hourly':
        return {
          key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(hour).padStart(2, '0')}`,
          label: date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
        }
      case 'daily':
        return {
          key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          label: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        }
      case 'weekly': {
        const tmp = new Date(date)
        const dayOfWeek = tmp.getDay()
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        tmp.setDate(tmp.getDate() - daysSinceMonday)
        tmp.setHours(0, 0, 0, 0)
        const startOfWeek = tmp
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        const localIso = (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return {
          key: localIso(startOfWeek),
          label: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        }
      }
      case 'monthly':
        return {
          key: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        }
      case 'yearly':
        return {
          key: `${year}-01-01`,
          label: `Year ${year}`,
        }
      default:
        return null
    }
  }

  // Use Map for better performance
  const groups = new Map()

  rawReportData.value.forEach((record) => {
    const result = getGroupKey(record, groupBy.value)
    if (!result) return
    const { key, label } = result

    if (!groups.has(key)) {
      groups.set(key, {
        label,
        tempSum: 0,
        tempCount: 0,
        humiditySum: 0,
        humidityCount: 0,
        rainfallRateSum: 0,
        rainfallRateCount: 0,
        rainfallReadings: [],
        recordCount: 0,
      })
    }

    const group = groups.get(key)

    // Temperature
    const temp = getFieldValue(record, 'temperature', 'temp')
    if (temp !== null) {
      group.tempSum += temp
      group.tempCount++
    }

    // Humidity
    const hum = getFieldValue(record, 'humidity', 'hum')
    if (hum !== null) {
      group.humiditySum += hum
      group.humidityCount++
    }

    // Rain rate
    const rainRate = getFieldValue(
      record,
      'rainRateEstimated_mm_hr_bucket',
      'rainRate_mm_hr',
      'rainRate_mm',
    )
    if (rainRate !== null) {
      group.rainfallRateSum += rainRate
      group.rainfallRateCount++
    }

    // Rainfall readings
    const timestamp = Number(record.timestamp)
    const hourlyMm = getFieldValue(record, 'rainfall_hourly_mm', 'rainfall_hourly', 'rain_mm_hour')
    const dailyMm = getFieldValue(
      record,
      'rainfall_daily_mm',
      'rainfall_total_estimated_mm_bucket',
      'rainfall_cumulative_mm',
    )

    if (!Number.isNaN(timestamp)) {
      group.rainfallReadings.push({
        timestamp,
        hourly: hourlyMm !== null ? hourlyMm : 0,
        daily: dailyMm !== null ? dailyMm : 0,
      })
    }

    group.recordCount++
  })

  // Build aggregated list
  const result = []

  for (const [key, group] of groups) {
    let periodRainfall = 0

    if (group.rainfallReadings.length > 0) {
      const sorted = group.rainfallReadings.sort((a, b) => a.timestamp - b.timestamp)

      if (groupBy.value === 'hourly') {
        const hourlyValues = sorted.map((r) => r.hourly).filter((v) => v > 0)

        if (hourlyValues.length > 0) {
          const firstValue = hourlyValues[0]
          const lastValue = hourlyValues[hourlyValues.length - 1]

          if (lastValue >= firstValue) {
            periodRainfall = lastValue - firstValue
          } else {
            periodRainfall = lastValue
          }

          if (hourlyValues.length === 1) {
            periodRainfall = lastValue
          }
        }
      } else {
        const firstDaily = sorted[0].daily
        const lastDaily = sorted[sorted.length - 1].daily

        if (lastDaily >= firstDaily) {
          periodRainfall = lastDaily - firstDaily
        } else {
          const hourlyMap = new Map()

          sorted.forEach((reading) => {
            const date = new Date(reading.timestamp)
            const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`

            const current = hourlyMap.get(hourKey)
            if (
              !current ||
              reading.hourly > current.hourly ||
              (reading.hourly === current.hourly && reading.timestamp > current.timestamp)
            ) {
              hourlyMap.set(hourKey, reading)
            }
          })

          periodRainfall = Array.from(hourlyMap.values()).reduce(
            (sum, reading) => sum + reading.hourly,
            0,
          )
        }
      }
    }

    periodRainfall = Math.max(0, periodRainfall)

    result.push({
      period: group.label,
      temperature: group.tempCount > 0 ? (group.tempSum / group.tempCount).toFixed(1) : 'N/A',
      humidity:
        group.humidityCount > 0 ? (group.humiditySum / group.humidityCount).toFixed(0) : 'N/A',
      rainfallRate:
        group.rainfallRateCount > 0
          ? (group.rainfallRateSum / group.rainfallRateCount).toFixed(2)
          : 'N/A',
      periodRainfall: periodRainfall.toFixed(2),
      count: group.recordCount,
      sortKey: key,
    })
  }

  return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
})

// ---------- UI Helpers: Colors ----------
const getTempColor = (temp) => {
  if (temp === 'N/A') return 'bg-background border border-border text-text-light'
  const t = parseFloat(temp)
  if (t >= 35) return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200'
  if (t >= 30) return 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200'
  if (t >= 25) return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200'
  if (t >= 20) return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200'
  return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
}

const getHumidityColor = (humidity) => {
  if (humidity === 'N/A') return 'bg-background border border-border text-text-light'
  const h = parseFloat(humidity)
  if (h >= 80) return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
  if (h >= 60) return 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-200'
  if (h >= 40) return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200'
  return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200'
}

const getRainfallColor = (rainfall) => {
  if (rainfall === 'N/A') return 'bg-background border border-border text-text-light'
  const r = parseFloat(rainfall)
  if (r === 0) return 'bg-background border border-border text-text-light'
  if (r < 2.5) return 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-200'
  if (r < 10) return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
  if (r < 50) return 'bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-100'
  return 'bg-blue-300 dark:bg-blue-700/70 text-blue-900 dark:text-blue-50'
}

// ---------- EXPORTS ----------
const exportToCSV = () => {
  if (!aggregatedData.value.length) return
  isExporting.value = 'csv'

  try {
    const csv = Papa.unparse(
      aggregatedData.value.map(
        ({ period, temperature, humidity, rainfallRate, periodRainfall, count }) => ({
          Period: period,
          'Avg Temperature (°C)': temperature,
          'Avg Humidity (%)': humidity,
          'Avg Rainrate (mm/hr)': rainfallRate,
          'Period Rainfall (mm)': periodRainfall,
          'Number of Readings': count,
        }),
      ),
    )

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `weather_report_${groupBy.value}_${timestamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('CSV export failed', err)
  } finally {
    setTimeout(() => {
      isExporting.value = false
    }, 300)
  }
}

const exportToPDF = () => {
  if (!aggregatedData.value.length) return
  isExporting.value = 'pdf'

  try {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Weather Data Report', 14, 20)
    doc.setFontSize(10)
    doc.text(`Grouping: ${groupBy.value.charAt(0).toUpperCase() + groupBy.value.slice(1)}`, 14, 28)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)
    doc.text(`Data Range: ${dataTimeRange.value}`, 14, 40)
    doc.text(`Total Periods: ${aggregatedData.value.length}`, 14, 46)
    doc.text(`Total Readings: ${rawReportData.value.length}`, 14, 52)

    const tableColumn = [
      'Period',
      'Avg. Temp (°C)',
      'Avg. Humidity (%)',
      'Avg. Rain Rate (mm/hr)',
      'Period Rainfall (mm)',
      'Readings',
    ]
    const tableRows = aggregatedData.value.map((row) => [
      row.period,
      row.temperature,
      row.humidity,
      row.rainfallRate,
      row.periodRainfall,
      row.count,
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    const timestamp = new Date().toISOString().split('T')[0]
    doc.save(`weather_report_${groupBy.value}_${timestamp}.pdf`)
  } catch (err) {
    console.error('PDF export failed', err)
  } finally {
    setTimeout(() => {
      isExporting.value = false
    }, 300)
  }
}
</script>

<style scoped>
/* Small styling for overlay and loader center */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--color-text-main);
}
</style>
