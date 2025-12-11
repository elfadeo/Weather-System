<template>
  <span class="px-2 py-0.5 text-xs font-semibold rounded-full" :class="badgeClass">
    {{ severity.toUpperCase() }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getSeverityBadge } from '@/utils/alertUtils'

const props = defineProps({
  severity: { type: String, required: true },
})

const badgeClass = computed(() => getSeverityBadge(props.severity))
</script>
