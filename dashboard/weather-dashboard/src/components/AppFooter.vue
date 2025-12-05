<template>
  <footer
    role="contentinfo"
    class="bg-surface text-text-light py-6 px-6 border-t border-t-gray-200 dark:border-t-gray-700"
  >
    <div
      class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm"
    >
      <!-- Copyright -->
      <p class="text-center sm:text-left">
        &copy; {{ currentYear }} {{ companyName }}. All Rights Reserved.
      </p>

      <!-- Legal Links -->
      <nav class="flex items-center space-x-4" aria-label="Legal navigation">
        <router-link
          to="/privacy-policy"
          class="hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1 transition-colors duration-200"
          aria-label="Read our privacy policy"
        >
          Privacy Policy
        </router-link>

        <span class="text-text-light" aria-hidden="true">|</span>

        <router-link
          to="/terms-of-service"
          class="hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1 transition-colors duration-200"
          aria-label="Read our terms of service"
        >
          Terms of Service
        </router-link>
      </nav>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// Props for flexibility
defineProps({
  companyName: {
    type: String,
    default: 'Weather Monitoring System',
  },
})

// Computed year (calculated once)
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* Optional: Add custom styles if needed */
footer a {
  position: relative;
}

footer a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: currentColor;
  transition: width 0.3s ease;
}

footer a:hover::after,
footer a:focus::after {
  width: 100%;
}
</style>
