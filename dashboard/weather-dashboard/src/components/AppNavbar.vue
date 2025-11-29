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
    console.log('User signed out')
    router.push('/') // Redirect to login
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Title -->
        <div class="flex items-center">
          <div class="flex-shrink-0 text-blue-500">
            <Icon icon="ph:cloud-sun-bold" class="h-8 w-8 " />
          </div>
          <div class="ml-4">
            <h1 class="text-xl font-bold text-gray-800">Weather Monitoring System</h1>
          </div>
        </div>

        <!-- Sign Out Button -->
        <div class="flex items-center">
          <button
            @click="handleSignOut"
            :disabled="isSigningOut"
            aria-label="Sign out"
            class="flex items-center text-gray-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:text-blue-500 transition-colors duration-200"
          >
            <Icon icon="ph:sign-out-bold" class="h-5 w-5" />
            <span class="ml-2 text-sm font-medium">
              {{ isSigningOut ? 'Signing Out...' : 'Sign Out' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
