<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-[var(--color-text-main)] tracking-tight">
          Data Reports
        </h1>
        <p class="text-[var(--color-text-light)] mt-2">
          Generate comprehensive weather data reports with flexible time ranges and grouping
          options.
        </p>
      </div>

      <!-- Quick Time Range Shortcuts -->
      <div class="bg-[var(--color-surface)] rounded-2xl shadow-md p-6 mb-6">
        <h3
          class="text-sm font-semibold text-[var(--color-text-main)] mb-3 uppercase tracking-wide"
        >
          Quick Time Range
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in timePresets"
            :key="preset.value"
            @click="applyTimePreset(preset.value)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activePreset === preset.value
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
            ]"
          >
            <Icon :icon="preset.icon" class="inline h-4 w-4 mr-1" />
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Custom Filters + Actions -->
      <div class="bg-[var(--color-surface)] rounded-2xl shadow-md p-6 mb-8">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <!-- Left: Filters -->
          <div class="flex flex-wrap items-end gap-4">
            <!-- Start Date -->
            <div>
              <label
                for="startDate"
                class="block text-sm font-medium text-[var(--color-text-main)] mb-1"
              >
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="startDate"
                v-model="startDateTime"
                @change="activePreset = 'custom'"
                class="border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-text-main)]"
              />
            </div>

            <!-- End Date -->
            <div>
              <label
                for="endDate"
                class="block text-sm font-medium text-[var(--color-text-main)] mb-1"
              >
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="endDate"
                v-model="endDateTime"
                @change="activePreset = 'custom'"
                class="border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-text-main)]"
              />
            </div>

            <!-- Group By -->
            <div>
              <label
                for="groupBy"
                class="block text-sm font-medium text-[var(--color-text-main)] mb-1"
              >
                Group By
              </label>
              <select
                id="groupBy"
                v-model="groupBy"
                class="border-gray-300 dark:border-white/10 rounded-lg shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-text-main)]"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <!-- Right: Export Buttons -->
          <div class="flex items-center space-x-3">
            <button
              @click="exportToCSV"
              :disabled="!aggregatedData.length || isExporting"
              class="flex items-center justify-center px-4 py-2 min-w-[140px] bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isExporting === 'csv'" class="flex items-center">
                <Icon icon="ph:circle-notch-bold" class="h-5 w-5 mr-2 animate-spin" />
                Exporting...
              </span>
              <span v-else class="flex items-center">
                <Icon icon="ph:file-csv-bold" class="h-5 w-5 mr-2" />
                Export CSV
              </span>
            </button>

            <button
              @click="exportToPDF"
              :disabled="!aggregatedData.length || isExporting"
              class="flex items-center justify-center px-4 py-2 min-w-[140px] bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isExporting === 'pdf'" class="flex items-center">
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

        <!-- Data Summary -->
        <div
          v-if="aggregatedData.length"
          class="mt-4 pt-4 border-t border-gray-200 dark:border-white/10"
        >
          <div class="flex items-center justify-between text-sm">
            <p class="text-[var(--color-text-light)]">
              <Icon icon="ph:info-bold" class="inline h-4 w-4 mr-1" />
              Showing <strong>{{ aggregatedData.length }}</strong> {{ groupBy }} period(s) •
              <strong>{{ rawReportData.length }}</strong> total readings •
              <strong>{{ dataTimeRange }}</strong>
            </p>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-[var(--color-surface)] rounded-2xl shadow-md overflow-hidden">
        <div v-if="isLoading" class="p-12 text-center">
          <Icon
            icon="ph:circle-notch-bold"
            class="h-12 w-12 text-[var(--color-primary)] mx-auto mb-4 animate-spin"
          />
          <p class="text-[var(--color-text-light)]">Loading data...</p>
        </div>

        <div v-else-if="!aggregatedData.length" class="p-12 text-center">
          <Icon icon="ph:database-bold" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p class="text-lg font-medium text-[var(--color-text-main)] mb-2">No data available</p>
          <p class="text-sm text-[var(--color-text-light)]">
            Try selecting a different date range or check if your sensors are sending data.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-white/10">
            <thead class="bg-[var(--color-background)]">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wider"
                >
                  Avg. Temp (°C)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wider"
                >
                  Avg. Humidity (%)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wider"
                >
                  Avg. Rain Rate (mm/hr)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wider"
                >
                  Period Rainfall (mm)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-light)] uppercase tracking-wider"
                >
                  Readings
                </th>
              </tr>
            </thead>
            <tbody class="bg-[var(--color-surface)] divide-y divide-gray-200 dark:divide-white/10">
              <tr
                v-for="record in aggregatedData"
                :key="record.period"
                class="hover:bg-[var(--color-background)] transition-colors"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-main)]"
                >
                  {{ record.period }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-main)]">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded',
                      getTempColor(record.temperature),
                    ]"
                  >
                    {{ record.temperature }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-main)]">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded',
                      getHumidityColor(record.humidity),
                    ]"
                  >
                    {{ record.humidity }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-main)]">
                  {{ record.rainfallRate }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-main)]">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded font-medium',
                      getRainfallColor(record.periodRainfall),
                    ]"
                  >
                    {{ record.periodRainfall }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-light)]">
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
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, endAt, onValue } from 'firebase/database'
import { Icon } from '@iconify/vue'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// State
const startDateTime = ref('')
const endDateTime = ref('')
const groupBy = ref('hourly')
const activePreset = ref('last24h')
const rawReportData = ref([])
const isLoading = ref(false)
const isExporting = ref(false)

