<template>
  <button
    @click="$emit('click')"
    :disabled="isDisabled"
    class="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  >
    <Icon icon="ph:sparkle-bold" class="h-5 w-5 mr-2" />
    {{ isGenerating ? 'Analyzing...' : 'Generate Recommendations' }}
  </button>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  isGenerating: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
