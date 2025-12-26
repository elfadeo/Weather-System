import { ref } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, endAt, get } from 'firebase/database'

export function useFirebaseData() {
  const rawReportData = ref([])
  const isLoading = ref(false)
  const loadingProgress = ref(0) // Progress percentage (0-100)
  const loadingMessage = ref('') // Status message

  let fetchTimeout = null
  let abortController = null

  const fetchData = (startDateTimeValue, endDateTimeValue) => {
    // Clear any pending fetch
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
    }

    // Abort any ongoing fetch
    if (abortController) {
      abortController.abort()
    }

    // Validate input
    if (!startDateTimeValue || !endDateTimeValue) {
      rawReportData.value = []
      return
    }

    const startTs = new Date(startDateTimeValue).getTime()
    const endTs = new Date(endDateTimeValue).getTime()

    if (Number.isNaN(startTs) || Number.isNaN(endTs) || startTs > endTs) {
      rawReportData.value = []
      return
    }

    // Debounce: Wait 300ms before actually fetching
    fetchTimeout = setTimeout(() => {
      performFetch(startTs, endTs)
    }, 300)
  }

  const performFetch = async (startTs, endTs) => {
    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Preparing query...'

    // Create new abort controller
    abortController = new AbortController()
    const { signal } = abortController

    try {
      const timeDiff = endTs - startTs
      const daysInRange = timeDiff / (24 * 60 * 60 * 1000)

      // For ranges > 7 days, use chunked loading
      if (daysInRange > 7) {
        await fetchInChunks(startTs, endTs, signal)
      } else {
        await fetchDirect(startTs, endTs, signal)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching report data:', error)
        rawReportData.value = []
      }
    } finally {
      isLoading.value = false
      loadingProgress.value = 0
      loadingMessage.value = ''
    }
  }

  /**
   * Fetch data directly for small ranges (< 7 days)
   */
  const fetchDirect = async (startTs, endTs, signal) => {
    loadingMessage.value = 'Loading data...'

    const sensorLogsRef = query(
      dbRef(rtdb, 'sensor_logs'),
      orderByChild('timestamp'),
      startAt(startTs),
      endAt(endTs),
    )

    const snapshot = await get(sensorLogsRef)

    if (signal.aborted) return

    loadingProgress.value = 50
    loadingMessage.value = 'Processing data...'

    rawReportData.value = snapshot.val() ? Object.values(snapshot.val()) : []
    loadingProgress.value = 100
  }

  /**
   * Fetch data in chunks for large ranges (> 7 days)
   * This prevents memory issues and provides progress feedback
   */
  const fetchInChunks = async (startTs, endTs, signal) => {
    const CHUNK_SIZE_DAYS = 3 // Fetch 3 days at a time
    const CHUNK_SIZE_MS = CHUNK_SIZE_DAYS * 24 * 60 * 60 * 1000

    const chunks = []
    let currentStart = startTs

    // Calculate all chunks
    while (currentStart < endTs) {
      const currentEnd = Math.min(currentStart + CHUNK_SIZE_MS, endTs)
      chunks.push({ start: currentStart, end: currentEnd })
      currentStart = currentEnd
    }

    loadingMessage.value = `Loading ${chunks.length} data chunks...`

    const allData = []
    const totalChunks = chunks.length

    // Fetch chunks sequentially with progress updates
    for (let i = 0; i < chunks.length; i++) {
      if (signal.aborted) return

      const chunk = chunks[i]
      loadingMessage.value = `Loading chunk ${i + 1} of ${totalChunks}...`
      loadingProgress.value = Math.round(((i + 1) / totalChunks) * 90) // Reserve 10% for processing

      const sensorLogsRef = query(
        dbRef(rtdb, 'sensor_logs'),
        orderByChild('timestamp'),
        startAt(chunk.start),
        endAt(chunk.end),
      )

      const snapshot = await get(sensorLogsRef)

      if (signal.aborted) return

      if (snapshot.val()) {
        const chunkData = Object.values(snapshot.val())
        allData.push(...chunkData)
      }

      // Small delay to prevent overwhelming the database
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    if (signal.aborted) return

    loadingMessage.value = 'Processing data...'
    loadingProgress.value = 95

    // Remove duplicates based on timestamp (in case of overlap)
    const uniqueData = Array.from(new Map(allData.map((item) => [item.timestamp, item])).values())

    rawReportData.value = uniqueData
    loadingProgress.value = 100
  }

  const cleanup = () => {
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
    }
    if (abortController) {
      abortController.abort()
    }
  }

  return {
    rawReportData,
    isLoading,
    loadingProgress,
    loadingMessage,
    fetchData,
    cleanup,
  }
}
