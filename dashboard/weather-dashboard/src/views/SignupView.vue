<script setup>
import { ref, computed, onUnmounted } from 'vue'
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
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const router = useRouter()

// --- Message Management ---
let messageTimeout = null

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
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
  if (!email || typeof email !== 'string') return false
  const cleanEmail = email.trim()
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)
}

// --- Password Validation & Strength ---
const passwordStrength = computed(() => {
  const pass = password.value
  if (!pass) return { level: 0, text: '', color: '' }

  let strength = 0
  let text = ''
  let color = ''

  // Length check
  if (pass.length >= 6) strength += 1
  if (pass.length >= 8) strength += 1
  if (pass.length >= 12) strength += 1

  // Character variety
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 1
  if (/\d/.test(pass)) strength += 1
  if (/[^a-zA-Z0-9]/.test(pass)) strength += 1

  // Determine strength level
  if (strength <= 2) {
    text = 'Weak'
    color = 'bg-red-500'
  } else if (strength <= 4) {
    text = 'Fair'
    color = 'bg-orange-500'
  } else if (strength <= 5) {
    text = 'Good'
    color = 'bg-yellow-500'
  } else {
    text = 'Strong'
    color = 'bg-green-500'
  }

  return { level: strength, text, color }
})

// --- Password Match Indicator ---
const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return null
  return password.value === confirmPassword.value
})

// --- Real-time validation feedback ---
const emailTouched = ref(false)
const passwordTouched = ref(false)
const confirmPasswordTouched = ref(false)

const emailError = computed(() => {
  if (!emailTouched.value || !email.value) return ''
  if (!isValidEmail(email.value)) return 'Invalid email format'
  return ''
})

const passwordError = computed(() => {
  if (!passwordTouched.value || !password.value) return ''
  if (password.value.length < 6) return 'Must be at least 6 characters'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!confirmPasswordTouched.value || !confirmPassword.value) return ''
  if (!passwordsMatch.value) return 'Passwords do not match'
  return ''
})

