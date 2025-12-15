<template>
  <div
    class="absolute inset-0 bg-surface/90 backdrop-blur-sm z-10 flex items-center justify-center"
  >
    <div class="text-center">
      <Icon icon="ph:circle-notch-bold" class="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
      <p class="text-text-light">Loading data...</p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
