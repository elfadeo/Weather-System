<template>
  <span
    class="px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full border transition-colors duration-300"
    :class="badgeConfig"
  >
    {{ severity }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  severity: { type: String, default: 'unknown' },
})

const badgeConfig = computed(() => {
  const s = props.severity.toLowerCase()

  // MAPPING LOGIC:
  // We use the 50/900/200 pattern.
  // Light Mode: Light BG (50), Dark Text (900), Light Border (200)
  // Dark Mode: Dark BG (50), Light Text (900), Dark Border (200) -> AUTOMATIC via your main.css

  if (['critical', 'high', 'severe', 'error'].includes(s)) {
    return 'bg-red-50 text-red-900 border-red-200'
  }

  if (['moderate', 'medium', 'warning', 'orange'].includes(s)) {
    return 'bg-orange-50 text-orange-900 border-orange-200'
  }

  if (['normal', 'low', 'good', 'safe', 'success'].includes(s)) {
    return 'bg-green-50 text-green-900 border-green-200'
  }

  if (['info', 'active'].includes(s)) {
    return 'bg-blue-50 text-blue-900 border-blue-200'
  }

  // Default / Unknown (Gray)
  return 'bg-gray-50 text-gray-900 border-gray-200'
})
</script>
