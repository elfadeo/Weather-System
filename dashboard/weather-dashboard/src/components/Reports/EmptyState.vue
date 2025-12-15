<template>
  <div class="p-12 text-center">
    <Icon icon="ph:database-bold" class="h-16 w-16 text-text-light opacity-50 mx-auto mb-4" />
    <p class="text-lg font-medium text-text-main mb-2">No data available</p>
    <p class="text-sm text-text-light">
      Try selecting a different date range or check if your sensors are sending data.
    </p>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
