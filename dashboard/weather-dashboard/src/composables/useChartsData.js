// src/composables/useChartsData.js - Optimized Hybrid Version
import { ref } from 'vue'
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

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const isSlowConnection = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (connection) {
    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.effectiveType === '3g' ||
      connection.saveData === true
    )
  }
  return isMobile()
}

export function useChartsData() {
  const isLoading = ref(true)
  const loadingProgress = ref(0)
  const loadingMessage = ref('')
  const dataAvailabilityInfo = ref('')
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

  const getRecordLimit = (range) => {
    const slow = isSlowConnection()
    const mobile = isMobile()

    if (slow) {
      return (
        {
          [TIME_RANGES.LAST_7]: 500,
          [TIME_RANGES.WEEKLY]: 5000,
          [TIME_RANGES.MONTHLY]: 10000,
          [TIME_RANGES.YEARLY]: 15000,
        }[range] || 10000
      )
    }

    if (mobile) {
      return (
        {
          [TIME_RANGES.LAST_7]: 1000,
          [TIME_RANGES.WEEKLY]: 8000,
          [TIME_RANGES.MONTHLY]: 20000,
          [TIME_RANGES.YEARLY]: 30000,
        }[range] || 15000
      )
    }

    return (
      {
        [TIME_RANGES.LAST_7]: 2000,
        [TIME_RANGES.WEEKLY]: 15000,
        [TIME_RANGES.MONTHLY]: 40000,
        [TIME_RANGES.YEARLY]: 60000,
      }[range] || 30000
    )
  }

  const getSamplingRate = (totalDays, timeRange) => {
    if (timeRange === TIME_RANGES.LAST_7) {
      return 1 // No sampling for last 7 days
    }

    const mobile = isMobile()
    const slow = isSlowConnection()

    if (slow) {
      if (totalDays > 180) return 60
      if (totalDays > 60) return 30
      if (totalDays > 30) return 20
      return 10
    }

    if (mobile) {
      if (totalDays > 365) return 60
      if (totalDays > 180) return 30
      if (totalDays > 60) return 15
      if (totalDays > 30) return 10
      return 5
    }

    if (totalDays > 180) return 30
    if (totalDays > 60) return 15
    if (totalDays > 30) return 10
    if (totalDays > 14) return 5
    return 2
  }

  const getTimeRangeBounds = (range) => {
    const now = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000

    const mobile = isMobile()
    const slow = isSlowConnection()

    if (slow || mobile) {
      log('Using reduced time ranges for mobile/slow connection')
      return {
        [TIME_RANGES.LAST_7]: { start: now - 7 * DAY_MS, end: now, label: '7 days', days: 7 },
        [TIME_RANGES.WEEKLY]: { start: now - 4 * 7 * DAY_MS, end: now, label: '4 weeks', days: 28 },
        [TIME_RANGES.MONTHLY]: {
          start: now - 180 * DAY_MS,
          end: now,
          label: '6 months',
          days: 180,
        },
        [TIME_RANGES.YEARLY]: {
          start: now - 2 * 365 * DAY_MS,
          end: now,
          label: '2 years',
          days: 730,
        },
      }[range]
    }

    return {
      [TIME_RANGES.LAST_7]: { start: now - 7 * DAY_MS, end: now, label: '7 days', days: 7 },
      [TIME_RANGES.WEEKLY]: { start: now - 8 * 7 * DAY_MS, end: now, label: '8 weeks', days: 56 },
      [TIME_RANGES.MONTHLY]: { start: now - 365 * DAY_MS, end: now, label: '12 months', days: 365 },
      [TIME_RANGES.YEARLY]: {
        start: now - 5 * 365 * DAY_MS,
        end: now,
        label: '5 years',
        days: 1825,
      },
    }[range]
  }

  const fetchWithFallback = async (range) => {
    const limit = getRecordLimit(range)
    const bounds = getTimeRangeBounds(range)

    log(`⚡ Fetching last ${limit} records from dashboard`)
    loadingMessage.value = `Loading ${bounds.label}...`
    loadingProgress.value = 20

    try {
      const historyRef = dbRef(rtdb, 'sensor_logs_dashboard')
      const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(limit))

      loadingProgress.value = 40
      const snapshot = await get(historyQuery)
      loadingProgress.value = 70

      if (!snapshot.exists()) {
        log('No data in database')
        return []
      }

      const allRecords = Object.values(snapshot.val())
      log(`Fetched ${allRecords.length} records`)

      // Filter to time range
      const filtered = allRecords.filter(
        (r) => r.timestamp >= bounds.start && r.timestamp <= bounds.end,
      )

      log(`Filtered to ${filtered.length} records in range`)
      loadingProgress.value = 90

      return filtered
    } catch (error) {
      log('Fallback fetch error:', error)
      throw error
    }
  }

  const processRecords = (records, range) => {
    log(`Processing ${records.length} records for ${range}`)

    if (!records || records.length === 0) {
      return {
        labels: [],
        temperature: [],
        humidity: [],
        rainfall: [],
        rainfallTotals: [],
      }
    }

    // Sort by timestamp
    records.sort((a, b) => a.timestamp - b.timestamp)

    if (range === TIME_RANGES.LAST_7) {
      return processLast7(records)
    }

    const bounds = getTimeRangeBounds(range)
    const samplingRate = getSamplingRate(bounds.days, range)

    const sampled =
      samplingRate > 1 ? records.filter((_, idx) => idx % samplingRate === 0) : records

    if (samplingRate > 1) {
      log(`Sampled ${records.length} → ${sampled.length} records (rate: ${samplingRate})`)
    }

    return processAggregated(sampled, range)
  }

  const processLast7 = (records) => {
    return {
      labels: records.map((r) => formatTimestamp(new Date(r.timestamp), TIME_RANGES.LAST_7)),
      temperature: records.map((r) => Number(r.temperature) || 0),
      humidity: records.map((r) => Number(r.humidity) || 0),
      rainfall: records.map((r) => Number(r.rainRateEstimated_mm_hr_bucket) || 0),
      rainfallTotals: records.map((r) => Number(r.rainfall_total_estimated_mm_bucket) || 0),
    }
  }

  const processAggregated = (records, range) => {
    const grouped = {}

    records.forEach((record) => {
      const date = new Date(record.timestamp)
      const key = getGroupKey(date, range)

      if (!grouped[key]) {
        grouped[key] = {
          timestamp: date,
          temps: [],
          hums: [],
          rains: [],
          rainTotals: [],
        }
      }

      const temp = Number(record.temperature)
      const hum = Number(record.humidity)
      const rain = Number(record.rainRateEstimated_mm_hr_bucket)
      const rainTotal = Number(record.rainfall_total_estimated_mm_bucket)

      if (!isNaN(temp)) grouped[key].temps.push(temp)
      if (!isNaN(hum)) grouped[key].hums.push(hum)
      if (!isNaN(rain)) grouped[key].rains.push(rain)
      if (!isNaN(rainTotal)) grouped[key].rainTotals.push(rainTotal)
    })

    const sorted = Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp)

    return {
      labels: sorted.map((g) => formatTimestamp(g.timestamp, range)),
      temperature: sorted.map((g) =>
        g.temps.length ? g.temps.reduce((a, b) => a + b) / g.temps.length : 0,
      ),
      humidity: sorted.map((g) =>
        g.hums.length ? g.hums.reduce((a, b) => a + b) / g.hums.length : 0,
      ),
      rainfall: sorted.map((g) =>
        g.rains.length ? g.rains.reduce((a, b) => a + b) / g.rains.length : 0,
      ),
      rainfallTotals: sorted.map((g) => (g.rainTotals.length ? Math.max(...g.rainTotals) : 0)),
    }
  }

  const getGroupKey = (date, range) => {
    if (range === TIME_RANGES.WEEKLY) {
      return `${date.getFullYear()}-W${getWeekNumber(date)}`
    }
    if (range === TIME_RANGES.MONTHLY) {
      return `${date.getFullYear()}-${date.getMonth()}`
    }
    if (range === TIME_RANGES.YEARLY) {
      return `${date.getFullYear()}`
    }
    return date.toISOString()
  }

  const formatTimestamp = (date, range) => {
    const pht = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))

    if (range === TIME_RANGES.LAST_7) {
      return pht.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    }
    if (range === TIME_RANGES.WEEKLY) {
      return `Week ${getWeekNumber(pht)}, ${pht.getFullYear()}`
    }
    if (range === TIME_RANGES.MONTHLY) {
      return pht.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        year: 'numeric',
      })
    }
    return pht.getFullYear().toString()
  }

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  }

  const updateAvailabilityInfo = (records, range) => {
    if (!records || records.length === 0) {
      dataAvailabilityInfo.value = 'No data available for this time range'
      return
    }

    const oldestTs = Math.min(...records.map((r) => r.timestamp))
    const newestTs = Math.max(...records.map((r) => r.timestamp))
    const spanDays = Math.floor((newestTs - oldestTs) / (24 * 60 * 60 * 1000))

    if (spanDays === 0) {
      dataAvailabilityInfo.value = `${records.length} readings (today)`
    } else if (spanDays === 1) {
      dataAvailabilityInfo.value = `${records.length} readings (yesterday & today)`
    } else {
      dataAvailabilityInfo.value = `${records.length} readings (${spanDays} day span)`
    }

    const bounds = getTimeRangeBounds(range)
    if (bounds && range !== TIME_RANGES.LAST_7) {
      dataAvailabilityInfo.value += ` • ${bounds.label} range`
    }

    if (range === TIME_RANGES.LAST_7) {
      dataAvailabilityInfo.value += ' • real-time'
    } else {
      dataAvailabilityInfo.value += ' • optimized'
    }
  }

  // Real-time listener for Last 7 Days (uses onValue for live updates)
  const fetchLast7 = () => {
    log('Setting up real-time listener for Last 7 Days')
    loadingMessage.value = 'Connecting to live data...'

    const limit = getRecordLimit(TIME_RANGES.LAST_7)
    const historyRef = dbRef(rtdb, 'sensor_logs_dashboard')
    const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(limit))

    const callback = (snapshot) => {
      if (!isMounted) {
        log('Component unmounted, ignoring callback')
        return
      }

      log('📡 Real-time update received')

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
        const bounds = getTimeRangeBounds(TIME_RANGES.LAST_7)

        // Filter to last 7 days
        const filtered = records.filter(
          (r) => r.timestamp >= bounds.start && r.timestamp <= bounds.end,
        )

        chartData.value = processRecords(filtered, TIME_RANGES.LAST_7)
        updateAvailabilityInfo(filtered, TIME_RANGES.LAST_7)
      }

      isLoading.value = false
      loadingProgress.value = 0
      loadingMessage.value = ''
    }

    firebaseListener = { ref: historyRef, callback }

    onValue(historyQuery, callback, (err) => {
      log('Firebase error:', err)
      if (isMounted) {
        isLoading.value = false
        dataAvailabilityInfo.value = 'Connection error. Retrying...'
      }
    })
  }

  // One-time fetch for historical data (weekly, monthly, yearly)
  const fetchHistorical = async (range) => {
    log(`Fetching historical data: ${range}`)

    try {
      const records = await fetchWithFallback(range)

      if (abortController?.signal.aborted || !isMounted) {
        log('Fetch aborted or unmounted')
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

  // Main fetch function
  const fetchData = async (range = TIME_RANGES.LAST_7) => {
    log(`\n========== Fetching Chart Data: ${range} ==========`)
    log(
      'Device:',
      isMobile() ? 'Mobile' : 'Desktop',
      '| Connection:',
      isSlowConnection() ? 'Slow' : 'Fast',
    )

    // Cleanup any existing listeners/operations
    cleanup()

    // Reset state
    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Initializing...'

    // Create new abort controller for this operation
    abortController = new AbortController()

    try {
      if (range === TIME_RANGES.LAST_7) {
        // Use real-time listener
        fetchLast7()
      } else {
        // Use one-time fetch
        await fetchHistorical(range)
      }
    } catch (err) {
      log('Error in fetchData:', err)
      if (isMounted) {
        chartData.value = {
          labels: [],
          temperature: [],
          humidity: [],
          rainfall: [],
          rainfallTotals: [],
        }
        dataAvailabilityInfo.value = 'Error loading data. Please try again.'
        isLoading.value = false
      }
    }

    log('========================================\n')
  }

  // Cleanup function
  const cleanup = () => {
    if (firebaseListener) {
      const { ref: oldRef, callback } = firebaseListener
      off(oldRef, 'value', callback)
      firebaseListener = null
      log('✓ Cleaned up Firebase listener')
    }

    if (abortController) {
      abortController.abort()
      abortController = null
      log('✓ Aborted pending operations')
    }
  }

  // Unmount handler
  const onUnmount = () => {
    log('Component unmounting...')
    isMounted = false
    cleanup()
  }

  return {
    // State
    isLoading,
    loadingProgress,
    loadingMessage,
    dataAvailabilityInfo,
    chartData,

    // Methods
    fetchData,
    cleanup,
    onUnmount,

    // Constants
    TIME_RANGES,
  }
}
