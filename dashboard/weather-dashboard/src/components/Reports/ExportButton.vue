<template>
  <button @click="$emit('click')" :disabled="isDisabled" :class="buttonClasses">
    <span v-if="isActive" class="flex items-center">
      <Icon icon="ph:circle-notch-bold" class="h-5 w-5 mr-2 animate-spin" />
      Exporting...
    </span>
    <span v-else class="flex items-center">
      <Icon :icon="iconName" class="h-5 w-5 mr-2" />
      {{ buttonText }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['csv', 'pdf'].includes(value),
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const buttonText = computed(() => {
  return props.type === 'csv' ? 'Export CSV' : 'Export PDF'
})

const iconName = computed(() => {
  return props.type === 'csv' ? 'ph:file-csv-bold' : 'ph:file-pdf-bold'
})

const buttonClasses = computed(() => {
  const baseClasses =
    'flex items-center justify-center px-4 py-2 min-w-[140px] rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

  const colorClasses =
    props.type === 'csv'
      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white'
      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'

  return `${baseClasses} ${colorClasses}`
})
</script>
