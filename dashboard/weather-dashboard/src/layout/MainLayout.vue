<template>
  <div
    class="min-h-screen flex bg-background font-sans text-text-main overflow-x-hidden selection:bg-primary selection:text-white theme-transition"
  >
    <Sidebar
      ref="sidebarRef"
      @update:expanded="handleSidebarExpand"
      @sign-out-error="handleSignOutError"
    />

    <div
      class="flex-1 flex flex-col min-w-0 min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      :class="isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[80px]'"
    >
      <header
        class="sticky top-0 z-30 w-full bg-surface/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300 safe-top"
      >
        <div class="px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden p-2 -ml-2 text-text-light hover:text-primary hover:bg-hover rounded-full active:scale-95 transition-all focus:outline-none"
              :aria-label="isSidebarMobileOpen ? 'Close menu' : 'Open menu'"
            >
              <Icon :icon="sidebarOpenIcon" class="h-6 w-6" />
            </button>

            <div class="flex items-center gap-3 lg:hidden">
              <span class="text-primary">
                <Icon icon="ph:cloud-sun-duotone" class="h-6 w-6" />
              </span>
              <h1 class="text-sm font-semibold tracking-wide uppercase text-text-main truncate">
                Climate Monitoring
              </h1>
            </div>

            <h2 class="hidden lg:block text-lg font-medium tracking-tight text-text-main">
              Dashboard Overview
            </h2>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <!-- Admin SMS Button (Only visible to admin) -->
            <router-link
              v-if="isAdmin"
              to="/dashboard/admin/sms"
              class="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all hover:scale-105 active:scale-95"
              title="Manage SMS Recipients"
            >
              <Icon icon="ph:shield-check-bold" class="w-4 h-4" />
              <span class="hidden md:inline">SMS Admin</span>
            </router-link>

            <!-- Mobile Admin Button (Icon Only) -->
            <router-link
              v-if="isAdmin"
              to="/dashboard/admin/sms"
              class="sm:hidden p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
              title="SMS Admin"
            >
              <Icon icon="ph:shield-check-bold" class="w-5 h-5" />
            </router-link>

            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="group relative p-2.5 rounded-full text-text-light hover:bg-hover hover:text-text-main transition-all focus:outline-none"
              :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              <Icon
                :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'"
                class="h-5 w-5 transition-transform duration-500 group-hover:rotate-12"
              />
            </button>
          </div>
        </div>
      </header>

      <main class="flex-grow p-4 sm:p-8 lg:p-10 safe-bottom overflow-x-hidden">
        <div class="max-w-7xl mx-auto w-full h-full">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </transition>
          </router-view>
        </div>
      </main>

      <AppFooter
        class="mt-auto shrink-0 z-10 opacity-60 hover:opacity-100 transition-opacity duration-300"
      />
    </div>

    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-8 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="errorMessage"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-8 z-[100] safe-bottom-toast"
        role="alert"
      >
        <div
          class="flex items-center gap-3 px-4 py-3 bg-surface/95 backdrop-blur-md border border-border shadow-xl rounded-full ring-1 ring-black/5 dark:ring-white/10"
        >
          <div class="flex items-center justify-center bg-red-50 rounded-full p-1.5">
            <Icon icon="ph:warning-circle-bold" class="w-4 h-4 text-red-600" />
          </div>

          <span class="text-sm font-medium text-text-main pr-2">
            {{ errorMessage }}
          </span>

          <button
            @click="clearError"
            class="p-1 -mr-1 text-text-light hover:text-text-main hover:bg-hover rounded-full transition-colors"
          >
            <Icon icon="ph:x-bold" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { Icon } from '@iconify/vue'
import { useTheme } from '@/composables/useTheme.js'
import { auth } from '@/firebase'
import { ADMIN_EMAIL } from '@/router'

// --- Theme Logic ---
const { isDarkMode, toggleTheme } = useTheme()

// --- Admin Check ---
const isAdmin = computed(() => {
  return auth.currentUser?.email === ADMIN_EMAIL
})

// --- Sidebar Logic ---
const sidebarRef = ref(null)
const isSidebarExpanded = ref(true)

const isSidebarMobileOpen = computed(() => {
  return sidebarRef.value?.isMobileOpen ?? false
})

const sidebarOpenIcon = computed(() => (isSidebarMobileOpen.value ? 'ph:x-bold' : 'ph:list-bold'))

const toggleMobileSidebar = () => {
  sidebarRef.value?.toggleMobile()
}

const handleSidebarExpand = (val) => {
  isSidebarExpanded.value = val
}

// --- Error Handling ---
const errorMessage = ref('')
let errorTimeout = null

const handleSignOutError = (error) => {
  errorMessage.value = error?.message || 'Unable to sign out.'
  clearTimeout(errorTimeout)
  errorTimeout = setTimeout(() => {
    clearError()
  }, 4000)
}

const clearError = () => {
  errorMessage.value = ''
  clearTimeout(errorTimeout)
}

// --- Responsive Logic ---
const handleResize = () => {
  const width = window.innerWidth
  if (width >= 1024 && width < 1280) {
    isSidebarExpanded.value = false
  } else if (width >= 1280) {
    isSidebarExpanded.value = true
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(errorTimeout)
})
</script>

<style scoped>
/* Smooth Theme Transition */
.theme-transition,
.theme-transition * {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth Page Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Safe Area & Layout Utilities */
.safe-top {
  padding-top: env(safe-area-inset-top, 0);
}

.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
}

.safe-bottom-toast {
  bottom: max(2rem, calc(env(safe-area-inset-bottom, 0) + 2rem));
}

/* Minimalist Scrollbar: Invisible until hover */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: transparent; /* Hidden by default */
  border-radius: 99px;
  transition: background-color 0.3s;
}

/* Show scrollbar when hovering over the scrollable area */
:hover::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-light);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s;
}

*:hover {
  scrollbar-color: var(--color-border) transparent;
}
</style>
