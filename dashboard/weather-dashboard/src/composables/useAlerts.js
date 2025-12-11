// composables/useAlerts.js
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/firebase.js'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'

export function useAlerts() {
  const alertHistory = ref([])
  const isLoadingHistory = ref(true)
  let unsubscribe = null

  const startListening = () => {
    const alertsRef = collection(db, 'alerts_history')
    const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50))

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        alertHistory.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        isLoadingHistory.value = false
      },
      (error) => {
        console.error('Error listening for alerts:', error)
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
    isLoadingHistory.value = true
    // The snapshot listener will automatically refresh
    setTimeout(() => {
      isLoadingHistory.value = false
    }, 1000)
  }

  const loadMoreAlerts = () => {
    // TODO: Implement pagination
    console.log('Load more alerts')
  }

  // Auto-start listening when composable is used
  onMounted(() => {
    startListening()
  })

  onUnmounted(() => {
    stopListening()
  })

  return {
    alertHistory,
    isLoadingHistory,
    refreshHistory,
    loadMoreAlerts,
  }
}
