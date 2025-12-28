import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/firebase.js'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  startAfter,
  getDocs,
} from 'firebase/firestore'

// CONFIGURATION: Change this number to control how many alerts show at once
const PAGE_SIZE = 10

export function useAlerts() {
  const alertHistory = ref([])
  const isLoadingHistory = ref(true)
  const isLoadingMore = ref(false)
  const error = ref(null)

  let unsubscribe = null
  let lastVisible = null

  // 1. Initial Real-time Listener (First 10)
  const startListening = () => {
    if (unsubscribe) return
    isLoadingHistory.value = true
    error.value = null

    const alertsRef = collection(db, 'alerts_history')

    // CHANGED: Uses PAGE_SIZE (10) instead of 50
    const firstBatchQuery = query(alertsRef, orderBy('timestamp', 'desc'), limit(PAGE_SIZE))

    unsubscribe = onSnapshot(
      firstBatchQuery,
      (snapshot) => {
        alertHistory.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        lastVisible = snapshot.docs[snapshot.docs.length - 1]
        isLoadingHistory.value = false
        error.value = null
      },
      (err) => {
        console.error('Firestore Error:', err)
        error.value = 'Failed to load live alerts.'
        isLoadingHistory.value = false
      },
    )
  }

  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const refreshHistory = () => {
    stopListening()
    isLoadingHistory.value = true
    setTimeout(() => startListening(), 500)
  }

  // 2. Load Older Alerts (Next 10)
  const loadMoreAlerts = async () => {
    if (!lastVisible || isLoadingMore.value) return

    isLoadingMore.value = true

    try {
      const alertsRef = collection(db, 'alerts_history')

      // CHANGED: Uses PAGE_SIZE (10)
      const nextBatchQuery = query(
        alertsRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(PAGE_SIZE),
      )

      const snapshot = await getDocs(nextBatchQuery)

      if (!snapshot.empty) {
        const newAlerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Add the next 10 to the list
        alertHistory.value.push(...newAlerts)

        // Update the cursor
        lastVisible = snapshot.docs[snapshot.docs.length - 1]
      }
    } catch (err) {
      console.error('Error loading more:', err)
      error.value = 'Failed to load older alerts.'
    } finally {
      isLoadingMore.value = false
    }
  }

  onMounted(() => {
    startListening()
  })

  onUnmounted(() => {
    stopListening()
  })

  return {
    alertHistory,
    isLoadingHistory,
    isLoadingMore,
    error,
    refreshHistory,
    loadMoreAlerts,
  }
}
