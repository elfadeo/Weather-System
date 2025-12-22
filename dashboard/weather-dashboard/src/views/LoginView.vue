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

    <div class="w-full max-w-[420px] mx-4 relative z-10">
      <div
        class="bg-surface/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border/60 p-6 sm:p-10 animate-fade-in-up"
      >
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 rotate-3 hover:rotate-12 transition-transform duration-500 shadow-inner ring-1 ring-primary/20"
          >
            <Icon icon="ph:cloud-sun-bold" class="w-7 h-7" />
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">Welcome Back</h2>
          <p class="text-text-light text-sm mt-2">Sign in to access your climate data</p>
        </div>

        <div class="space-y-3">
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
              {{ isLoading ? 'Please wait...' : 'Sign in with Google' }}
            </span>
          </button>

          <button
            @click="router.push({ name: 'phone-login' })"
            type="button"
            :disabled="isLoading"
            class="w-full relative flex items-center justify-center py-3 px-4 rounded-xl border border-green-200/50 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-text-main font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Icon
              icon="ph:user-circle-bold"
              class="w-5 h-5 absolute left-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform"
            />
            <span class="text-sm"
              >Username Login
              <span class="text-[10px] opacity-60 ml-1 font-normal">(No Email)</span></span
            >
          </button>
        </div>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span class="px-4 bg-surface text-text-light/70 backdrop-blur-xl">
              Or continue with
            </span>
          </div>
        </div>

        <form @submit.prevent="signIn" class="space-y-5">
          <div class="space-y-1.5">
            <label
              for="email"
              class="block text-xs font-bold text-text-light uppercase tracking-wide ml-1"
            >
              Email
            </label>
            <div class="relative group">
              <input
                v-model="email"
                type="email"
                id="email"
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
                class="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative group">
              <input
                v-model="password"
                type="password"
                id="password"
                class="block w-full px-4 py-3.5 pl-11 rounded-xl bg-background border border-border text-text-main placeholder-text-light/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                placeholder="••••••••"
                required
              />
              <Icon
                icon="ph:lock-key"
                class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light group-focus-within:text-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl bg-primary text-primary-text font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            <Icon v-if="isLoading" icon="eos-icons:loading" class="w-5 h-5 animate-spin" />
            <span>{{ isLoading ? 'Signing In...' : 'Sign In to Dashboard' }}</span>
          </button>
        </form>

        <div class="space-y-3 mt-6">
          <Transition name="fade-slide">
            <div
              v-if="errorMessage"
              class="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm flex gap-3 items-start animate-fade-in"
            >
              <Icon
                icon="ph:warning-circle-bold"
                class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              />
              <div class="space-y-1">
                <p class="text-red-700 dark:text-red-300 font-medium leading-tight">
                  {{ errorMessage }}
                </p>
                <div
                  v-if="errorMessage.includes('Too many')"
                  class="text-red-600/80 dark:text-red-400/80 text-xs mt-2 pl-1 border-l-2 border-red-300 dark:border-red-700"
                >
                  <p class="font-semibold">Try these steps:</p>
                  <ul class="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Wait 15-30 minutes</li>
                    <li>Check email verification</li>
                    <li>Reset password</li>
                  </ul>
                </div>
              </div>
            </div>
          </Transition>

          <Transition name="fade-slide">
            <div
              v-if="successMessage"
              class="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm flex gap-3 items-start animate-fade-in"
            >
              <Icon
                icon="ph:check-circle-bold"
                class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
              />
              <p class="text-green-700 dark:text-green-300 font-medium leading-tight">
                {{ successMessage }}
              </p>
            </div>
          </Transition>

          <Transition name="fade-slide">
            <button
              v-if="showResendButton"
              @click.prevent="resendVerification"
              type="button"
              :disabled="isLoading"
              class="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wide border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-300"
            >
              <Icon icon="ph:paper-plane-right-bold" class="w-4 h-4" />
              Resend Verification Email
            </button>
          </Transition>
        </div>

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
/* === CONSISTENT LANDING PAGE THEME VARIABLES ===
   Ensures this page looks exactly like the landing page even if standalone
*/
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

  /* Custom Green for Username Button */
  --color-green-50: #f0fdf4;
  --color-green-100: #dcfce7;
  --color-green-600: #16a34a;
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

    --color-green-50: #0d1e13;
    --color-green-100: #1a2d20;
    --color-green-600: #7be0a3;
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
