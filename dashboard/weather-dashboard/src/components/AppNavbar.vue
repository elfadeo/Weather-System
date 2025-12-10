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
    router.push('/')
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <nav class="bg-surface shadow-sm w-full border-b border-hover">
    <div class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
      <div class="flex items-center justify-between h-14 sm:h-16">
        <!-- LOGO + TITLE -->
        <div class="flex items-center min-w-0">
          <Icon icon="ph:cloud-sun-bold" class="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />

          <h1 class="ml-2 text-base sm:text-xl font-bold text-text-main truncate">
            Weather Monitoring System
          </h1>
        </div>

        <!-- SIGN OUT -->
        <button
          @click="handleSignOut"
          :disabled="isSigningOut"
          class="flex items-center text-text-light hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          <Icon icon="ph:sign-out-bold" class="h-5 w-5" />
          <span class="ml-1.5 text-sm sm:text-base font-medium truncate">
            {{ isSigningOut ? 'Signing Out...' : 'Sign Out' }}
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>
