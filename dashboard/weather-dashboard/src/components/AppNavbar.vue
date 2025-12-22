<template>
  <nav
    class="fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-border transition-all duration-300 safe-top"
  >
    <div class="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6">
      <div class="flex items-center justify-between h-14 xs:h-16">
        <!-- Logo -->
        <router-link
          to="/"
          class="flex items-center gap-1.5 xs:gap-2 group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg touch-manipulation"
        >
          <div
            class="p-1 xs:p-1.5 rounded-lg xs:rounded-xl bg-gradient-to-tr from-primary/20 to-primary/5 text-primary group-hover:scale-110 transition-transform duration-300"
          >
            <Icon icon="ph:cloud-sun-bold" class="h-5 w-5 xs:h-6 xs:w-6" />
          </div>
          <span
            class="text-sm xs:text-base sm:text-lg font-bold text-text-main tracking-tight group-hover:opacity-80 transition-opacity"
          >
            <span class="hidden xs:inline">Climate Monitoring</span>
            <span class="xs:hidden">Climate</span>
          </span>
        </router-link>

        <!-- Actions -->
        <div class="flex items-center gap-2 xs:gap-3">
          <template v-if="!currentUser">
            <router-link
              to="/login"
              class="flex items-center px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 text-xs xs:text-sm font-semibold text-text-main hover:text-primary transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
            >
              Sign In
            </router-link>

            <router-link
              to="/signup"
              class="hidden xs:flex items-center px-4 xs:px-5 py-2 xs:py-2.5 rounded-full bg-primary text-primary-text text-xs xs:text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
            >
              Get Started
            </router-link>
          </template>

          <template v-else>
            <router-link
              v-if="$route.path === '/'"
              :to="{ name: 'dashboard' }"
              class="hidden sm:flex items-center px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-medium text-text-main hover:text-primary transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              Dashboard
            </router-link>

            <button
              @click="handleSignOut"
              :disabled="isSigningOut"
              class="flex items-center px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-full text-xs xs:text-sm font-medium text-text-light hover:bg-red-500/10 hover:text-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              :aria-label="isSigningOut ? 'Signing out' : 'Sign out'"
            >
              <Icon
                :icon="isSigningOut ? 'ph:spinner' : 'ph:sign-out-bold'"
                class="h-4 w-4 xs:h-5 xs:w-5"
                :class="{ 'animate-spin': isSigningOut }"
              />
              <span class="ml-1.5 xs:ml-2 hidden sm:inline">
                {{ isSigningOut ? 'Signing Out...' : 'Sign Out' }}
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase.js'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSigningOut = ref(false)
const currentUser = ref(null)

// Track auth state for UI reactivity
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
})

const handleSignOut = async () => {
  if (isSigningOut.value) return

  try {
    isSigningOut.value = true
    await signOut(auth)
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    isSigningOut.value = false
  }
}
</script>

<style scoped>
/* Safe Area Support */
.safe-top {
  padding-top: env(safe-area-inset-top, 0);
}

/* Touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
</style>
