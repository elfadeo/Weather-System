<!-- File: @/components/common/ToggleSwitch.vue -->
<template>
  <button
    @click="$emit('update:modelValue', !modelValue)"
    :class="modelValue ? 'bg-blue-600' : 'bg-blue-300'"
    class="relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    <span
      :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
      class="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300"
    ></span>
  </button>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
})

defineEmits(['update:modelValue'])
</script>
