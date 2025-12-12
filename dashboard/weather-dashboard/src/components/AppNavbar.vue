<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase.js'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSigningOut = ref(false)

const handleSignOut = async () => {
  try {
    isSigningOut.value = true
    await signOut(auth)
    router.push({ name: 'login' }) // Use named route for better routing
  } catch (error) {
    console.error('Sign out error:', error)
    // Optionally show error toast/notification here
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <!-- Top Navigation Bar (for public/landing pages) -->
  <nav
    class="sticky top-0 z-50 bg-surface/95 backdrop-blur-md shadow-sm w-full border-b border-hover"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
      <div class="flex items-center justify-between h-14 sm:h-16">
        <!-- LOGO + TITLE -->
        <router-link
          to="/"
          class="flex items-center min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
        >
          <Icon
            icon="ph:cloud-sun-bold"
            class="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0"
            aria-hidden="true"
          />
          <h1 class="ml-2 text-base sm:text-xl font-bold text-text-main truncate">
            Weather Monitoring System
          </h1>
        </router-link>

        <!-- ACTIONS -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Optional: Add Login button if on landing page -->
          <router-link
            v-if="$route.path === '/'"
            to="/login"
            class="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-text-main hover:text-primary transition-colors rounded-lg hover:bg-hover focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Icon icon="ph:sign-in-bold" class="h-5 w-5 mr-1.5" />
            Sign In
          </router-link>

          <!-- SIGN OUT (only show if user is authenticated) -->
          <button
            v-if="auth.currentUser"
            @click="handleSignOut"
            :disabled="isSigningOut"
            class="flex items-center px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-text-light hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
            :aria-label="isSigningOut ? 'Signing out' : 'Sign out'"
          >
            <Icon
              :icon="isSigningOut ? 'ph:circle-notch-bold' : 'ph:sign-out-bold'"
              :class="['h-5 w-5', isSigningOut && 'animate-spin']"
            />
            <span class="ml-1.5 hidden sm:inline">
              {{ isSigningOut ? 'Signing Out...' : 'Sign Out' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Optional: Add smooth entrance animation */
nav {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
