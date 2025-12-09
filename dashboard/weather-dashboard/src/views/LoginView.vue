<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase.js'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const showResendButton = ref(false)

const router = useRouter()

// --- Rate Limiting for Auto-Resend (PREVENTS "TOO MANY REQUESTS") ---
const resendAttempts = ref(0)
const lastResendTime = ref(0)
const MAX_AUTO_RESENDS = 2 // Only auto-resend twice
const RESEND_COOLDOWN = 60000 // 1 minute cooldown between resends

const canAutoResend = () => {
  const now = Date.now()
  const timeSinceLastResend = now - lastResendTime.value

  // Reset counter after 5 minutes
  if (timeSinceLastResend > 300000) {
    resendAttempts.value = 0
  }

  return resendAttempts.value < MAX_AUTO_RESENDS && timeSinceLastResend > RESEND_COOLDOWN
}

// --- Helper to clear messages ---
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
  showResendButton.value = false
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

// --- Email validation ---
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// --- Resend Verification Email (MANUAL) ---
const resendVerification = async () => {
  try {
    isLoading.value = true
    clearMessages()

    // Sign in temporarily to get user object
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    if (!user.emailVerified) {
      await sendEmailVerification(user)
      await auth.signOut()

      lastResendTime.value = Date.now()
      resendAttempts.value++

      showMessage(
        'success',
        "✅ Verification email sent! Check your email inbox and spam folder. If your email doesn't exist, you cannot verify this account.",
        12000,
      )
    } else {
      await auth.signOut()
      showMessage('success', 'Your email is already verified! Please try signing in again.')
    }
  } catch (error) {
    console.error('Resend Verification Error:', error.code)
    if (error.code === 'auth/too-many-requests') {
      showMessage(
        'error',
        '⏱️ Too many attempts. Please wait 15-30 minutes before trying again.',
        10000,
      )
    } else {
      showMessage('error', 'Failed to resend verification. Please check your email and password.')
    }
  } finally {
    isLoading.value = false
  }
}

