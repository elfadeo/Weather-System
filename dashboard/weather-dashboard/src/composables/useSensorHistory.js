import { ref } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, get } from 'firebase/database'

export function useSensorHistory() {
  const historicalSummary = ref(null)
  const isLoadingHistory = ref(false)
  const errorHistory = ref(null)

  const fetchHistoricalData = async () => {
    // Reset state before fetching
    isLoadingHistory.value = true
    errorHistory.value = null
    historicalSummary.value = null // Optional: Clear old data while loading

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000

    try {
      // Query: Get all logs from the last 24 hours
      // NOTE: Ensure your Firebase Rules index 'timestamp' for this to work efficiently
      const logsRef = dbRef(rtdb, 'sensor_logs')
      const logsQuery = query(logsRef, orderByChild('timestamp'), startAt(twentyFourHoursAgo))

      const snapshot = await get(logsQuery)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const logs = Object.values(data)

        // Calculate Averages
        let totalTemp = 0
        let totalHum = 0
        let count = 0

        logs.forEach((log) => {
          // Check if data exists and is valid number
          if (log.temperature && log.humidity) {
            totalTemp += parseFloat(log.temperature)
            totalHum += parseFloat(log.humidity)
            count++
          }
        })

        if (count > 0) {
          historicalSummary.value = {
            avgTemp24h: totalTemp / count,
            avgHumidity24h: totalHum / count,
            logCount: count,
          }
        }
      } else {
        console.log('No historical data found for the last 24h.')
        historicalSummary.value = null
      }
    } catch (err) {
      console.error('Failed to fetch historical sensor data:', err)
      errorHistory.value = 'Could not load history.'
    } finally {
      isLoadingHistory.value = false
    }
  }

  return {
    historicalSummary,
    isLoadingHistory,
    fetchHistoricalData,
  }
}
