<template>
  <div
    class="min-h-screen flex bg-background font-sans text-text-main overflow-x-hidden transition-colors duration-300 selection:bg-primary selection:text-primary-text"
  >
    <Sidebar
      ref="sidebarRef"
      @update:expanded="handleSidebarExpand"
      @sign-out-error="handleSignOutError"
    />

    <div
      class="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      :class="isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[80px]'"
    >
      <header
        class="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-xl border-b border-border transition-all duration-300 safe-top"
      >
        <div
          class="px-3 xs:px-4 sm:px-6 h-14 xs:h-16 flex items-center justify-between gap-2 xs:gap-4"
        >
          <div class="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden p-1.5 xs:p-2 -ml-1 xs:-ml-2 text-text-light hover:text-primary hover:bg-surface rounded-lg xs:rounded-xl active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              :aria-label="isSidebarMobileOpen ? 'Close navigation menu' : 'Open navigation menu'"
            >
              <Icon :icon="sidebarOpenIcon" class="h-5 w-5 xs:h-6 xs:w-6" />
            </button>

            <div class="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
              <div class="flex items-center justify-center text-primary">
                <Icon icon="ph:cloud-sun-bold" class="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7" />
              </div>

              <h1 class="text-sm xs:text-base sm:text-lg font-bold tracking-tight truncate">
                <span class="hidden xs:inline">Climate Monitoring</span>
                <span class="xs:hidden">Climate Monitoring System</span>
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-1 xs:gap-2 shrink-0">
            <button
              @click="toggleTheme"
              class="p-2 xs:p-2.5 rounded-lg xs:rounded-full text-text-light hover:bg-surface hover:text-primary active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
              :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <Icon
                :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'"
                class="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 transition-transform duration-500"
                :class="{ 'rotate-180': isDarkMode }"
              />
            </button>
          </div>
        </div>
      </header>

      <main class="flex-grow p-3 xs:p-4 sm:p-6 lg:p-8 overflow-x-hidden safe-bottom" role="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </main>

      <AppFooter class="mt-auto shrink-0 z-10" />
    </div>

    <!-- Toast Notification for Errors -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="errorMessage"
        class="fixed bottom-4 xs:bottom-6 left-3 right-3 xs:left-auto xs:right-6 z-[100] xs:max-w-md safe-bottom-toast"
        role="alert"
        aria-live="assertive"
      >
        <div
          class="bg-red-500 text-white px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl shadow-2xl flex items-start gap-2 xs:gap-3 border border-red-400"
        >
          <Icon icon="ph:warning-circle-bold" class="w-4 h-4 xs:w-5 xs:h-5 shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-xs xs:text-sm">Error</p>
            <p class="text-xs xs:text-sm opacity-90 break-words">{{ errorMessage }}</p>
          </div>
          <button
            @click="clearError"
            class="p-1 hover:bg-red-600 rounded-md xs:rounded-lg transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <Icon icon="ph:x-bold" class="w-3.5 h-3.5 xs:w-4 xs:h-4" />
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

// --- Theme Logic ---
const { isDarkMode, toggleTheme } = useTheme()

// --- Sidebar Logic ---
const sidebarRef = ref(null)
const isSidebarExpanded = ref(true)

// Track mobile state via the ref exposed in Sidebar.vue
const isSidebarMobileOpen = computed(() => {
  return sidebarRef.value?.isMobileOpen ?? false
})

const sidebarOpenIcon = computed(() => (isSidebarMobileOpen.value ? 'ph:x-bold' : 'ph:list-bold'))

// Actions
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
  errorMessage.value = error?.message || 'Failed to sign out. Please try again.'

  // Auto-dismiss after 5 seconds
  clearTimeout(errorTimeout)
  errorTimeout = setTimeout(() => {
    clearError()
  }, 5000)
}

const clearError = () => {
  errorMessage.value = ''
  clearTimeout(errorTimeout)
}

// --- Responsive Sidebar Behavior ---
const handleResize = () => {
  const width = window.innerWidth

  // Auto-collapse sidebar on tablets
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
/* Smooth Page Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Safe Area Support for notched devices */
.safe-top {
  padding-top: env(safe-area-inset-top, 0);
}

.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
}

.safe-bottom-toast {
  bottom: max(1rem, calc(env(safe-area-inset-bottom, 0) + 1rem));
}

@media (min-width: 475px) {
  .safe-bottom-toast {
    bottom: max(1.5rem, calc(env(safe-area-inset-bottom, 0) + 1.5rem));
  }
}

/* Custom Scrollbar for the main page */
::-webkit-scrollbar {
  width: 6px;
}

@media (min-width: 640px) {
  ::-webkit-scrollbar {
    width: 8px;
  }
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-light);
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

/* Prevent horizontal scroll on very small devices */
@media (max-width: 374px) {
  html,
  body {
    overflow-x: hidden;
  }
}

/* Optimize touch targets for mobile */
@media (max-width: 640px) {
  button,
  a {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