// --- Email/Password Sign In ---
const signIn = async () => {
  if (!isValidEmail(email.value)) {
    showMessage('error', 'Please enter a valid email address.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // Check if email is verified
    if (!user.emailVerified) {
      // AUTO-RESEND with rate limiting
      if (canAutoResend()) {
        try {
          await sendEmailVerification(user)
          lastResendTime.value = Date.now()
          resendAttempts.value++

          await auth.signOut()
          showMessage(
            'error',
            'Email not verified! We just sent you a new verification link. Check your inbox and spam folder.',
            12000,
          )
          showResendButton.value = true // Show manual button for next time
        } catch (resendError) {
          console.error('Auto-resend failed:', resendError.code)
          await auth.signOut()
          showMessage(
            'error',
            'Email not verified! Please click "Resend Verification" below to get a new link.',
            12000,
          )
          showResendButton.value = true
        }
      } else {
        // Rate limit reached - show manual button only
        await auth.signOut()
        showMessage(
          'error',
          'Email not verified! Click "Resend Verification" below to get a new link (wait 1 minute between resends).',
          12000,
        )
        showResendButton.value = true
      }
      return
    }

    console.log('Successfully signed in:', user.uid)

    await router.push({ name: 'dashboard' }).catch((err) => {
      console.error('Navigation error:', err)
      throw new Error('Navigation failed')
    })
  } catch (error) {
    console.error('Login Error:', error.code)

    switch (error.code) {
      case 'auth/invalid-email':
        showMessage('error', 'Please enter a valid email address.')
        break
      case 'auth/user-disabled':
        showMessage('error', 'This account has been disabled. Contact support.')
        break
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        showMessage('error', 'Invalid email or password. Please try again.')
        break
      case 'auth/too-many-requests':
        showMessage(
          'error',
          '⏱️ Too many failed attempts. Your account is temporarily locked. Wait 15-30 minutes or use "Forgot Password" to unlock.',
          15000,
        )
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

// --- Password Reset ---
const handlePasswordReset = async () => {
  if (!email.value) {
    showMessage('error', 'Please enter your email address to reset your password.')
    return
  }

  if (!isValidEmail(email.value)) {
    showMessage('error', 'Please enter a valid email address.')
    return
  }

  try {
    isLoading.value = true
    await sendPasswordResetEmail(auth, email.value)
    showMessage(
      'success',
      `✅ Password reset link sent to ${email.value}. Check your inbox and spam folder.`,
      8000,
    )
  } catch (error) {
    console.error('Password Reset Error:', error.code)

    switch (error.code) {
      case 'auth/invalid-email':
        showMessage('error', 'Please enter a valid email address.')
        break
      case 'auth/user-not-found':
        showMessage('error', 'No account found with this email.')
        break
      case 'auth/too-many-requests':
        showMessage('error', '⏱️ Too many requests. Please wait 15-30 minutes.')
        break
      default:
        showMessage('error', 'An error occurred. Please try again.')
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
    class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-500"
  >
    <div
      class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-8 transition-all duration-500 transform hover:scale-[1.01] animate-fade-in"
    >
      <!-- Header -->
      <div class="text-center">
        <Icon
          icon="ph:cloud-sun-bold"
          class="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 transition-transform duration-500 hover:rotate-12"
        />
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
        <p class="text-gray-600 dark:text-gray-300 mt-2">Sign in to access your dashboard</p>
      </div>

      <!-- Social Sign-in -->
      <button
        @click="signInWithGoogle"
        type="button"
        :disabled="isLoading"
        aria-label="Sign in with Google"
        class="w-full flex items-center justify-center py-3 px-4 rounded-full shadow-sm border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <Icon v-if="!isLoading" icon="flat-color-icons:google" class="h-5 w-5" />
        <Icon
          v-else
          icon="eos-icons:loading"
          class="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400"
        />
        <span class="ml-3 text-sm font-medium">
          {{ isLoading ? 'Please wait...' : 'Sign in with Google' }}
        </span>
      </button>

      <!-- Username Login Button -->
      <button
        @click="router.push({ name: 'phone-login' })"
        type="button"
        :disabled="isLoading"
        aria-label="Farmer Login with Username"
        class="w-full flex items-center justify-center py-3 px-4 rounded-full shadow-sm border border-gray-400 dark:border-gray-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon icon="ph:user-circle-bold" class="h-5 w-5 text-green-600 dark:text-green-400" />
        <span class="ml-3 text-sm font-medium"> Username Login - No Email Needed </span>
      </button>

      <!-- Separator -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or sign in with email
          </span>
        </div>
      </div>

      <!-- Email/Password Form -->
      <form @submit.prevent="signIn" class="space-y-6">
        <!-- Email -->
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
          >
            Email Address
          </label>
          <input
            v-model="email"
            type="email"
            id="email"
            aria-label="Email Address"
            class="block w-full px-4 py-3 border border-gray-400 dark:border-gray-500 rounded-lg bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100"
            placeholder="you@example.com"
            required
          />
        </div>

        <!-- Password -->
        <div>
          <div class="flex items-center justify-between">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Password
            </label>
            <button
              @click.prevent="handlePasswordReset"
              type="button"
              :disabled="isLoading"
              aria-label="Reset password"
              class="text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:underline transition-colors duration-300 disabled:opacity-50"
            >
              Forgot Password?
            </button>
          </div>
          <input
            v-model="password"
            type="password"
            id="password"
            aria-label="Password"
            class="block w-full px-4 py-3 border border-gray-400 dark:border-gray-500 rounded-lg bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100"
            placeholder="••••••••"
            required
          />
        </div>

        <!-- Messages -->
        <Transition name="fade-slide">
          <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/50">
            <p class="text-red-700 dark:text-red-300 text-sm text-center">{{ errorMessage }}</p>
          </div>
        </Transition>
        <Transition name="fade-slide">
          <div v-if="successMessage" class="p-3 rounded-lg bg-green-50 dark:bg-green-900/50">
            <p class="text-green-700 dark:text-green-300 text-sm text-center">
              {{ successMessage }}
            </p>
          </div>
        </Transition>

        <!-- Resend Verification Button (shows after auto-resend limit reached) -->
        <Transition name="fade-slide">
          <button
            v-if="showResendButton"
            @click.prevent="resendVerification"
            type="button"
            :disabled="isLoading"
            class="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border-2 border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Resend Verification Email
          </button>
        </Transition>

        <!-- Sign In Button -->
        <button
          type="submit"
          :disabled="isLoading"
          aria-label="Sign in"
          class="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full text-base font-medium border border-gray-400 dark:border-gray-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon
            v-if="isLoading"
            icon="eos-icons:loading"
            class="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400"
          />
          {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <!-- Important Info Box -->
      <div
        class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
      >
        <div class="flex gap-2">
          <Icon
            icon="ph:info-bold"
            class="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
          />
          <div class="text-blue-700 dark:text-blue-300 text-xs space-y-1">
            <p class="font-semibold">Getting "Too many attempts" error?</p>
            <p>• Wait 15-30 minutes before trying again</p>
            <p>• Make sure you verified your email first</p>
            <p>• Use "Forgot Password" to reset and unlock</p>
          </div>
        </div>
      </div>

      <!-- Link to Sign Up -->
      <div class="text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <router-link
            to="/signup"
            class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline transition-colors duration-300"
          >
            Sign Up
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
