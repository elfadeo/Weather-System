import { ref } from 'vue'
import { rtdb } from '@/firebase.js'
import { query, ref as dbRef, orderByChild, get, startAt } from 'firebase/database'

export function useHistoricalData() {
  const historicalSummary = ref(null)
  const error = ref(null)

  const fetchHistoricalData = async () => {
    try {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      const historicalQuery = query(
        dbRef(rtdb, 'sensor_logs'),
        orderByChild('timestamp'),
        startAt(oneDayAgo),
      )
      const historicalSnapshot = await get(historicalQuery)

      let totalRainfall24h = 0
      let avgTemp = 0
      let avgHumidity = 0
      let count = 0

      if (historicalSnapshot.exists()) {
        const logs = Object.values(historicalSnapshot.val())

        const rainfallTotals = logs
          .map((log) => log.rainfall_total_estimated_mm_bucket)
          .filter((val) => val != null)

        if (rainfallTotals.length > 0) {
          const sortedTotals = rainfallTotals.sort((a, b) => a - b)
          totalRainfall24h = sortedTotals[sortedTotals.length - 1] - sortedTotals[0]
        }

        logs.forEach((log) => {
          if (log.temperature != null) {
            avgTemp += log.temperature
            count++
          }
          if (log.humidity != null) {
            avgHumidity += log.humidity
          }
        })

        if (count > 0) {
          avgTemp /= count
          avgHumidity /= count
        }
      }

      historicalSummary.value = {
        totalRainfall24h,
        avgTemp24h: avgTemp,
        avgHumidity24h: avgHumidity,
      }

      return historicalSummary.value
    } catch (err) {
      console.error('Error fetching historical data:', err)
      error.value = 'Could not fetch historical data for analysis.'
      return null
    }
  }

  return {
    historicalSummary,
    error,
    fetchHistoricalData,
  }
}
