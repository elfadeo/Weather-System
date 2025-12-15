import { ref } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, endAt, onValue, get } from 'firebase/database'

export function useFirebaseData() {
  const rawReportData = ref([])
  const isLoading = ref(false)

  let unsubscribe = null
  let fetchTimeout = null

  const fetchData = (startDateTimeValue, endDateTimeValue) => {
    // Clear any pending fetch
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
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

  const performFetch = (startTs, endTs) => {
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
          rawReportData.value = snapshot.val() ? Object.values(snapshot.val()) : []
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
          rawReportData.value = snapshot.val() ? Object.values(snapshot.val()) : []
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

  const cleanup = () => {
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
  }

  return {
    rawReportData,
    isLoading,
    fetchData,
    cleanup,
  }
}