// --- Email/Password Sign Up ---
const signUp = async () => {
  // Trim email
  email.value = email.value.trim()

  // Validate all fields
  if (!email.value) {
    showMessage('error', 'Please enter your email address.')
    return
  }

  if (!isValidEmail(email.value)) {
    showMessage('error', 'Please enter a valid email address.')
    return
  }

  if (password.value.length < 6) {
    showMessage('error', 'Password must be at least 6 characters long.')
    return
  }

  if (password.value !== confirmPassword.value) {
    showMessage('error', 'Passwords do not match. Please check and try again.')
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
      '✅ Account created! A verification email has been sent. Please check your inbox and spam folder, then verify your email before signing in.',
      15000,
    )

    // Clear form
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    emailTouched.value = false
    passwordTouched.value = false
    confirmPasswordTouched.value = false

    // Redirect to login after 6 seconds (giving more time to read)
    setTimeout(() => {
      router.push({ name: 'login' })
    }, 6000)
  } catch (error) {
    console.error('Sign Up Error:', error.code)

    switch (error.code) {
      case 'auth/email-already-in-use':
        showMessage(
          'error',
          'This email is already registered. Please sign in or use a different email.',
          8000,
        )
        break
      case 'auth/invalid-email':
        showMessage('error', 'Please enter a valid email address.')
        break
      case 'auth/weak-password':
        showMessage(
          'error',
          'Password is too weak. Use at least 6 characters with numbers and symbols.',
          8000,
        )
        break
      case 'auth/operation-not-allowed':
        showMessage(
          'error',
          'Email/password registration is currently disabled. Please contact support.',
        )
        break
      case 'auth/network-request-failed':
        showMessage('error', 'Network error. Please check your internet connection and try again.')
        break
      case 'auth/too-many-requests':
        showMessage(
          'error',
          '⏱️ Too many registration attempts. Please wait a few minutes and try again.',
          10000,
        )
        break
      default:
        showMessage('error', 'Failed to create account. Please try again or contact support.')
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
        showMessage('error', 'Google sign-up was cancelled. Please try again.')
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
          'An account already exists with this email using a different sign-in method. Please use that method instead.',
          10000,
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

    <!-- Main Signup Card -->
    <div class="w-full max-w-[460px] mx-4 relative z-10 my-8">
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
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
            Create Account
          </h1>
          <p class="text-text-light text-sm mt-2">Join the climate monitoring network</p>
        </div>

        <!-- Google Sign-Up Button -->
        <button
          @click="signInWithGoogle"
          type="button"
          :disabled="isLoading"
          class="w-full relative flex items-center justify-center py-3 px-4 rounded-xl border border-border bg-background hover:bg-hover text-text-main font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group mb-6"
        >
          <Icon v-if="!isLoading" icon="flat-color-icons:google" class="w-5 h-5 absolute left-4" />
          <Icon
            v-else
            icon="eos-icons:loading"
            class="w-5 h-5 absolute left-4 animate-spin text-primary"
          />
          <span class="text-sm">
            {{ isLoading ? 'Please wait...' : 'Continue with Google' }}
          </span>
        </button>

        <!-- Divider -->
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

        <!-- Email/Password Form -->
        <form @submit.prevent="signUp" class="space-y-4">
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
                @blur="emailTouched = true"
                type="email"
                id="email"
                autocomplete="email"
                :class="[
                  'block w-full px-4 py-3.5 pl-11 rounded-xl bg-background border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 transition-all duration-300',
                  emailError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-border focus:border-primary focus:ring-primary/20',
                ]"
                placeholder="yourname@example.com"
                required
              />
              <Icon
                :icon="emailError ? 'ph:warning-circle' : 'ph:envelope-simple'"
                :class="[
                  'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
                  emailError ? 'text-red-500' : 'text-text-light group-focus-within:text-primary',
                ]"
              />
              <Icon
                v-if="emailTouched && !emailError && email"
                icon="ph:check-circle"
                class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500"
              />
            </div>
            <p v-if="emailError" class="text-xs text-red-500 ml-1 flex items-center gap-1">
              <Icon icon="ph:warning" class="w-3 h-3" />
              {{ emailError }}
            </p>
            <p v-else class="text-[10px] text-text-light ml-1 opacity-70">
              Gmail, Yahoo, school emails, etc. supported
            </p>
          </div>

          <!-- Password Input -->
          <div class="space-y-1.5">
            <label
              for="password"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Password
            </label>
            <div class="relative group">
              <input
                v-model="password"
                @blur="passwordTouched = true"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                autocomplete="new-password"
                :class="[
                  'block w-full px-4 py-3.5 pl-11 pr-11 rounded-xl bg-background border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 transition-all duration-300',
                  passwordError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-border focus:border-primary focus:ring-primary/20',
                ]"
                placeholder="••••••••"
                required
                minlength="6"
              />
              <Icon
                icon="ph:lock-key"
                :class="[
                  'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
                  passwordError
                    ? 'text-red-500'
                    : 'text-text-light group-focus-within:text-primary',
                ]"
              />
              <button
                @click="showPassword = !showPassword"
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <Icon :icon="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="w-5 h-5" />
              </button>
            </div>

            <!-- Password Strength Indicator -->
            <div v-if="password.length > 0" class="space-y-1.5">
              <div class="flex gap-1">
                <div
                  v-for="i in 6"
                  :key="i"
                  :class="[
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    i <= passwordStrength.level ? passwordStrength.color : 'bg-border',
                  ]"
                ></div>
              </div>
              <p class="text-xs ml-1 flex items-center gap-2">
                <span class="text-text-light">Strength:</span>
                <span
                  :class="[
                    'font-semibold',
                    passwordStrength.level <= 2
                      ? 'text-red-500'
                      : passwordStrength.level <= 4
                        ? 'text-orange-500'
                        : passwordStrength.level <= 5
                          ? 'text-yellow-500'
                          : 'text-green-500',
                  ]"
                >
                  {{ passwordStrength.text }}
                </span>
              </p>
            </div>

            <p v-if="passwordError" class="text-xs text-red-500 ml-1 flex items-center gap-1">
              <Icon icon="ph:warning" class="w-3 h-3" />
              {{ passwordError }}
            </p>
            <p v-else class="text-[10px] text-text-light ml-1 opacity-70">
              Use 8+ characters with mix of letters, numbers & symbols
            </p>
          </div>

          <!-- Confirm Password Input -->
          <div class="space-y-1.5">
            <label
              for="confirmPassword"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Confirm Password
            </label>
            <div class="relative group">
              <input
                v-model="confirmPassword"
                @blur="confirmPasswordTouched = true"
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                autocomplete="new-password"
                :class="[
                  'block w-full px-4 py-3.5 pl-11 pr-11 rounded-xl bg-background border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 transition-all duration-300',
                  confirmPasswordError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : passwordsMatch === true
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                      : 'border-border focus:border-primary focus:ring-primary/20',
                ]"
                placeholder="••••••••"
                required
              />
              <Icon
                :icon="confirmPasswordError ? 'ph:warning-circle' : 'ph:lock-key-fill'"
                :class="[
                  'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
                  confirmPasswordError
                    ? 'text-red-500'
                    : passwordsMatch === true
                      ? 'text-green-500'
                      : 'text-text-light group-focus-within:text-primary',
                ]"
              />
              <button
                @click="showConfirmPassword = !showConfirmPassword"
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main transition-colors"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
              >
                <Icon :icon="showConfirmPassword ? 'ph:eye-slash' : 'ph:eye'" class="w-5 h-5" />
              </button>
            </div>
            <p
              v-if="confirmPasswordError"
              class="text-xs text-red-500 ml-1 flex items-center gap-1"
            >
              <Icon icon="ph:warning" class="w-3 h-3" />
              {{ confirmPasswordError }}
            </p>
            <p
              v-else-if="passwordsMatch === true"
              class="text-xs text-green-500 ml-1 flex items-center gap-1"
            >
              <Icon icon="ph:check-circle" class="w-3 h-3" />
              Passwords match
            </p>
          </div>

          <!-- Important Notice -->
          <div
            class="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 backdrop-blur-sm transition-colors duration-300"
          >
            <div class="flex gap-3">
              <Icon
                icon="ph:warning-circle-bold"
                class="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
              />
              <div class="text-orange-800 dark:text-orange-200 text-xs space-y-1.5">
                <p class="font-bold uppercase tracking-wide">Email Verification Required</p>
                <ul class="list-disc pl-3 space-y-0.5">
                  <li>Verification link sent to your inbox</li>
                  <li><strong>Must verify to login</strong></li>
                  <li>Check spam/junk folder if not received</li>
                  <li>Link expires in 24 hours</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl bg-primary text-primary-text font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Icon v-if="isLoading" icon="eos-icons:loading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
          </button>
        </form>

        <!-- Messages -->
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
              <p class="text-red-700 dark:text-red-300 font-medium leading-tight flex-1">
                {{ errorMessage }}
              </p>
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
              <div class="flex-1">
                <p class="text-green-700 dark:text-green-300 font-medium leading-tight mb-2">
                  {{ successMessage }}
                </p>
                <p class="text-green-600 dark:text-green-400 text-xs">
                  Redirecting to login page in 6 seconds...
                </p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Sign In Link -->
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
