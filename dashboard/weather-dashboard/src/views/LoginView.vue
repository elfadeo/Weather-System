<script setup>
import { ref, onUnmounted } from 'vue'
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
const lastUnverifiedUser = ref(null)

const router = useRouter()

// --- Rate Limiting for Verification Resend (Persisted) ---
const STORAGE_KEY = 'verification_rate_limit'
const resendAttempts = ref(0)
const lastResendTime = ref(0)
const MAX_AUTO_RESENDS = 2
const RESEND_COOLDOWN = 60000 // 1 minute

// Initialize rate limiting from localStorage
const initRateLimiting = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const now = Date.now()

      // Reset if more than 5 minutes have passed
      if (now - data.lastTime > 300000) {
        resendAttempts.value = 0
        lastResendTime.value = 0
      } else {
        resendAttempts.value = data.attempts || 0
        lastResendTime.value = data.lastTime || 0
      }
    }
  } catch (error) {
    console.error('Failed to load rate limit data:', error)
  }
}

// Update rate limiting in localStorage
const updateRateLimiting = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        attempts: resendAttempts.value,
        lastTime: lastResendTime.value,
      }),
    )
  } catch (error) {
    console.error('Failed to save rate limit data:', error)
  }
}

const canAutoResend = () => {
  const now = Date.now()
  const timeSinceLastResend = now - lastResendTime.value

  // Reset counter after 5 minutes
  if (timeSinceLastResend > 300000) {
    resendAttempts.value = 0
    lastResendTime.value = 0
    updateRateLimiting()
  }

  return resendAttempts.value < MAX_AUTO_RESENDS && timeSinceLastResend > RESEND_COOLDOWN
}

// Initialize on component mount
initRateLimiting()

// --- Message Management ---
let messageTimeout = null

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
  showResendButton.value = false
}

const showMessage = (type, message, duration = 5000) => {
  clearMessages()
  if (messageTimeout) clearTimeout(messageTimeout)

  if (type === 'error') errorMessage.value = message
  else successMessage.value = message

  messageTimeout = setTimeout(clearMessages, duration)
}

// Cleanup on component unmount
onUnmounted(() => {
  if (messageTimeout) clearTimeout(messageTimeout)
})

// --- Email Validation ---
const isValidEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

