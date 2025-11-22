<template>
  <div class="flex h-screen bg-background font-sans overflow-hidden">

    <!-- SIDEBAR -->
    <Sidebar ref="sidebarRef" @update:expanded="isSidebarExpanded = $event" />

    <!-- MAIN AREA -->
    <div class="flex-1 flex flex-col relative min-w-0">

      <!-- HEADER -->
      <header
        class="bg-background/80 backdrop-blur-lg px-4 md:px-6 flex items-center justify-between
               h-20 shrink-0 border-b border-hover z-20"
      >
        <div class="flex items-center">
          <!-- Mobile Sidebar Toggle -->
          <button
            @click="toggleMobileSidebar"
            class="lg:hidden p-3 mr-2 rounded-lg text-text-light hover:bg-surface active:scale-95
                   transition focus:outline-none focus:ring-2 focus:ring-primary"
            :aria-label="isSidebarMobileOpen ? 'Close sidebar' : 'Open sidebar'"
            :aria-expanded="isSidebarMobileOpen"
          >
            <Icon :icon="sidebarOpenIcon" class="h-6 w-6" />
          </button>

          <Icon icon="ph:cloud-sun-bold" class="h-7 w-7 text-primary hidden sm:block" aria-hidden="true" />
          <span class="ml-2 text-lg font-bold text-text-main hidden sm:block">
            Weather Monitoring System
          </span>
        </div>

        <div class="flex items-center">
          <button
            @click="toggleTheme"
            class="p-2 rounded-full text-text-light hover:bg-surface focus:outline-none
                   focus:ring-2 focus:ring-primary transition"
            :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <Icon :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'" class="h-6 w-6" />
          </button>
        </div>
      </header>

      <!-- CONTENT -->
      <main class="flex-1 p-6 overflow-y-auto bg-background scroll-smooth overscroll-none" role="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <AppFooter class="shrink-0" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import Sidebar from "@/components/AppSidebar.vue"
import AppFooter from "@/components/AppFooter.vue"
import { Icon } from "@iconify/vue"
import { useTheme } from "@/composables/useTheme.js"

const { isDarkMode, toggleTheme } = useTheme()

const sidebarRef = ref(null)
const isSidebarExpanded = ref(true)

// Track mobile sidebar state
const isSidebarMobileOpen = computed(() => {
  return sidebarRef.value?.isMobileOpen?.value ?? false
})

const toggleMobileSidebar = () => {
  sidebarRef.value?.toggleMobile()
}

const sidebarOpenIcon = computed(() =>
  isSidebarMobileOpen.value ? "ph:x-bold" : "ph:list-bold"
)
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
