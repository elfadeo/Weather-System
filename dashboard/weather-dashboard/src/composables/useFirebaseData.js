import { ref, shallowRef } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, endAt, get } from 'firebase/database'

// GLOBAL CACHE: Defined outside to survive component unmounts
// Stores 1-day blocks of raw sensor data
const chunkCache = new Map()

export function useFirebaseData() {
  const rawReportData = shallowRef([])
  const isLoading = ref(false)
  const loadingProgress = ref(0)
  const loadingMessage = ref('')
  const samplingRate = ref('1min')
  const recordCount = ref(0)

  let fetchTimeout = null
  let abortController = null

  const fetchData = (startDateTimeValue, endDateTimeValue) => {
    if (fetchTimeout) clearTimeout(fetchTimeout)
    if (abortController) abortController.abort()

    if (!startDateTimeValue || !endDateTimeValue) {
      rawReportData.value = []
      recordCount.value = 0
      return
    }

    const startTs = new Date(startDateTimeValue).getTime()
    const endTs = new Date(endDateTimeValue).getTime()

    // Validation
    if (Number.isNaN(startTs) || Number.isNaN(endTs) || startTs > endTs) {
      console.warn('Invalid date range')
      rawReportData.value = []
      recordCount.value = 0
      return
    }

    // Debounce: Wait 300ms before fetching
    fetchTimeout = setTimeout(() => {
      performFetch(startTs, endTs)
    }, 300)
  }

  const performFetch = async (startTs, endTs) => {
    const fetchStart = performance.now()
    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Preparing query...'

    abortController = new AbortController()
    const { signal } = abortController

    try {
      const timeDiff = endTs - startTs
      const daysInRange = timeDiff / (24 * 60 * 60 * 1000)
      const daysFromNow = (Date.now() - startTs) / (24 * 60 * 60 * 1000)

      console.log(`📊 Query: ${daysInRange.toFixed(1)} days, ${daysFromNow.toFixed(0)} days old`)

      // ═══════════════════════════════════════════════════════════════════════
      // STRATEGY 1: Try Daily Aggregates (for old data > 60 days)
      // ═══════════════════════════════════════════════════════════════════════
      if (daysFromNow > 60) {
        loadingMessage.value = 'Loading historical daily summaries...'
        const success = await fetchDailyData(startTs, endTs, signal)
        if (success) {
          const duration = ((performance.now() - fetchStart) / 1000).toFixed(1)
          console.log(`✅ Loaded daily aggregates in ${duration}s`)
          loadingMessage.value = `Loaded ${recordCount.value.toLocaleString()} daily records`
          return
        }
        console.log('⚠️ No daily aggregates, trying hourly...')
      }

      // ═══════════════════════════════════════════════════════════════════════
      // STRATEGY 2: Try Hourly Aggregates (for ranges > 4 days)
      // ═══════════════════════════════════════════════════════════════════════
      if (daysInRange > 4) {
        loadingMessage.value = 'Checking for optimized hourly data...'
        const success = await fetchHourlyData(startTs, endTs, signal)
        if (success) {
          const duration = ((performance.now() - fetchStart) / 1000).toFixed(1)
          console.log(`✅ Loaded hourly data in ${duration}s`)
          loadingMessage.value = `Loaded ${recordCount.value.toLocaleString()} hourly records`
          return
        }
        console.log('⚠️ No hourly data available, falling back to raw data')
      }

      // ═══════════════════════════════════════════════════════════════════════
      // STRATEGY 3: Fetch Raw Data with Downsampling
      // ═══════════════════════════════════════════════════════════════════════
      let step = 1
      if (daysInRange > 30) {
        step = 30
        samplingRate.value = '30min'
      } else if (daysInRange > 7) {
        step = 15
        samplingRate.value = '15min'
      } else if (daysInRange > 2) {
        step = 5
        samplingRate.value = '5min'
      } else {
        step = 1
        samplingRate.value = '1min'
      }

      console.log(`📊 Using ${samplingRate.value} sampling (every ${step} records)`)
      loadingMessage.value = `Loading data (${samplingRate.value} resolution)...`

      await fetchInChunks(startTs, endTs, signal, step)

      const duration = ((performance.now() - fetchStart) / 1000).toFixed(1)
      console.log(`✅ Loaded ${recordCount.value} records in ${duration}s`)
      loadingMessage.value = `Loaded ${recordCount.value.toLocaleString()} records (${samplingRate.value})`
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error)
        rawReportData.value = []
        recordCount.value = 0
        loadingMessage.value = 'Error loading data'
      }
    } finally {
      if (!signal.aborted) {
        isLoading.value = false
        loadingProgress.value = 0
        // Keep success message visible for 2 seconds
        setTimeout(() => {
          if (loadingMessage.value.startsWith('Loaded')) {
            loadingMessage.value = ''
          }
        }, 2000)
      }
    }
  }

  /**
   * NEW: Fetch daily aggregates for very old data (> 60 days)
   * Uses sensor_logs_daily collection created by maintenance system
   */
  const fetchDailyData = async (startTs, endTs, signal) => {
    try {
      const dailyRef = query(
        dbRef(rtdb, 'sensor_logs_daily'),
        orderByChild('timestamp'),
        startAt(startTs),
        endAt(endTs),
      )

      console.time('⏱️ Daily Data Query')
      const snapshot = await get(dailyRef)
      console.timeEnd('⏱️ Daily Data Query')

      if (signal.aborted) return true

      if (snapshot.exists()) {
        const data = []
        snapshot.forEach((child) => {
          const val = child.val()
          // Transform daily aggregate to match expected format
          data.push({
            timestamp: val.timestamp,
            temperature: val.avgTemperature,
            humidity: val.avgHumidity,
            rainfall_hourly_mm: val.totalRainfall,
            // Store min/max for reference
            temp_min: val.minTemperature,
            temp_max: val.maxTemperature,
            hum_min: val.minHumidity,
            hum_max: val.maxHumidity,
            record_count: val.recordCount,
            aggregation_type: 'daily',
          })
        })

        if (data.length > 0) {
          rawReportData.value = data
          samplingRate.value = 'daily'
          recordCount.value = data.length
          loadingProgress.value = 100
          console.log(`✅ Loaded ${data.length} daily records`)
          return true
        }
      }

      console.log('⚠️ No daily data found in sensor_logs_daily')
    } catch (error) {
      console.warn('Daily data fetch failed:', error)
    }

    return false
  }

  /**
   * Fetch hourly aggregates for medium-range queries
   * Uses sensor_logs_hourly collection created by maintenance system
   */
  const fetchHourlyData = async (startTs, endTs, signal) => {
    try {
      const hourlyRef = query(
        dbRef(rtdb, 'sensor_logs_hourly'),
        orderByChild('timestamp'),
        startAt(startTs),
        endAt(endTs),
      )

      console.time('⏱️ Hourly Data Query')
      const snapshot = await get(hourlyRef)
      console.timeEnd('⏱️ Hourly Data Query')

      if (signal.aborted) return true

      if (snapshot.exists()) {
        const data = []
        snapshot.forEach((child) => {
          const val = child.val()
          // Transform hourly aggregate to match expected format
          data.push({
            timestamp: val.timestamp,
            temperature: val.avgTemperature,
            humidity: val.avgHumidity,
            rainfall_hourly_mm: val.totalRainfall,
            // Store min/max for reference
            temp_min: val.minTemperature,
            temp_max: val.maxTemperature,
            hum_min: val.minHumidity,
            hum_max: val.maxHumidity,
            record_count: val.recordCount,
            aggregation_type: 'hourly',
          })
        })

        if (data.length > 0) {
          rawReportData.value = data
          samplingRate.value = 'hourly'
          recordCount.value = data.length
          loadingProgress.value = 100
          console.log(`✅ Loaded ${data.length} hourly records`)
          return true
        }
      }

      console.log('⚠️ No hourly data found in sensor_logs_hourly')
    } catch (error) {
      console.warn('Hourly data fetch failed:', error)
    }

    return false
  }

  /**
   * Fetches raw data in 1-day chunks with caching and downsampling
   * Only used for recent data (< 60 days old)
   */
  const fetchInChunks = async (startTs, endTs, signal, step) => {
    // FIXED CHUNK SIZE: 1 DAY
    // Ensures cache keys are consistent across different queries
    const CHUNK_SIZE_MS = 24 * 60 * 60 * 1000

    // Calculate chunks
    const chunks = []
    let currentStart = startTs
    while (currentStart < endTs) {
      const currentEnd = Math.min(currentStart + CHUNK_SIZE_MS, endTs)
      chunks.push({ start: currentStart, end: currentEnd })
      currentStart = currentEnd
    }

    console.log(`📦 Processing ${chunks.length} chunks`)

    const collectedData = []
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000
    let cacheHits = 0
    let cacheMisses = 0

    for (let i = 0; i < chunks.length; i++) {
      if (signal.aborted) return

      const chunk = chunks[i]
      const chunkKey = `raw_${chunk.start}_${chunk.end}`
      let chunkData = null

      // WARN if querying data older than 60 days (should use aggregates)
      if (chunk.start < sixtyDaysAgo) {
        console.warn(
          `⚠️ Querying raw data older than 60 days - consider using date range < 60 days`,
        )
      }

      // CHECK CACHE
      if (chunkCache.has(chunkKey)) {
        chunkData = chunkCache.get(chunkKey)
        cacheHits++
        loadingMessage.value = `Loading chunk ${i + 1}/${chunks.length} (cached)`
        console.log(`✓ Cache hit for chunk ${i + 1}`)
      } else {
        // DOWNLOAD FROM FIREBASE
        cacheMisses++
        loadingMessage.value = `Downloading chunk ${i + 1}/${chunks.length}...`

        const sensorLogsRef = query(
          dbRef(rtdb, 'sensor_logs'),
          orderByChild('timestamp'),
          startAt(chunk.start),
          endAt(chunk.end),
        )

        const chunkStart = performance.now()
        const snapshot = await get(sensorLogsRef)
        const chunkTime = ((performance.now() - chunkStart) / 1000).toFixed(1)

        if (signal.aborted) return

        const raw = []
        if (snapshot.exists()) {
          snapshot.forEach((c) => raw.push(c.val()))
        }

        chunkData = raw
        console.log(`⏱️ Chunk ${i + 1}: ${raw.length} records in ${chunkTime}s`)

        // CACHE STRATEGY: Don't cache today's data (it's still being written)
        // Also don't cache data older than 60 days (it will be deleted anyway)
        if (chunk.start < todayStart && chunk.start >= sixtyDaysAgo) {
          // Limit cache size to 50 days (prevents memory issues)
          if (chunkCache.size >= 50) {
            const oldestKey = chunkCache.keys().next().value
            chunkCache.delete(oldestKey)
          }
          chunkCache.set(chunkKey, raw)
        }
      }

      // DOWNSAMPLE: Apply step interval
      if (chunkData && chunkData.length > 0) {
        for (let j = 0; j < chunkData.length; j++) {
          if (j % step === 0) {
            collectedData.push(chunkData[j])
          }
        }
      }

      // Update progress
      loadingProgress.value = Math.round(((i + 1) / chunks.length) * 95)

      // Small delay every 2 chunks to prevent UI blocking
      if (i % 2 === 0 && i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 10))
      }
    }

    if (signal.aborted) return

    loadingProgress.value = 98
    loadingMessage.value = 'Finalizing...'

    rawReportData.value = collectedData
    recordCount.value = collectedData.length
    loadingProgress.value = 100

    console.log(`📊 Cache stats: ${cacheHits} hits, ${cacheMisses} misses`)
  }

  const cleanup = () => {
    if (fetchTimeout) clearTimeout(fetchTimeout)
    if (abortController) abortController.abort()
  }

  const clearCache = () => {
    const size = chunkCache.size
    chunkCache.clear()
    console.log(`🗑️ Cache cleared (${size} chunks removed)`)
  }

  /**
   * NEW: Get data source recommendation for a date range
   * Helps users understand what data quality to expect
   */
  const getDataSourceInfo = (startDateTimeValue, endDateTimeValue) => {
    if (!startDateTimeValue || !endDateTimeValue) return null

    const startTs = new Date(startDateTimeValue).getTime()
    const endTs = new Date(endDateTimeValue).getTime()
    const daysFromNow = (Date.now() - startTs) / (24 * 60 * 60 * 1000)
    const daysInRange = (endTs - startTs) / (24 * 60 * 60 * 1000)

    let source, resolution, description, warning

    if (daysFromNow > 60) {
      if (daysInRange > 4) {
        source = 'daily'
        resolution = '1 day'
        description = 'Historical daily summaries (fast, compact)'
      } else {
        source = 'hourly'
        resolution = '1 hour'
        description = 'Historical hourly summaries (medium detail)'
      }
      warning = 'Raw minute-by-minute data is only kept for 60 days'
    } else if (daysInRange > 4) {
      source = 'hourly'
      resolution = '1 hour'
      description = 'Hourly aggregates (fast, medium detail)'
    } else {
      source = 'raw'
      if (daysInRange > 7) {
        resolution = '15 min'
      } else if (daysInRange > 2) {
        resolution = '5 min'
      } else {
        resolution = '1 min'
      }
      description = 'Raw sensor data (high detail, slower)'
    }

    return { source, resolution, description, warning }
  }

  return {
    rawReportData,
    isLoading,
    loadingProgress,
    loadingMessage,
    samplingRate,
    recordCount,
    fetchData,
    cleanup,
    clearCache,
    getDataSourceInfo,
  }
}
