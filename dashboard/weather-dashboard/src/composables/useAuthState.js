import { ref, onMounted, onUnmounted } from 'vue'
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export function useAuthState(router) {
  const user = ref(null)
  const isLoading = ref(true)
  let unsubscribe = null

  onMounted(() => {
    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        user.value = currentUser
      } else {
        router.push('/login')
      }
      isLoading.value = false
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    user,
    isLoading,
  }
}
