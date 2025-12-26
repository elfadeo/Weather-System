<template>
  <div
    class="bg-surface rounded-lg border border-border p-3 space-y-2 transition-all hover:border-primary/30"
  >
    <div class="flex items-center gap-2">
      <input
        :value="number"
        @input="$emit('update:number', $event.target.value)"
        @blur="$emit('validate')"
        type="tel"
        placeholder="09171234567 or +639171234567"
        class="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
      />
      <button
        @click="$emit('remove')"
        class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        title="Remove number"
      >
        <Icon icon="ph:trash-bold" class="h-4 w-4" />
      </button>
    </div>

    <input
      :value="label"
      @input="$emit('update:label', $event.target.value)"
      type="text"
      placeholder="Label (optional): e.g., 'Farm Manager'"
      class="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
    />

    <p v-if="error" class="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
      <Icon icon="ph:warning-bold" class="h-3 w-3" />
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  number: { type: String, default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
})

defineEmits(['update:number', 'update:label', 'remove', 'validate'])
</script>
