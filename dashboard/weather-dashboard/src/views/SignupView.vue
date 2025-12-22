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
    class="min-h-screen flex items-center justify-center bg-background text-text-main font-sans overflow-hidden relative selection:bg-primary selection:text-primary-text transition-colors duration-300"
  >
    <div
      class="fixed inset-0 opacity-[0.035] pointer-events-none z-0 mix-blend-multiply"
      style="background-image: url('https://grainy-gradients.vercel.app/noise.svg')"
    ></div>

    <div
      class="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-float-slow"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slow"
      style="animation-delay: -5s"
    ></div>

    <button
      @click="$router.push({ name: 'landing' })"
      class="absolute top-6 left-6 z-20 flex items-center gap-3 text-text-light hover:text-text-main transition-colors duration-200 group"
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

    <div class="w-full max-w-[460px] mx-4 relative z-10 my-8">
      <div
        class="bg-surface/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border/60 p-6 sm:p-10 animate-fade-in-up"
      >
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 rotate-3 hover:rotate-12 transition-transform duration-500 shadow-inner ring-1 ring-primary/20"
          >
            <Icon icon="ph:cloud-sun-bold" class="w-7 h-7" />
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
            Create Account
          </h2>
          <p class="text-text-light text-sm mt-2">Join the climate monitoring network</p>
        </div>

        <button
          @click="signInWithGoogle"
          type="button"
          :disabled="isLoading"
          class="w-full relative flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-background hover:bg-hover text-text-main font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group mb-6"
        >
          <Icon v-if="!isLoading" icon="flat-color-icons:google" class="w-5 h-5 absolute left-4" />
          <Icon
            v-else
            icon="eos-icons:loading"
            class="w-5 h-5 absolute left-4 animate-spin text-primary"
          />
          <span class="text-sm">
            {{ isLoading ? 'Please wait...' : 'Sign up with Google' }}
          </span>
        </button>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span class="px-4 bg-surface text-text-light/70 backdrop-blur-xl">
              Or register with email
            </span>
          </div>
        </div>

        <form @submit.prevent="signUp" class="space-y-4">
          <div class="space-y-1">
            <label
              for="email"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Email Address
            </label>
            <div class="relative group">
              <input
                v-model="email"
                type="email"
                id="email"
                class="block w-full px-4 py-3 pl-11 rounded-xl bg-background border border-border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                placeholder="yourname@example.com"
                required
              />
              <Icon
                icon="ph:envelope-simple"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-primary transition-colors"
              />
            </div>
            <p class="text-[10px] text-text-light ml-1 opacity-70">
              Supports Gmail, Yahoo, school emails, etc.
            </p>
          </div>

          <div class="space-y-1">
            <label
              for="password"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Password
            </label>
            <div class="relative group">
              <input
                v-model="password"
                type="password"
                id="password"
                class="block w-full px-4 py-3 pl-11 rounded-xl bg-background border border-border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                placeholder="••••••••"
                required
              />
              <Icon
                icon="ph:lock-key"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-primary transition-colors"
              />
            </div>
            <p class="text-[10px] text-text-light ml-1 opacity-70">Min. 6 characters</p>
          </div>

          <div class="space-y-1">
            <label
              for="confirmPassword"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Confirm Password
            </label>
            <div class="relative group">
              <input
                v-model="confirmPassword"
                type="password"
                id="confirmPassword"
                class="block w-full px-4 py-3 pl-11 rounded-xl bg-background border border-border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                placeholder="••••••••"
                required
              />
              <Icon
                icon="ph:lock-key-fill"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-primary transition-colors"
              />
            </div>
          </div>

          <div
            class="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 mt-4 backdrop-blur-sm transition-colors duration-300"
          >
            <div class="flex gap-3">
              <Icon
                icon="ph:warning-circle-bold"
                class="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
              />
              <div class="text-orange-800 dark:text-orange-200 text-xs space-y-1.5">
                <p class="font-bold uppercase tracking-wide">Important: Use Real Email</p>
                <ul class="list-disc pl-3 space-y-0.5">
                  <li>Verification link will be sent to inbox</li>
                  <li>Unverified accounts <strong>cannot login</strong></li>
                  <li>Check spam folder if link is missing</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl bg-primary text-primary-text font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            <Icon v-if="isLoading" icon="eos-icons:loading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
          </button>
        </form>

        <div class="space-y-3 mt-4">
          <Transition name="fade-slide">
            <div
              v-if="errorMessage"
              class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm flex gap-3 items-center text-center justify-center animate-fade-in"
            >
              <p class="text-red-700 dark:text-red-300 font-medium">{{ errorMessage }}</p>
            </div>
          </Transition>

          <Transition name="fade-slide">
            <div
              v-if="successMessage"
              class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm flex gap-3 items-center text-center justify-center animate-fade-in"
            >
              <p class="text-green-700 dark:text-green-300 font-medium">{{ successMessage }}</p>
            </div>
          </Transition>
        </div>

        <div class="mt-8 text-center border-t border-border pt-6">
          <p class="text-sm text-text-light">
            Already have an account?
            <router-link
              to="/login"
              class="font-bold text-primary hover:text-primary/80 transition-colors ml-1 inline-flex items-center gap-1 group"
            >
              Sign In
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
/* === CONSISTENT LANDING PAGE THEME VARIABLES === */
:root {
  --vt-c-white-mute: #f2f2f2;

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

/* DARK MODE SUPPORT */
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

/* Local Utility Mappings */
.bg-surface {
  background-color: var(--color-surface);
}
.bg-background {
  background-color: var(--color-background);
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

/* Animation Classes */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

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
