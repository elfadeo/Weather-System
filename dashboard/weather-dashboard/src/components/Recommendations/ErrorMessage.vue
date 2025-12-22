<template>
  <div
    class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg p-6 text-center"
  >
    <Icon icon="ph:warning-circle-bold" class="h-12 w-12 mx-auto mb-3" />
    <h3 class="font-bold text-lg">Analysis Failed</h3>
    <p class="mt-2">{{ error }}</p>
    <button
      @click="$emit('retry')"
      class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  error: { type: String, required: true },
})

defineEmits(['retry'])
</script>
