<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase.js'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const isSignupMode = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const router = useRouter()

// --- Computed properties ---
const buttonText = computed(() => {
  if (isLoading.value) {
    return isSignupMode.value ? 'Creating Account...' : 'Signing In...'
  }
  return isSignupMode.value ? 'Create Account' : 'Sign In'
})

const toggleModeText = computed(() => {
  return isSignupMode.value ? 'Already have an account?' : "Don't have an account?"
})

const toggleButtonText = computed(() => {
  return isSignupMode.value ? 'Sign In' : 'Sign Up'
})

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

// --- Username validation ---
const isValidUsername = (username) => {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username)
}

// --- Password validation ---
const isValidPassword = (password) => {
  return password.length >= 6
}

// --- Convert username to email format ---
const usernameToEmail = (username) => {
  return `${username.toLowerCase()}@farmerdashboard.local`
}

// --- Sign In ---
const signIn = async () => {
  if (!username.value) {
    showMessage('error', 'Please enter your username.')
    return
  }

  if (!isValidUsername(username.value)) {
    showMessage('error', 'Username must be 3-20 characters (letters, numbers, - or _)')
    return
  }

  if (!password.value) {
    showMessage('error', 'Please enter your password.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()

    const email = usernameToEmail(username.value)
    const userCredential = await signInWithEmailAndPassword(auth, email, password.value)
    console.log('Successfully signed in:', userCredential.user.uid)

    showMessage('success', 'Welcome back!', 2000)

    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 1000)
  } catch (error) {
    console.error('Login Error:', error.code)

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        showMessage('error', 'Invalid username or password.')
        break
      case 'auth/too-many-requests':
        showMessage('error', 'Too many failed attempts. Please try again later.')
        break
      default:
        showMessage('error', 'Login failed. Please try again.')
        break
    }
  } finally {
    isLoading.value = false
  }
}

// --- Sign Up ---
const signUp = async () => {
  if (!username.value) {
    showMessage('error', 'Please enter a username.')
    return
  }

  if (!isValidUsername(username.value)) {
    showMessage('error', 'Username must be 3-20 characters (letters, numbers, - or _)')
    return
  }

  if (!isValidPassword(password.value)) {
    showMessage('error', 'Password must be at least 6 characters.')
    return
  }

  if (password.value !== confirmPassword.value) {
    showMessage('error', 'Passwords do not match.')
    return
  }

  try {
    isLoading.value = true
    clearMessages()

    const email = usernameToEmail(username.value)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password.value)
    console.log('Successfully signed up:', userCredential.user.uid)

    showMessage('success', 'Account created successfully! Redirecting...', 3000)

    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 1500)
  } catch (error) {
    console.error('Signup Error:', error.code)

    switch (error.code) {
      case 'auth/email-already-in-use':
        showMessage('error', 'This username is already taken. Please choose another.')
        break
      case 'auth/weak-password':
        showMessage('error', 'Password is too weak. Please use a stronger password.')
        break
      default:
        showMessage('error', 'Signup failed. Please try again.')
        break
    }
  } finally {
    isLoading.value = false
  }
}

// --- Toggle between login and signup ---
const toggleMode = () => {
  isSignupMode.value = !isSignupMode.value
  clearMessages()
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
}

// --- Handle form submit ---
const handleSubmit = () => {
  if (isSignupMode.value) {
    signUp()
  } else {
    signIn()
  }
}

// --- Toggle password visibility ---
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-500"
  >
    <div
      class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 transition-all duration-500 animate-fade-in border border-gray-200 dark:border-gray-700"
    >
      <!-- Header -->
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 mb-4 shadow-lg"
        >
          <Icon icon="ph:user-circle-bold" class="h-8 w-8 text-white" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ isSignupMode ? 'Create Account' : 'Welcome Back' }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ isSignupMode ? 'Create your username and password' : 'Sign in to your account' }}
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Username -->
        <div>
          <label
            for="username"
            class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Username
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="ph:user-bold" class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="username"
              type="text"
              id="username"
              aria-label="Username"
              autocomplete="username"
              class="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="Enter your username"
              required
              :disabled="isLoading"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
            3-20 characters (letters, numbers, - or _)
          </p>
        </div>

        <!-- Password -->
        <div>
          <label
            for="password"
            class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Password
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              id="password"
              aria-label="Password"
              autocomplete="current-password"
              class="block w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="Enter your password"
              required
              :disabled="isLoading"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Toggle password visibility"
            >
              <Icon :icon="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">Minimum 6 characters</p>
        </div>

        <!-- Confirm Password (Signup only) -->
        <div v-if="isSignupMode">
          <label
            for="confirmPassword"
            class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Confirm Password
          </label>
          <div class="relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              aria-label="Confirm Password"
              autocomplete="new-password"
              class="block w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="Re-enter your password"
              required
              :disabled="isLoading"
            />
            <button
              type="button"
              @click="toggleConfirmPasswordVisibility"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Toggle confirm password visibility"
            >
              <Icon :icon="showConfirmPassword ? 'ph:eye-slash' : 'ph:eye'" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <Transition name="fade-slide">
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
          >
            <div class="flex items-center gap-2">
              <Icon
                icon="ph:warning-circle-bold"
                class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0"
              />
              <p class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</p>
            </div>
          </div>
        </Transition>
        <Transition name="fade-slide">
          <div
            v-if="successMessage"
            class="p-3.5 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
          >
            <div class="flex items-center gap-2">
              <Icon
                icon="ph:check-circle-bold"
                class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
              />
              <p class="text-green-700 dark:text-green-300 text-sm">{{ successMessage }}</p>
            </div>
          </div>
        </Transition>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          aria-label="Submit"
          class="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
        >
          <Icon v-if="isLoading" icon="eos-icons:loading" class="h-5 w-5 animate-spin" />
          <Icon
            v-else
            :icon="isSignupMode ? 'ph:user-plus-bold' : 'ph:sign-in-bold'"
            class="h-5 w-5"
          />
          {{ buttonText }}
        </button>
      </form>

      <!-- Toggle Mode -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {{ toggleModeText }}
          </span>
        </div>
      </div>

      <button
        @click="toggleMode"
        type="button"
        :disabled="isLoading"
        class="w-full py-3 px-4 rounded-lg text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ toggleButtonText }}
      </button>

      <!-- Link to Email Login -->
      <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Prefer email login?
          <router-link
            to="/login"
            class="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors duration-300"
          >
            Sign in with Email
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
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