let unsubscribe = null

// Time range presets
const timePresets = [
  { value: 'last3h', label: 'Last 3 Hours', icon: 'ph:clock-bold', hours: 3 },
  { value: 'last6h', label: 'Last 6 Hours', icon: 'ph:clock-bold', hours: 6 },
  { value: 'last12h', label: 'Last 12 Hours', icon: 'ph:clock-bold', hours: 12 },
  { value: 'last24h', label: 'Last 24 Hours', icon: 'ph:clock-bold', hours: 24 },
  { value: 'last7d', label: 'Last 7 Days', icon: 'ph:calendar-blank-bold', days: 7 },
  { value: 'last30d', label: 'Last 30 Days', icon: 'ph:calendar-blank-bold', days: 30 },
  { value: 'thisMonth', label: 'This Month', icon: 'ph:calendar-bold', type: 'month' },
  { value: 'custom', label: 'Custom Range', icon: 'ph:funnel-bold' },
]

// Apply time preset
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

// Format date for datetime-local input
const formatDateTimeLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

onMounted(() => {
  applyTimePreset('last24h')
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// Fetch data from Firebase
const fetchData = () => {
  if (!startDateTime.value || !endDateTime.value) return

  isLoading.value = true
  if (unsubscribe) unsubscribe()

  const startTimestamp = new Date(startDateTime.value).getTime()
  const endTimestamp = new Date(endDateTime.value).getTime()

  const sensorLogsRef = query(
    dbRef(rtdb, 'sensor_logs'),
    orderByChild('timestamp'),
    startAt(startTimestamp),
    endAt(endTimestamp),
  )

  unsubscribe = onValue(
    sensorLogsRef,
    (snapshot) => {
      const data = snapshot.val()
      rawReportData.value = data ? Object.values(data) : []
      isLoading.value = false
    },
    (error) => {
      console.error('Error fetching report data:', error)
      isLoading.value = false
    },
  )
}

watch([startDateTime, endDateTime], fetchData, { immediate: true })

// Data time range display
const dataTimeRange = computed(() => {
  if (!rawReportData.value.length) return 'No data'
  const timestamps = rawReportData.value.map((r) => r.timestamp)
  const earliest = new Date(Math.min(...timestamps))
  const latest = new Date(Math.max(...timestamps))

  const formatTime = (date) =>
    date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return `${formatTime(earliest)} to ${formatTime(latest)}`
})

// Helper to get field value with fallback to old field names
const getFieldValue = (record, primaryField, fallbackField) => {
  const value = record[primaryField] ?? record[fallbackField]
  return value != null && !isNaN(value) ? Number(value) : null
}

// Aggregate data - ENHANCED to support both old and new field names
const aggregatedData = computed(() => {
  if (!rawReportData.value.length) return []

  const getGroupKey = (record, period) => {
    if (!record || !record.timestamp) return null

    const date = new Date(record.timestamp)
    if (isNaN(date.getTime())) return null

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
        const startOfWeek = new Date(tmp)
        const endOfWeek = new Date(tmp)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        return {
          key: startOfWeek.toISOString().split('T')[0],
          label: `${startOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })} - ${endOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`,
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

  const groups = {}

  rawReportData.value.forEach((record) => {
    const result = getGroupKey(record, groupBy.value)
    if (!result) return

    const { key, label } = result
    if (!groups[key]) {
      groups[key] = {
        label,
        tempSum: 0,
        tempCount: 0,
        humiditySum: 0,
        humidityCount: 0,
        rainfallRateSum: 0,
        rainfallRateCount: 0,
        hourlyRainfalls: [],
        dailyRainfalls: [],
        recordCount: 0,
      }
    }

    // Temperature
    const temp = getFieldValue(record, 'temperature')
    if (temp !== null) {
      groups[key].tempSum += temp
      groups[key].tempCount++
    }

    // Humidity
    const humidity = getFieldValue(record, 'humidity')
    if (humidity !== null) {
      groups[key].humiditySum += humidity
      groups[key].humidityCount++
    }

    // Rainfall Rate - supports both new and old field names
    const rainfallRate = getFieldValue(record, 'rainRateEstimated_mm_hr_bucket', 'rainRate_mm_hr')
    if (rainfallRate !== null) {
      groups[key].rainfallRateSum += rainfallRate
      groups[key].rainfallRateCount++
    }

    // Hourly rainfall - NEW FIELD
    const hourlyRain = getFieldValue(record, 'rainfall_hourly_mm')
    if (hourlyRain !== null) {
      groups[key].hourlyRainfalls.push(hourlyRain)
    }

    // Daily rainfall - supports both new and old field names
    const dailyRain = getFieldValue(
      record,
      'rainfall_daily_mm',
      'rainfall_total_estimated_mm_bucket',
    )
    if (dailyRain !== null) {
      groups[key].dailyRainfalls.push(dailyRain)
    }

    groups[key].recordCount++
  })

  return Object.keys(groups)
    .map((key) => {
      const group = groups[key]

      // Calculate period rainfall based on grouping
      let periodRainfall = 0
      if (groupBy.value === 'hourly' && group.hourlyRainfalls.length > 0) {
        // For hourly: use max hourly value
        periodRainfall = Math.max(...group.hourlyRainfalls)
      } else if (group.dailyRainfalls.length > 0) {
        // For daily/weekly/monthly: calculate difference
        const sorted = group.dailyRainfalls.sort((a, b) => a - b)
        periodRainfall = sorted[sorted.length - 1] - sorted[0]
      }

      return {
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
      }
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
})

// Color helpers for visual feedback
const getTempColor = (temp) => {
  if (temp === 'N/A') return 'bg-gray-100 text-gray-600'
  const t = parseFloat(temp)
  if (t >= 35) return 'bg-red-100 text-red-700'
  if (t >= 30) return 'bg-orange-100 text-orange-700'
  if (t >= 25) return 'bg-yellow-100 text-yellow-700'
  if (t >= 20) return 'bg-green-100 text-green-700'
  return 'bg-blue-100 text-blue-700'
}

const getHumidityColor = (humidity) => {
  if (humidity === 'N/A') return 'bg-gray-100 text-gray-600'
  const h = parseFloat(humidity)
  if (h >= 80) return 'bg-blue-100 text-blue-700'
  if (h >= 60) return 'bg-cyan-100 text-cyan-700'
  if (h >= 40) return 'bg-green-100 text-green-700'
  return 'bg-yellow-100 text-yellow-700'
}

const getRainfallColor = (rainfall) => {
  if (rainfall === 'N/A') return 'bg-gray-100 text-gray-600'
  const r = parseFloat(rainfall)
  if (r === 0) return 'bg-gray-100 text-gray-600'
  if (r < 2.5) return 'bg-blue-50 text-blue-600'
  if (r < 10) return 'bg-blue-100 text-blue-700'
  if (r < 50) return 'bg-blue-200 text-blue-800'
  return 'bg-blue-300 text-blue-900'
}

// Export CSV
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
          'Avg Rainfall Rate (mm/hr)': rainfallRate,
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
  } finally {
    isExporting.value = false
  }
}

// Export PDF
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
  } finally {
    isExporting.value = false
  }
}
</script>
