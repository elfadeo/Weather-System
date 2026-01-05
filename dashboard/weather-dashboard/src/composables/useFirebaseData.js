import { ref } from 'vue'
import { getDatabase, ref as dbRef, query, orderByChild, startAt, endAt, get, off } from 'firebase/database'

// Global state to survive component reloads
const rawReportData = ref([])
const isLoading = ref(false)
const loadingProgress = ref(0)
const loadingMessage = ref('')
const activeListener = ref(null)

export function useFirebaseData() {
  const db = getDatabase()

  const cleanup = () => {
    if (activeListener.value) {
      off(activeListener.value)
      activeListener.value = null
    }
  }

  const fetchData = async (startDate, endDate) => {
    cleanup()

    isLoading.value = true
    loadingProgress.value = 10
    rawReportData.value = []

    try {
      const startTs = new Date(startDate).getTime()
      const endTs = new Date(endDate).getTime()

      // Calculate duration in hours
      const durationHours = (endTs - startTs) / (1000 * 60 * 60)

      // ⚡ FORCE SWITCH:
      // If asking for > 48 hours, ALWAYS use 'sensor_logs_hourly'
      // If asking for < 48 hours, use 'sensor_logs'
      const useOptimizedData = durationHours > 48
      const collectionName = useOptimizedData ? 'sensor_logs_hourly' : 'sensor_logs'

      loadingMessage.value = useOptimizedData
        ? '⚡ Fetching optimized history...'
        : '📥 Fetching high-detail data...'

      console.log(`Fetching from: ${collectionName} (Range: ${durationHours.toFixed(1)}h)`)

      const dataRef = dbRef(db, collectionName)
      const dataQuery = query(
        dataRef,
        orderByChild('timestamp'),
        startAt(startTs),
        endAt(endTs)
      )

      // Use get() for one-time fetch (Faster for large datasets)
      const snapshot = await get(dataQuery)

      loadingProgress.value = 80
      loadingMessage.value = 'Processing...'

      if (snapshot.exists()) {
        const data = []
        snapshot.forEach((child) => {
          const val = child.val()
          // Tag the data so the Chart knows how to handle it
          val.aggregation_type = useOptimizedData ? 'hourly' : 'raw'
          data.push(val)
        })
        rawReportData.value = data
        console.log(`✅ Loaded ${data.length} records`)
      } else {
        console.log("⚠️ No data found in this range.")
        rawReportData.value = []
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      loadingMessage.value = 'Error loading data'
    } finally {
      loadingProgress.value = 100
      isLoading.value = false
    }
  }

  return {
    rawReportData,
    isLoading,
    loadingProgress,
    loadingMessage,
    fetchData,
    cleanup
  }
}
