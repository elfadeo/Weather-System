<template>
  <div class="flex items-center gap-2">
    <Icon :icon="icon" class="h-5 w-5" :class="`text-${color}-500`" />
    <span class="text-text-main">
      {{ label }}: <strong><slot /></strong>
    </span>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, required: true },
  color: { type: String, required: true },
  label: { type: String, required: true },
})
</script>