// --- Resend Verification Email (Manual) ---
const resendVerification = async () => {
  if (!lastUnverifiedUser.value) {
    showMessage('error', 'Session expired. Please try signing in again.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()

    await sendEmailVerification(lastUnverifiedUser.value)

    lastResendTime.value = Date.now()
    resendAttempts.value++
    updateRateLimiting()

    showMessage(
      'success',
      '✅ Verification email sent! Check your inbox and spam folder. The link expires in 24 hours.',
      12000,
    )
  } catch (error) {
    console.error('Resend Verification Error:', error.code)

    if (error.code === 'auth/too-many-requests') {
      showMessage(
        'error',
        '⏱️ Too many attempts. Please wait 15-30 minutes before trying again.',
        10000,
      )
    } else {
      showMessage('error', 'Failed to resend verification email. Please try again later.')
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

  if (!password.value || password.value.length < 6) {
    showMessage('error', 'Password must be at least 6 characters.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()

    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // Check if email is verified
    if (!user.emailVerified) {
      lastUnverifiedUser.value = user // Store for manual resend

      // AUTO-RESEND with rate limiting
      if (canAutoResend()) {
        try {
          await sendEmailVerification(user)
          lastResendTime.value = Date.now()
          resendAttempts.value++
          updateRateLimiting()

          await auth.signOut()
          showMessage(
            'error',
            '📧 Email not verified! We just sent a new verification link. Check your inbox and spam folder.',
            12000,
          )
          showResendButton.value = true
        } catch (resendError) {
          console.error('Auto-resend failed:', resendError.code)
          await auth.signOut()
          showMessage(
            'error',
            '📧 Email not verified! Click "Resend Verification" below to get a new link.',
            12000,
          )
          showResendButton.value = true
        }
      } else {
        // Rate limit reached - show manual button only
        await auth.signOut()
        showMessage(
          'error',
          '📧 Email not verified! Click "Resend Verification" below (wait 1 minute between attempts).',
          12000,
        )
        showResendButton.value = true
      }
      return
    }

    console.log('Successfully signed in:', user.uid)

    // Navigate to dashboard
    const navigationResult = await router.push({ name: 'dashboard' })

    if (navigationResult === false) {
      throw new Error('Navigation was blocked')
    }
  } catch (error) {
    console.error('Login Error:', error.code, error.message)

    // Handle navigation errors separately
    if (error.message === 'Navigation was blocked') {
      showMessage(
        'error',
        'Unable to navigate to dashboard. Please refresh the page and try again.',
      )
      return
    }

    // Handle Firebase auth errors
    switch (error.code) {
      case 'auth/invalid-email':
        showMessage('error', 'Please enter a valid email address.')
        break
      case 'auth/user-disabled':
        showMessage('error', 'This account has been disabled. Please contact support.')
        break
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        showMessage(
          'error',
          'Invalid email or password. Please check your credentials and try again.',
        )
        break
      case 'auth/too-many-requests':
        showMessage(
          'error',
          '⏱️ Too many failed login attempts. Your account is temporarily locked for security. Wait 15-30 minutes or use "Forgot Password" to reset.',
          15000,
        )
        break
      case 'auth/network-request-failed':
        showMessage('error', 'Network error. Please check your internet connection and try again.')
        break
      default:
        showMessage('error', 'An unexpected error occurred. Please try again or contact support.')
        break
    }
  } finally {
    isLoading.value = false
  }
}

// --- Password Reset ---
const handlePasswordReset = async () => {
  if (!email.value) {
    showMessage('error', 'Please enter your email address first to reset your password.')
    return
  }

  if (!isValidEmail(email.value)) {
    showMessage('error', 'Please enter a valid email address.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()

    await sendPasswordResetEmail(auth, email.value)

    showMessage(
      'success',
      `✅ Password reset link sent to ${email.value}. Check your inbox and spam folder. The link expires in 1 hour.`,
      10000,
    )
  } catch (error) {
    console.error('Password Reset Error:', error.code)

    switch (error.code) {
      case 'auth/invalid-email':
        showMessage('error', 'Please enter a valid email address.')
        break
      case 'auth/user-not-found':
        showMessage('error', 'No account found with this email address.')
        break
      case 'auth/too-many-requests':
        showMessage(
          'error',
          '⏱️ Too many password reset attempts. Please wait 15-30 minutes and try again.',
        )
        break
      default:
        showMessage('error', 'Failed to send password reset email. Please try again.')
        break
    }
  } finally {
    isLoading.value = false
  }
}

// --- Google Sign-In ---
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
  })

  try {
    isLoading.value = true
    clearMessages()

    const result = await signInWithPopup(auth, provider)
    console.log('Successfully signed in with Google:', result.user.uid)

    const navigationResult = await router.push({ name: 'dashboard' })

    if (navigationResult === false) {
      throw new Error('Navigation was blocked')
    }
  } catch (error) {
    console.error('Google Sign-In Error:', error.code)

    if (error.message === 'Navigation was blocked') {
      showMessage('error', 'Unable to navigate to dashboard. Please refresh the page.')
      return
    }

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        showMessage('error', 'Google sign-in was cancelled. Please try again.')
        break
      case 'auth/popup-blocked':
        showMessage(
          'error',
          'Popup was blocked by your browser. Please allow popups for this site and try again.',
        )
        break
      case 'auth/network-request-failed':
        showMessage('error', 'Network error. Please check your internet connection.')
        break
      case 'auth/account-exists-with-different-credential':
        showMessage(
          'error',
          'An account already exists with this email using a different sign-in method.',
        )
        break
      case 'auth/cancelled-popup-request':
        // User opened multiple popups - silently ignore
        break
      default:
        showMessage('error', 'Failed to sign in with Google. Please try again.')
        break
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background text-text-main font-sans overflow-hidden relative selection:bg-primary selection:text-primary-text transition-colors duration-300"
  >
    <!-- Noise Texture -->
    <div
      class="fixed inset-0 opacity-[0.035] pointer-events-none z-0 mix-blend-multiply"
      style="background-image: url('https://grainy-gradients.vercel.app/noise.svg')"
    ></div>

    <!-- Animated Gradient Blobs -->
    <div
      class="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-float-slow"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slow"
      style="animation-delay: -5s"
    ></div>

    <!-- Back Button -->
    <button
      @click="$router.push({ name: 'landing' })"
      class="absolute top-6 left-6 z-20 flex items-center gap-3 text-text-light hover:text-text-main transition-colors duration-200 group"
      aria-label="Back to home"
    >
      <div
        class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 backdrop-blur-sm"
      >
        <Icon icon="ph:arrow-left-bold" class="w-4 h-4" />
      </div>
      <span
        class="text-sm font-medium hidden sm:inline opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300"
        >Back home</span
      >
    </button>

    <!-- Main Login Card -->
    <div class="w-full max-w-[420px] mx-4 relative z-10">
      <div
        class="bg-surface/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border/60 p-6 sm:p-10 animate-fade-in-up"
      >
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 rotate-3 hover:rotate-12 transition-transform duration-500 shadow-inner ring-1 ring-primary/20"
          >
            <Icon icon="ph:cloud-sun-bold" class="w-7 h-7" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">Welcome Back</h1>
          <p class="text-text-light text-sm mt-2">Sign in to access your climate data</p>
        </div>

        <!-- Google Sign-In Button -->
        <div class="space-y-3 mb-6">
          <button
            @click="signInWithGoogle"
            type="button"
            :disabled="isLoading"
            class="w-full relative flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-background hover:bg-hover text-text-main font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Icon
              v-if="!isLoading"
              icon="flat-color-icons:google"
              class="w-5 h-5 absolute left-4"
            />
            <Icon
              v-else
              icon="eos-icons:loading"
              class="w-5 h-5 absolute left-4 animate-spin text-primary"
            />
            <span class="text-sm">
              {{ isLoading ? 'Please wait...' : 'Continue with Google' }}
            </span>
          </button>
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span class="px-4 bg-surface text-text-light/70 backdrop-blur-xl">
              Or continue with email
            </span>
          </div>
        </div>

        <!-- Email/Password Form -->
        <form @submit.prevent="signIn" class="space-y-5">
          <!-- Email Input -->
          <div class="space-y-1.5">
            <label
              for="email"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Email Address
            </label>
            <div class="relative group">
              <input
                v-model.trim="email"
                type="email"
                id="email"
                autocomplete="email"
                class="block w-full px-4 py-3.5 pl-11 rounded-xl bg-background border border-border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                placeholder="farmer@example.com"
                required
              />
              <Icon
                icon="ph:envelope-simple"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-primary transition-colors"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between ml-1">
              <label
                for="password"
                class="block text-xs font-bold text-text-light uppercase tracking-wide"
              >
                Password
              </label>
              <button
                @click.prevent="handlePasswordReset"
                type="button"
                :disabled="isLoading"
                class="text-xs font-semibold text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative group">
              <input
                v-model="password"
                type="password"
                id="password"
                autocomplete="current-password"
                class="block w-full px-4 py-3.5 pl-11 rounded-xl bg-background border border-border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                placeholder="••••••••"
                required
                minlength="6"
              />
              <Icon
                icon="ph:lock-key"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-primary transition-colors"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl bg-primary text-primary-text font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
          >
            <Icon v-if="isLoading" icon="eos-icons:loading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'Signing In...' : 'Sign In to Dashboard' }}</span>
          </button>
        </form>

        <!-- Messages and Resend Button -->
        <div class="space-y-3 mt-6">
          <!-- Error Message -->
          <Transition name="fade-slide">
            <div
              v-if="errorMessage"
              role="alert"
              class="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm flex gap-3 items-start animate-fade-in"
            >
              <Icon
                icon="ph:warning-circle-bold"
                class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              />
              <div class="space-y-1 flex-1">
                <p class="text-red-700 dark:text-red-300 font-medium leading-tight">
                  {{ errorMessage }}
                </p>
                <div
                  v-if="errorMessage.includes('Too many')"
                  class="text-red-600/80 dark:text-red-400/80 text-xs mt-2 pl-1 border-l-2 border-red-300 dark:border-red-700"
                >
                  <p class="font-semibold">Troubleshooting steps:</p>
                  <ul class="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Wait 15-30 minutes for account unlock</li>
                    <li>Check if your email is verified</li>
                    <li>Try resetting your password</li>
                  </ul>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Success Message -->
          <Transition name="fade-slide">
            <div
              v-if="successMessage"
              role="status"
              class="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm flex gap-3 items-start animate-fade-in"
            >
              <Icon
                icon="ph:check-circle-bold"
                class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
              />
              <p class="text-green-700 dark:text-green-300 font-medium leading-tight flex-1">
                {{ successMessage }}
              </p>
            </div>
          </Transition>

          <!-- Resend Verification Button -->
          <Transition name="fade-slide">
            <button
              v-if="showResendButton"
              @click.prevent="resendVerification"
              type="button"
              :disabled="isLoading"
              class="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wide border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="ph:paper-plane-right-bold" class="w-4 h-4" />
              Resend Verification Email
            </button>
          </Transition>
        </div>

        <!-- Sign Up Link -->
        <div class="mt-8 text-center border-t border-border pt-6">
          <p class="text-sm text-text-light">
            Don't have an account?
            <router-link
              to="/signup"
              class="font-bold text-primary hover:text-primary/80 transition-colors ml-1 inline-flex items-center gap-1 group"
            >
              Sign Up
              <Icon
                icon="ph:arrow-right-bold"
                class="w-3 h-3 group-hover:translate-x-1 transition-transform"
              />
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === THEME VARIABLES === */
:root {
  /* LIGHT MODE */
  --color-background: #f8f9fa;
  --color-surface: rgba(255, 255, 255, 0.85);
  --color-primary: #1a73e8;
  --color-text-main: #202124;
  --color-text-light: #5f6368;
  --color-hover: #f1f3f4;
  --color-border: #e5e7eb;
  --color-primary-text: #ffffff;
}

/* DARK MODE */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #000000;
    --color-surface: rgba(20, 20, 20, 0.8);
    --color-primary: #8ab4f8;
    --color-text-main: #e8eaed;
    --color-text-light: #9aa0a6;
    --color-hover: #2a2a2a;
    --color-border: #374151;
    --color-primary-text: #1a1a1a;
  }
}

/* Utility Classes */
.bg-surface {
  background-color: var(--color-surface);
}
.bg-background {
  background-color: var(--color-background);
}
.bg-hover {
  background-color: var(--color-hover);
}
.text-text-main {
  color: var(--color-text-main);
}
.text-text-light {
  color: var(--color-text-light);
}
.border-border {
  border-color: var(--color-border);
}
.bg-primary {
  background-color: var(--color-primary);
}
.text-primary {
  color: var(--color-primary);
}
.text-primary-text {
  color: var(--color-primary-text);
}

/* Transition Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Float Animation */
@keyframes float-slow {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-20px, 20px) scale(1.1);
  }
}
.animate-float-slow {
  animation: float-slow 15s infinite ease-in-out;
}

/* Fade In Up Animation */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Fade In Animation */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>
