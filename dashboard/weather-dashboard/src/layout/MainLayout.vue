<template>
  <div
    class="min-h-screen flex bg-[var(--color-background)] font-sans text-[var(--color-text-main)] overflow-x-hidden transition-colors duration-300 selection:bg-[var(--color-primary)] selection:text-white"
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
        class="sticky top-0 z-30 w-full bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)] transition-all duration-300 safe-top"
      >
        <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden p-2 -ml-2 text-[var(--color-text-light)] hover:text-[var(--color-primary)] hover:bg-[var(--color-hover)] rounded-lg active:scale-95 transition-all focus:outline-none"
              :aria-label="isSidebarMobileOpen ? 'Close menu' : 'Open menu'"
            >
              <Icon :icon="sidebarOpenIcon" class="h-6 w-6" />
            </button>

            <div class="flex items-center gap-2 min-w-0 flex-1 lg:hidden">
              <div class="flex items-center justify-center text-[var(--color-primary)]">
                <Icon icon="ph:cloud-sun-duotone" class="h-6 w-6" />
              </div>
              <h1 class="text-base font-bold tracking-tight truncate text-[var(--color-text-main)]">
                Climate Monitoring
              </h1>
            </div>

            <div class="flex items-center justify-center text-[var(--color-primary)]">
              <Icon icon="ph:cloud-sun-duotone" class="h-6 w-6" />
            </div>
            <h1 class="text-base font-bold tracking-tight truncate text-[var(--color-text-main)]">
              Climate Monitoring System
            </h1>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="toggleTheme"
              class="group p-2.5 rounded-full text-[var(--color-text-light)] hover:bg-[var(--color-hover)] hover:text-[var(--color-primary)] active:scale-95 transition-all focus:outline-none"
              :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <Icon
                :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'"
                class="h-5 w-5 transition-transform duration-500 group-hover:rotate-12"
              />
            </button>
          </div>
        </div>
      </header>

      <main class="flex-grow p-4 sm:p-6 lg:p-8 overflow-x-hidden safe-bottom" role="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </main>

      <AppFooter class="mt-auto shrink-0 z-10" />
    </div>

    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="errorMessage"
        class="fixed bottom-6 right-6 z-[100] max-w-sm w-full safe-bottom-toast"
        role="alert"
      >
        <div
          class="bg-[var(--color-surface)] border-l-4 border-[var(--color-red-500)] shadow-lg rounded-r-lg p-4 flex items-start gap-3 ring-1 ring-black/5 dark:ring-white/10"
        >
          <Icon
            icon="ph:warning-circle-duotone"
            class="w-5 h-5 text-[var(--color-red-500)] shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-[var(--color-text-main)]">Error</h3>
            <p class="text-sm text-[var(--color-text-light)] mt-1 break-words leading-relaxed">
              {{ errorMessage }}
            </p>
          </div>
          <button
            @click="clearError"
            class="p-1 text-[var(--color-text-light)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-hover)] rounded-md transition-colors shrink-0"
          >
            <Icon icon="ph:x-bold" class="w-4 h-4" />
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
  clearTimeout(errorTimeout)
  errorTimeout = setTimeout(() => {
    clearError()
  }, 5000)
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
/* Page Transition */
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

/* Safe Area Support */
.safe-top {
  padding-top: env(safe-area-inset-top, 0);
}

.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
}

.safe-bottom-toast {
  bottom: max(1.5rem, calc(env(safe-area-inset-bottom, 0) + 1.5rem));
}

/* Custom Scrollbar
   Uses CSS variables to adapt to the theme perfectly
*/
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 99px;
  border: 2px solid transparent; /* Creates padding effect */
  background-clip: content-box;
  transition: background-color 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-light);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
</style>
