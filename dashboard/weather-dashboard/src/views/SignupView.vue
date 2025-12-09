<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase.js'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const router = useRouter()

// --- Helper to clear messages ---
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// --- Auto-clear messages after delay ---
let messageTimeout = null
const showMessage = (type, message, duration = 5000) => {
  clearMessages()
  if (messageTimeout) clearTimeout(messageTimeout)

  if (type === 'error') errorMessage.value = message
  else successMessage.value = message

  messageTimeout = setTimeout(clearMessages, duration)
}

// --- Email validation (ALL EMAIL PROVIDERS) ---
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false

  // Trim whitespace
  const cleanEmail = email.trim()

  // Basic email validation - accepts any valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(cleanEmail)
}

// --- Password validation ---
const isValidPassword = (password) => {
  return password.length >= 6
}

// --- Email/Password Sign Up ---
const signUp = async () => {
  // Validate email format
  if (!email.value) {
    showMessage('error', 'Please enter your email address.')
    return
  }

  // Trim whitespace
  email.value = email.value.trim()

  if (!isValidEmail(email.value)) {
    showMessage('error', 'Please enter a valid email address.')
    return
  }

  if (!isValidPassword(password.value)) {
    showMessage('error', 'Password must be at least 6 characters long.')
    return
  }

  if (password.value !== confirmPassword.value) {
    showMessage('error', 'Passwords do not match.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()

    // Create account
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    console.log('Successfully signed up:', userCredential.user.uid)

    // Send verification email
    await sendEmailVerification(userCredential.user)

    // Sign out immediately after signup
    await auth.signOut()

    // Show success message
    showMessage(
      'success',
      'Account created! Please check your email inbox and verify your account before signing in.',
      10000,
    )

    // Redirect to login after 4 seconds
    setTimeout(() => {
      router.push({ name: 'login' })
    }, 4000)
  } catch (error) {
    console.error('Sign Up Error:', error.code)

    switch (error.code) {
      case 'auth/email-already-in-use':
        showMessage('error', 'This email address is already registered. Please sign in instead.')
        break
      case 'auth/invalid-email':
        showMessage('error', 'Please enter a valid email address.')
        break
      case 'auth/weak-password':
        showMessage('error', 'Password is too weak. Please use a stronger password.')
        break
      case 'auth/operation-not-allowed':
        showMessage('error', 'Email/password accounts are not enabled.')
        break
      default:
        showMessage(
          'error',
          error.message === 'Navigation failed'
            ? 'Navigation failed. Please try again.'
            : 'An unexpected error occurred. Please try again.',
        )
        break
    }
  } finally {
    isLoading.value = false
  }
}

// --- Google Sign-In ---
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  try {
    isLoading.value = true
    clearMessages()
    const result = await signInWithPopup(auth, provider)
    console.log('Successfully signed in with Google:', result.user.uid)

    await router.push({ name: 'dashboard' }).catch((err) => {
      console.error('Navigation error:', err)
      throw new Error('Navigation failed')
    })
  } catch (error) {
    console.error('Google Sign-In Error:', error.code)

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        showMessage('error', 'Google sign-in was canceled.')
        break
      case 'auth/popup-blocked':
        showMessage('error', 'Popup was blocked. Please allow popups for this site.')
        break
      case 'auth/network-request-failed':
        showMessage('error', 'Network error. Please check your connection.')
        break
      case 'auth/cancelled-popup-request':
        // User opened multiple popups, ignore this error
        break
      default:
        showMessage(
          'error',
          error.message === 'Navigation failed'
            ? 'Navigation failed. Please try again.'
            : 'Failed to sign in with Google.',
        )
        break
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-500"
  >
    <div
      class="max-w-md w-full bg-surface rounded-2xl shadow-lg p-8 space-y-8 transition-all duration-500 transform hover:scale-[1.01] animate-fade-in"
    >
      <!-- Header -->
      <div class="text-center">
        <Icon
          icon="ph:cloud-sun-bold"
          class="h-12 w-12 text-primary mx-auto mb-4 transition-transform duration-500 hover:rotate-12"
        />
        <h2 class="text-3xl font-bold text-text-main">Create Account</h2>
        <p class="text-text-light mt-2">Sign up with your email account</p>
      </div>

      <!-- Social Sign-in -->
      <button
        @click="signInWithGoogle"
        type="button"
        :disabled="isLoading"
        aria-label="Sign up with Google"
        class="w-full flex items-center justify-center py-3 px-4 rounded-full shadow-sm border border-border bg-surface hover:bg-hover text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <Icon v-if="!isLoading" icon="flat-color-icons:google" class="h-5 w-5" />
        <Icon
          v-else
          icon="eos-icons:loading"
          class="h-5 w-5 animate-spin text-primary"
        />
        <span class="ml-3 text-sm font-medium">
          {{ isLoading ? 'Please wait...' : 'Sign up with Google' }}
        </span>
      </button>

      <!-- Separator -->
      <div class="relative py-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-6 bg-separator text-text-light relative z-10">
            Or sign in with email
          </span>
        </div>
      </div>

      <!-- Email/Password Form -->
      <form @submit.prevent="signUp" class="space-y-6">
        <!-- Email -->
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-text-main mb-1"
          >
            Email Address
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="ph:envelope-simple-bold" class="h-5 w-5 text-text-light" />
            </div>
            <input
              v-model="email"
              type="email"
              id="email"
              aria-label="Email Address"
              autocomplete="email"
              class="block w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 text-text-main"
              placeholder="yourname@example.com"
              required
            />
          </div>
          <p class="text-xs text-text-light mt-1">
            Any email address (Gmail, Yahoo, school email, etc.)
          </p>
        </div>

        <!-- Password -->
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-text-main mb-1"
          >
            Password
          </label>
          <input
            v-model="password"
            type="password"
            id="password"
            aria-label="Password"
            autocomplete="new-password"
            class="block w-full px-4 py-3 border border-border rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 text-text-main"
            placeholder="••••••••"
            required
          />
          <p class="text-xs text-text-light mt-1">Must be at least 6 characters</p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-text-main mb-1"
          >
            Confirm Password
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            id="confirmPassword"
            aria-label="Confirm Password"
            autocomplete="new-password"
            class="block w-full px-4 py-3 border border-border rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 text-text-main"
            placeholder="••••••••"
            required
          />
        </div>

        <!-- Important Warning -->
        <div
          class="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"
        >
          <div class="flex gap-2">
            <Icon
              icon="ph:warning-bold"
              class="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
            />
            <div class="text-orange-800 dark:text-orange-200 text-xs space-y-1">
              <p class="font-semibold">⚠️ IMPORTANT: Use Your REAL Email Address!</p>
              <p>• Verification email will be sent to your inbox</p>
              <p>• If your email doesn't exist, you CANNOT login</p>
              <p>• Check inbox AND spam folder for verification link</p>
              <p>• You must verify before you can sign in</p>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <Transition name="fade-slide">
          <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800/30">
            <p class="text-red-700 dark:text-red-300 text-sm text-center">{{ errorMessage }}</p>
          </div>
        </Transition>
        <Transition name="fade-slide">
          <div v-if="successMessage" class="p-3 rounded-lg bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800/30">
            <p class="text-green-700 dark:text-green-300 text-sm text-center">
              {{ successMessage }}
            </p>
          </div>
        </Transition>

        <!-- Sign Up Button -->
        <button
          type="submit"
          :disabled="isLoading"
          aria-label="Create account"
          class="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full text-base font-medium border border-border text-text-main bg-surface hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon
            v-if="isLoading"
            icon="eos-icons:loading"
            class="h-5 w-5 animate-spin text-primary"
          />
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <!-- Link to Sign In -->
      <div class="text-center">
        <p class="text-sm text-text-light">
          Already have an account?
          <router-link
            to="/login"
            class="font-medium text-primary hover:opacity-80 hover:underline transition-colors duration-300"
          >
            Sign In
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<style>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>
