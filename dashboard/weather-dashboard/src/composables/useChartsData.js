// src/composables/useChartsData.js - FINAL CAPSTONE VERSION
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

  // Record limits for 1-minute interval data
  const getRecordLimit = (range) => {
    if (range === TIME_RANGES.LAST_7) return 7

    const slow = isSlowConnection()
    const mobile = isMobile()

    if (slow) {
      return (
        {
          [TIME_RANGES.WEEKLY]: 5000,
          [TIME_RANGES.MONTHLY]: 10000,
          [TIME_RANGES.YEARLY]: 15000,
        }[range] || 10000
      )
    }

    if (mobile) {
      return (
        {
          [TIME_RANGES.WEEKLY]: 8000,
          [TIME_RANGES.MONTHLY]: 20000,
          [TIME_RANGES.YEARLY]: 30000,
        }[range] || 15000
      )
    }

    return (
      {
        [TIME_RANGES.WEEKLY]: 15000,
        [TIME_RANGES.MONTHLY]: 40000,
        [TIME_RANGES.YEARLY]: 60000,
      }[range] || 30000
    )
  }

  const getSamplingRate = (totalDays, timeRange) => {
    if (timeRange === TIME_RANGES.LAST_7) return 1

    const slow = isSlowConnection()
    const mobile = isMobile()

    if (slow) {
      if (totalDays > 365) return 60
      if (totalDays > 180) return 30
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

    if (totalDays > 365) return 30
    if (totalDays > 180) return 15
    if (totalDays > 60) return 10
    if (totalDays > 30) return 5
    return 2
  }

  const getTimeRangeBounds = (range) => {
    const now = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000

    return (
      {
        [TIME_RANGES.LAST_7]: { start: 0, end: now, label: 'Last 7 Readings', days: 0 },
        [TIME_RANGES.WEEKLY]: {
          start: now - 28 * DAY_MS,
          end: now,
          label: 'Last 4 Weeks',
          days: 28,
        },
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
      }[range] || { start: now - 7 * DAY_MS, end: now, label: 'Last 7 Days', days: 7 }
    )
  }

  const fetchWithFallback = async (range) => {
    const limit = getRecordLimit(range)
    const bounds = getTimeRangeBounds(range)

    log(`⚡ Fetching last ${limit} records for ${bounds.label}`)
    loadingMessage.value = `Loading ${bounds.label}...`
    loadingProgress.value = 20

    try {
      // Use dashboard database (fast, limited to 10k records)
      const historyRef = dbRef(rtdb, 'sensor_logs_dashboard')
      const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(limit))

      loadingProgress.value = 40
      const snapshot = await get(historyQuery)
      loadingProgress.value = 70

      if (!snapshot.exists()) {
        log('⚠️ No data in dashboard - checking main database...')

        // Fallback to main database if dashboard is empty
        const mainRef = dbRef(rtdb, 'sensor_logs')
        const mainQuery = query(mainRef, orderByChild('timestamp'), limitToLast(limit))
        const mainSnapshot = await get(mainQuery)

        if (!mainSnapshot.exists()) {
          log('❌ No data in any database')
          return []
        }

        log('✅ Found data in main database')
        const allRecords = Object.values(mainSnapshot.val())
        const filtered = allRecords.filter(
          (r) => r.timestamp >= bounds.start && r.timestamp <= bounds.end,
        )
        log(`Main DB: Fetched ${allRecords.length} → Filtered ${filtered.length}`)
        loadingProgress.value = 90
        return filtered
      }

      const allRecords = Object.values(snapshot.val())
      log(`Dashboard: Fetched ${allRecords.length} records`)

      const filtered = allRecords.filter(
        (r) => r.timestamp >= bounds.start && r.timestamp <= bounds.end,
      )
      log(`Filtered to ${filtered.length} records in range`)
      loadingProgress.value = 90

      return filtered
    } catch (error) {
      log('❌ Fetch error:', error)
      throw error
    }
  }

  const processRecords = (records, range) => {
    if (!records || records.length === 0) {
      return { labels: [], temperature: [], humidity: [], rainfall: [], rainfallTotals: [] }
    }

    records.sort((a, b) => a.timestamp - b.timestamp)

    if (range === TIME_RANGES.LAST_7) {
      return processLast7(records)
    }

    const bounds = getTimeRangeBounds(range)
    const samplingRate = getSamplingRate(bounds.days, range)
    const sampled =
      samplingRate > 1 ? records.filter((_, idx) => idx % samplingRate === 0) : records

    if (samplingRate > 1) {
      log(`Sampled ${records.length} → ${sampled.length} (rate: ${samplingRate})`)
    }

    return processAggregated(sampled, range)
  }

  const processLast7 = (records) => ({
    labels: records.map((r) => formatTimestamp(new Date(r.timestamp), TIME_RANGES.LAST_7)),
    temperature: records.map((r) => Number(r.temperature) || 0),
    humidity: records.map((r) => Number(r.humidity) || 0),
    rainfall: records.map((r) => Number(r.rainRateEstimated_mm_hr_bucket) || 0),
    rainfallTotals: records.map((r) => Number(r.rainfall_total_estimated_mm_bucket) || 0),
  })

  const processAggregated = (records, range) => {
    const grouped = {}

    records.forEach((record) => {
      const date = new Date(record.timestamp)
      const key = getGroupKey(date, range)

      if (!grouped[key]) {
        grouped[key] = { timestamp: date, temps: [], hums: [], rains: [], rainTotals: [] }
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
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
    if (range === TIME_RANGES.MONTHLY) {
      return `${date.getFullYear()}-W${getWeekNumber(date)}`
    }
    if (range === TIME_RANGES.YEARLY) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
      return pht.toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    }
    if (range === TIME_RANGES.MONTHLY) {
      return `Week ${getWeekNumber(pht)}, ${pht.getFullYear()}`
    }
    if (range === TIME_RANGES.YEARLY) {
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

    const historyRef = dbRef(rtdb, 'sensor_logs_dashboard')
    const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(7))

    const callback = (snapshot) => {
      if (!isMounted) return

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
        log(`Received ${records.length} records`)
        chartData.value = processRecords(records, TIME_RANGES.LAST_7)
        updateAvailabilityInfo(records, TIME_RANGES.LAST_7)
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

  const fetchHistorical = async (range) => {
    log(`Fetching historical data: ${range}`)

    try {
      const records = await fetchWithFallback(range)

      if (abortController?.signal.aborted || !isMounted) return

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

  const fetchData = async (range = TIME_RANGES.LAST_7) => {
    log(`\n========== Fetching: ${range} ==========`)
    log(
      'Device:',
      isMobile() ? 'Mobile' : 'Desktop',
      '| Connection:',
      isSlowConnection() ? 'Slow' : 'Fast',
    )

    cleanup()

    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Initializing...'
    abortController = new AbortController()

    try {
      if (range === TIME_RANGES.LAST_7) {
        fetchLast7()
      } else {
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
        dataAvailabilityInfo.value = 'Error loading data.'
        isLoading.value = false
      }
    }

    log('==========================================\n')
  }

  const cleanup = () => {
    if (firebaseListener) {
      const { ref: oldRef, callback } = firebaseListener
      off(oldRef, 'value', callback)
      firebaseListener = null
      log('✓ Cleaned up listener')
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const onUnmount = () => {
    isMounted = false
    cleanup()
  }

  return {
    isLoading,
    loadingProgress,
    loadingMessage,
    dataAvailabilityInfo,
    chartData,
    fetchData,
    cleanup,
    onUnmount,
    TIME_RANGES,
  }
}
