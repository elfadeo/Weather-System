<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-background font-sans overflow-x-hidden">
    <!-- SIDEBAR -->
    <Sidebar ref="sidebarRef" @update:expanded="isSidebarExpanded = $event" />

    <!-- MAIN AREA -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- HEADER -->
      <header
        class="bg-background/90 backdrop-blur-lg px-3 sm:px-4 md:px-6 h-16 sm:h-20 flex items-center justify-between border-b border-hover z-20"
      >
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Mobile Sidebar Toggle -->
          <button
            @click="toggleMobileSidebar"
            class="lg:hidden p-2 sm:p-3 rounded-lg text-text-light hover:bg-surface active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-primary"
            :aria-label="isSidebarMobileOpen ? 'Close sidebar' : 'Open sidebar'"
          >
            <Icon :icon="sidebarOpenIcon" class="h-6 w-6 sm:h-7 sm:w-7" />
          </button>

          <!-- Icon -->
          <Icon
            icon="ph:cloud-sun-bold"
            class="h-6 w-6 sm:h-7 sm:w-7 text-primary hidden sm:block"
          />

          <!-- Title -->
          <span class="text-base sm:text-lg font-bold text-text-main hidden sm:block">
            Weather Monitoring System
          </span>
        </div>

        <!-- Theme Toggle -->
        <button
          @click="toggleTheme"
          class="p-2 sm:p-3 rounded-full text-text-light hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition"
          :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Icon :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'" class="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      </header>

      <!-- MAIN CONTENT -->
      <main
        class="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-none bg-background"
        role="main"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- FOOTER (always visible, mobile-safe) -->
      <AppFooter class="mt-auto shrink-0" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { Icon } from '@iconify/vue'
import { useTheme } from '@/composables/useTheme.js'

const { isDarkMode, toggleTheme } = useTheme()

const sidebarRef = ref(null)
const isSidebarExpanded = ref(true)

// Mobile sidebar state
const isSidebarMobileOpen = computed(() => {
  return sidebarRef.value?.isMobileOpen?.value ?? false
})

const toggleMobileSidebar = () => {
  sidebarRef.value?.toggleMobile()
}

const sidebarOpenIcon = computed(() => (isSidebarMobileOpen.value ? 'ph:x-bold' : 'ph:list-bold'))
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
