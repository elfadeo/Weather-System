// src/composables/useChartsData.js - OPTIMIZED FOR SPEED & ACCURACY
import { ref, onUnmounted } from 'vue'
import { rtdb } from '@/firebase.js'
import {
  ref as dbRef,
  query,
  orderByChild,
  get,
  limitToLast,
  onValue,
  off,
} from 'firebase/database'

const DEBUG = true
const log = (...args) => {
  if (DEBUG) console.log('[Charts]', ...args)
}

export const TIME_RANGES = {
  LAST_7: 'last7',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

// FIXED: Use local timezone instead of UTC
const formatUTC = (timestamp, format) => {
  const date = new Date(timestamp)

  const formats = {
    datetime: () =>
      date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    date: () =>
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    month: () =>
      date.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    year: () => date.getFullYear().toString(),
  }

  return formats[format] ? formats[format]() : date.toISOString()
}

const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const isSlowConnection = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return (
    (connection &&
      (connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.effectiveType === '3g' ||
        connection.saveData === true)) ||
    isMobile()
  )
}

export function useChartsData() {
  const isLoading = ref(true)
  const loadingProgress = ref(0)
  const loadingMessage = ref('')
  const dataAvailabilityInfo = ref('')
  const error = ref(null)
  const chartData = ref({
    labels: [],
    temperature: [],
    humidity: [],
    rainfall: [],
    rainfallTotals: [],
  })

  let abortController = null
  let firebaseListener = null
  let isMounted = true
  let retryTimeout = null
  let retryCount = 0
  const MAX_RETRIES = 3

  // Helper: Get Rain Rate from ANY possible field name
  const getRainRate = (record) => {
    const candidates = [
      record.rainRateEstimated_mm_hr_bucket, // Live data
      record.avgRainRate, // Aggregated
      record.rainRate_mm_hr, // Backfilled
      record.rainRate, // Alternate
    ]
    for (const val of candidates) {
      if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
        return Number(val)
      }
    }
    return 0
  }

  const getRecordLimit = (range) => {
    if (range === TIME_RANGES.LAST_7) return 7
    const slow = isSlowConnection()
    const mobile = isMobile()
    const limits = {
      [TIME_RANGES.WEEKLY]: slow ? 5000 : mobile ? 8000 : 15000,
      [TIME_RANGES.MONTHLY]: slow ? 10000 : mobile ? 20000 : 40000,
      [TIME_RANGES.YEARLY]: slow ? 15000 : mobile ? 30000 : 60000,
    }
    return limits[range] || (slow ? 10000 : mobile ? 15000 : 30000)
  }

  const getSamplingRate = (totalDays, timeRange) => {
    if (timeRange === TIME_RANGES.LAST_7) return 1
    const slow = isSlowConnection()
    const mobile = isMobile()
    const getSamplingForDevice = (device) => {
      const rates = {
        slow: { 365: 60, 180: 30, 30: 20, default: 10 },
        mobile: { 365: 60, 180: 30, 60: 15, 30: 10, default: 5 },
        desktop: { 365: 30, 180: 15, 60: 10, 30: 5, default: 2 },
      }
      const deviceRates = rates[device]
      for (const [days, rate] of Object.entries(deviceRates)) {
        if (days !== 'default' && totalDays > parseInt(days)) return rate
      }
      return deviceRates.default
    }
    if (slow) return getSamplingForDevice('slow')
    if (mobile) return getSamplingForDevice('mobile')
    return getSamplingForDevice('desktop')
  }

  const getTimeRangeBounds = (range) => {
    const now = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000
    const ranges = {
      [TIME_RANGES.LAST_7]: {
        start: now - 7 * DAY_MS,
        end: now,
        label: 'Last 7 Readings',
        days: 0,
      },
      [TIME_RANGES.WEEKLY]: { start: now - 28 * DAY_MS, end: now, label: 'Last 4 Weeks', days: 28 },
      [TIME_RANGES.MONTHLY]: {
        start: now - 180 * DAY_MS,
        end: now,
        label: 'Last 6 Months',
        days: 180,
      },
      [TIME_RANGES.YEARLY]: {
        start: now - 730 * DAY_MS,
        end: now,
        label: 'Last 2 Years',
        days: 730,
      },
    }
    return ranges[range] || ranges[TIME_RANGES.LAST_7]
  }

  const isValidSensorData = (record) => {
    const temp = Number(record.temperature)
    const hum = Number(record.humidity)
    const rain = getRainRate(record)
    const rainTotal = Number(record.rainfall_total_estimated_mm_bucket)

    return {
      temperature: !isNaN(temp) && temp >= 15 && temp <= 45,
      humidity: !isNaN(hum) && hum >= 0 && hum <= 100,
      rainfall: !isNaN(rain) && rain >= 0 && rain <= 300,
      rainfallTotal: !isNaN(rainTotal) && rainTotal >= 0,
    }
  }

  const fetchWithFallback = async (range) => {
    const limit = getRecordLimit(range)
    const bounds = getTimeRangeBounds(range)
    log(`⚡ Fetching last ${limit} records for ${bounds.label}`)
    loadingMessage.value = `Loading ${bounds.label}...`
    loadingProgress.value = 20

    const fetchFromDatabase = async (dbPath, dbName) => {
      const ref = dbRef(rtdb, dbPath)
      const dbQuery = query(ref, orderByChild('timestamp'), limitToLast(limit))
      const snapshot = await get(dbQuery)
      if (!snapshot.exists()) return null
      const allRecords = Object.values(snapshot.val())
      log(`${dbName}: Fetched ${allRecords.length} records`)
      const filtered =
        range === TIME_RANGES.LAST_7
          ? allRecords
          : allRecords.filter((r) => r.timestamp >= bounds.start && r.timestamp <= bounds.end)
      log(`${dbName}: Filtered to ${filtered.length} records`)
      return filtered
    }

    try {
      loadingProgress.value = 40
      let records = await fetchFromDatabase('sensor_logs_dashboard', 'Dashboard')
      if (!records) {
        log('⚠️ No data in dashboard - checking main database...')
        loadingProgress.value = 60
        records = await fetchFromDatabase('sensor_logs', 'Main DB')
      }
      loadingProgress.value = 90
      if (!records) return []
      return records
    } catch (error) {
      log('❌ Fetch error:', error)
      throw error
    }
  }

  // Process last 7 readings (Live)
  const processLast7 = (records) => ({
    labels: records.map((r) => formatUTC(r.timestamp, 'datetime')),
    temperature: records.map((r) => Number(r.temperature) || 0),
    humidity: records.map((r) => Number(r.humidity) || 0),
    rainfall: records.map((r) => getRainRate(r)),
    rainfallTotals: records.map((r) => Number(r.rainfall_total_estimated_mm_bucket) || 0),
  })

  // ⚡ FAST PATH: Process Pre-Aggregated Data (The Shortcut)
  const processPreAggregated = (records, range) => {
    log('🚀 Using optimized path for pre-aggregated data')
    // No grouping needed, just map and display
    return {
      labels: records.map((r) => formatTimestamp(r.timestamp, range)),
      temperature: records.map((r) => Number(r.avgTemperature) || Number(r.temperature) || 0),
      humidity: records.map((r) => Number(r.avgHumidity) || Number(r.humidity) || 0),
      rainfall: records.map((r) => getRainRate(r)),
      rainfallTotals: records.map(
        (r) => Number(r.totalRainfall) || Number(r.rainfall_total_estimated_mm_bucket) || 0,
      ),
    }
  }

  // Process raw data (Heavy Math)
  const processAggregated = (records, range) => {
    const grouped = {}
    records.forEach((record) => {
      const key = getGroupKey(record.timestamp, range)
      if (!grouped[key]) {
        grouped[key] = {
          timestamp: record.timestamp,
          temps: [],
          hums: [],
          rains: [],
          rainTotals: [],
        }
      }
      const validation = isValidSensorData(record)
      if (validation.temperature) grouped[key].temps.push(Number(record.temperature))
      if (validation.humidity) grouped[key].hums.push(Number(record.humidity))
      if (validation.rainfall) grouped[key].rains.push(getRainRate(record))
      if (validation.rainfallTotal)
        grouped[key].rainTotals.push(Number(record.rainfall_total_estimated_mm_bucket))
    })

    const sorted = Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp)
    const calculateAverage = (arr) => (arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0)

    return {
      labels: sorted.map((g) => formatTimestamp(g.timestamp, range)),
      temperature: sorted.map((g) => calculateAverage(g.temps)),
      humidity: sorted.map((g) => calculateAverage(g.hums)),
      rainfall: sorted.map((g) => calculateAverage(g.rains)),
      rainfallTotals: sorted.map((g) => (g.rainTotals.length ? Math.max(...g.rainTotals) : 0)),
    }
  }

  // Main Processing Hub
  const processRecords = (records, range) => {
    if (!records || records.length === 0) {
      return { labels: [], temperature: [], humidity: [], rainfall: [], rainfallTotals: [] }
    }

    records.sort((a, b) => a.timestamp - b.timestamp)

    // 1. Live Data (Always raw)
    if (range === TIME_RANGES.LAST_7) {
      return processLast7(records)
    }

    // 2. ⚡ Check if data is ALREADY aggregated (Like your Report)
    if (records[0].aggregation_type === 'daily' || records[0].aggregation_type === 'hourly') {
      return processPreAggregated(records, range)
    }

    // 3. Raw Data (Needs sampling & heavy math)
    const bounds = getTimeRangeBounds(range)
    const samplingRate = getSamplingRate(bounds.days, range)
    const sampled =
      samplingRate > 1 ? records.filter((_, idx) => idx % samplingRate === 0) : records

    if (samplingRate > 1) {
      log(`Sampled ${records.length} → ${sampled.length} (rate: ${samplingRate})`)
    }

    return processAggregated(sampled, range)
  }

  // FIXED: Use local timezone for consistent grouping
  const getGroupKey = (timestamp, range) => {
    const date = new Date(timestamp)

    // Use local time methods instead of UTC
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    if (range === TIME_RANGES.WEEKLY) {
      // Calculate week start using local time
      const localDate = new Date(year, month, day)
      const dayOfWeek = localDate.getDay()
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(localDate)
      monday.setDate(localDate.getDate() - daysSinceMonday)
      monday.setHours(0, 0, 0, 0)

      const y = monday.getFullYear()
      const m = String(monday.getMonth() + 1).padStart(2, '0')
      const d = String(monday.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    if (range === TIME_RANGES.MONTHLY) {
      const y = year
      const m = String(month + 1).padStart(2, '0')
      return `${y}-${m}-01`
    }

    if (range === TIME_RANGES.YEARLY) {
      return `${year}-01-01`
    }

    return date.toISOString()
  }

  // FIXED: Use local timezone formatting
  const formatTimestamp = (timestamp, range) => {
    if (range === TIME_RANGES.LAST_7) return formatUTC(timestamp, 'datetime')

    if (range === TIME_RANGES.WEEKLY) {
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = date.getMonth()
      const day = date.getDate()

      const localDate = new Date(year, month, day)
      const dayOfWeek = localDate.getDay()
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(localDate)
      monday.setDate(localDate.getDate() - daysSinceMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      return `${formatUTC(monday.getTime(), 'date')} - ${formatUTC(sunday.getTime(), 'date')}`
    }

    if (range === TIME_RANGES.MONTHLY) return formatUTC(timestamp, 'month')
    return formatUTC(timestamp, 'year')
  }

  const updateAvailabilityInfo = (records, range) => {
    if (!records || records.length === 0) {
      dataAvailabilityInfo.value = 'No data available'
      return
    }
    if (range === TIME_RANGES.LAST_7) {
      dataAvailabilityInfo.value = `${records.length} live readings • Real-time`
      return
    }
    const oldestTs = Math.min(...records.map((r) => r.timestamp))
    const newestTs = Math.max(...records.map((r) => r.timestamp))
    const spanDays = Math.floor((newestTs - oldestTs) / (24 * 60 * 60 * 1000))
    const bounds = getTimeRangeBounds(range)
    dataAvailabilityInfo.value = `${records.length} readings (${spanDays} day span) • ${bounds.label}`
  }

  const fetchLast7 = () => {
    log('Setting up real-time listener for Last 7 Readings')
    loadingMessage.value = 'Connecting to live data...'
    error.value = null
    const historyRef = dbRef(rtdb, 'sensor_logs_dashboard')
    const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(7))

    const callback = (snapshot) => {
      if (!isMounted) return
      log('📡 Real-time update received')
      retryCount = 0
      if (!snapshot.exists()) {
        chartData.value = {
          labels: [],
          temperature: [],
          humidity: [],
          rainfall: [],
          rainfallTotals: [],
        }
        dataAvailabilityInfo.value = 'No data available'
      } else {
        const records = Object.values(snapshot.val())
        log(`Received ${records.length} records`)
        chartData.value = processRecords(records, TIME_RANGES.LAST_7)
        updateAvailabilityInfo(records, TIME_RANGES.LAST_7)
      }
      isLoading.value = false
      loadingProgress.value = 0
      loadingMessage.value = ''
    }

    const errorCallback = (err) => {
      log('Firebase error:', err)
      if (!isMounted) return
      error.value = err.message
      isLoading.value = false
      if (retryCount < MAX_RETRIES) {
        retryCount++
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        dataAvailabilityInfo.value = `Connection error. Retrying in ${retryDelay / 1000}s... (${retryCount}/${MAX_RETRIES})`
        retryTimeout = setTimeout(() => {
          log(`Retry attempt ${retryCount}/${MAX_RETRIES}`)
          fetchLast7()
        }, retryDelay)
      } else {
        dataAvailabilityInfo.value = 'Connection failed. Please refresh the page.'
      }
    }
    firebaseListener = { ref: historyRef, callback }
    onValue(historyQuery, callback, errorCallback)
  }

  const fetchHistorical = async (range) => {
    log(`Fetching historical data: ${range}`)
    error.value = null
    try {
      const records = await fetchWithFallback(range)
      if (abortController?.signal.aborted || !isMounted) {
        log('⚠️ Fetch aborted or component unmounted')
        return
      }
      if (records.length === 0) {
        chartData.value = {
          labels: [],
          temperature: [],
          humidity: [],
          rainfall: [],
          rainfallTotals: [],
        }
        dataAvailabilityInfo.value = 'No data found in this time range'
      } else {
        chartData.value = processRecords(records, range)
        updateAvailabilityInfo(records, range)
      }
    } catch (err) {
      log('Fetch error:', err)
      error.value = err.message
      if (isMounted) {
        chartData.value = {
          labels: [],
          temperature: [],
          humidity: [],
          rainfall: [],
          rainfallTotals: [],
        }
        dataAvailabilityInfo.value = 'Error loading data. Please try again.'
      }
    } finally {
      if (isMounted) {
        isLoading.value = false
        loadingProgress.value = 0
        loadingMessage.value = ''
      }
    }
  }

  const fetchData = async (range = TIME_RANGES.LAST_7) => {
    log(`\n========== Fetching: ${range} ==========`)
    log(
      'Device:',
      isMobile() ? 'Mobile' : 'Desktop',
      '| Connection:',
      isSlowConnection() ? 'Slow' : 'Fast',
    )
    if (abortController) {
      log('⚠️ Aborting previous fetch')
      abortController.abort()
    }
    cleanup()
    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Initializing...'
    error.value = null
    abortController = new AbortController()
    try {
      if (range === TIME_RANGES.LAST_7) {
        fetchLast7()
      } else {
        await fetchHistorical(range)
      }
    } catch (err) {
      log('Error in fetchData:', err)
      error.value = err.message
      if (isMounted) {
        chartData.value = {
          labels: [],
          temperature: [],
          humidity: [],
          rainfall: [],
          rainfallTotals: [],
        }
        dataAvailabilityInfo.value = 'Error loading data.'
        isLoading.value = false
      }
    }
    log('==========================================\n')
  }

  const cleanup = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
      log('✓ Cleared retry timeout')
    }
    if (firebaseListener) {
      const { ref: oldRef, callback } = firebaseListener
      off(oldRef, 'value', callback)
      firebaseListener = null
      log('✓ Cleaned up Firebase listener')
    }
    if (abortController) abortController = null
    retryCount = 0
  }

  onUnmounted(() => {
    log('Component unmounting...')
    isMounted = false
    cleanup()
  })

  return {
    isLoading,
    loadingProgress,
    loadingMessage,
    dataAvailabilityInfo,
    error,
    chartData,
    fetchData,
    cleanup,
    TIME_RANGES,
  }
}
