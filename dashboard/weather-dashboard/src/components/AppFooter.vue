<template>
  <footer
    role="contentinfo"
    class="bg-surface text-text-light py-3 xs:py-4 sm:py-6 px-3 xs:px-4 sm:px-6 border-t border-border safe-bottom"
  >
    <div
      class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs sm:text-sm"
    >
      <!-- Copyright -->
      <p class="text-center sm:text-left leading-tight">
        &copy; {{ currentYear }} {{ companyName }}. All Rights Reserved.
      </p>

      <!-- Legal Links -->
      <nav
        class="flex flex-wrap justify-center sm:flex-row items-center gap-2 xs:gap-3 sm:gap-4"
        aria-label="Legal navigation"
      >
        <router-link
          to="/privacy-policy"
          class="hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md px-1.5 py-0.5 transition-colors duration-200 touch-manipulation"
          aria-label="Read our privacy policy"
        >
          Privacy Policy
        </router-link>

        <span class="hidden sm:block text-text-light/50" aria-hidden="true">|</span>

        <router-link
          to="/terms-of-service"
          class="hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md px-1.5 py-0.5 transition-colors duration-200 touch-manipulation"
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

defineProps({
  companyName: {
    type: String,
    default: 'Climate Monitoring',
  },
})

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* Safe Area Support */
.safe-bottom {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
}

@media (min-width: 475px) {
  .safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
  }
}

@media (min-width: 640px) {
  .safe-bottom {
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 1.5rem));
  }
}

/* Touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Link underline animation */
footer a {
  position: relative;
}

footer a::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1.5px;
  background-color: currentColor;
  transition: width 0.25s ease;
}

footer a:hover::after,
footer a:focus::after {
  width: 100%;
}
</style>
