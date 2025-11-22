// src/composables/useWeatherData.js
import { ref, readonly } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, limitToLast, onValue } from 'firebase/database'

// --- Module-level state ---
const latestData = ref(null)
const summaryData = ref(null) // This will now hold the pre-calculated summary
const isLoading = ref(true)
const isSummaryLoading = ref(true)
const error = ref(null)

// --- Realtime Database Connection (for LIVE data) ---
const connectRTDB = () => {
  console.log('Establishing connection to Realtime Database for live data...')
  try {
    const sensorLogsQuery = query(
      dbRef(rtdb, 'sensor_logs'),
      orderByChild('timestamp'),
      limitToLast(1)
    )

    onValue(sensorLogsQuery, (snapshot) => {
      if (snapshot.exists()) {
        latestData.value = Object.values(snapshot.val())[0]
      } else {
        error.value = 'No live sensor data available.'
      }
      isLoading.value = false
    }, (err) => {
      console.error('Realtime Database connection error:', err)
      error.value = 'Failed to connect to the live data source.'
      isLoading.value = false
    })
  } catch (err) {
    console.error('Critical error setting up RTDB listener:', err)
    error.value = 'An unexpected RTDB error occurred.'
    isLoading.value = false
  }
}

// --- Realtime Database Connection (for PRE-CALCULATED summary) ---
const connectSummaryDB = () => {
  console.log('Establishing connection to Realtime Database for summary data...')
  const summaryRef = dbRef(rtdb, 'insights/daily_prediction');
  onValue(summaryRef, (snapshot) => {
    if (snapshot.exists()) {
      summaryData.value = snapshot.val();
    } else {
      summaryData.value = null; // No summary data found
    }
    isSummaryLoading.value = false;
  }, (err) => {
    console.error('Summary data connection error:', err);
    summaryData.value = { error: 'Failed to load summary.' };
    isSummaryLoading.value = false;
  })
}


// --- Initialize connections ---
connectRTDB()
connectSummaryDB()

export function useWeatherData() {
  return {
    latestData: readonly(latestData),
    summaryData: readonly(summaryData),
    isLoading: readonly(isLoading),
    isSummaryLoading: readonly(isSummaryLoading),
    error: readonly(error),
  }
}
