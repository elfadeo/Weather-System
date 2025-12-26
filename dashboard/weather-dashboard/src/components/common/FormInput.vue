<!-- File: src/components/common/FormInput.vue -->
<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-text-light mb-2">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      :class="[
        'w-full border border-border rounded-lg shadow-sm px-4 py-2.5 transition',
        disabled
          ? 'bg-hover cursor-not-allowed text-text-light'
          : 'bg-background focus:ring-2 focus:ring-primary focus:border-primary text-text-main',
      ]"
    />
    <p v-if="helperText" class="text-xs text-text-light mt-1">{{ helperText }}</p>
  </div>
</template>

<script setup>
// Remove the unused imports
defineProps({
  label: String,
  type: {
    type: String,
    default: 'text',
  },
  modelValue: [String, Number],
  disabled: Boolean,
  placeholder: String,
  helperText: String,
  id: String,
})

defineEmits(['update:modelValue'])
</script>
