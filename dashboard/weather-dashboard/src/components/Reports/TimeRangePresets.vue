<template>
  <div class="bg-surface rounded-2xl shadow-md p-4 sm:p-6 mb-6 ring-1 ring-border">
    <h3 class="text-xs sm:text-sm font-semibold text-text-main mb-3 uppercase tracking-wide">
      Quick Time Range
    </h3>

    <!-- Mobile: Dropdown Select -->
    <div class="block sm:hidden">
      <select
        :value="activePreset"
        @change="$emit('presetSelected', $event.target.value)"
        class="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
      >
        <option v-for="preset in timePresets" :key="preset.value" :value="preset.value">
          {{ preset.label }}
        </option>
      </select>
    </div>

    <!-- Desktop: Button Grid -->
    <div class="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2">
      <button
        v-for="preset in timePresets"
        :key="preset.value"
        @click="$emit('presetSelected', preset.value)"
        :class="[
          'px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 inline-flex items-center justify-center whitespace-nowrap',
          activePreset === preset.value
            ? 'bg-primary text-primary-text shadow-md'
            : 'bg-background hover:bg-hover border border-border text-text-main',
        ]"
      >
        <Icon :icon="preset.icon" class="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
        <span>{{ preset.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useTimePresets } from '@/composables/useTimePresets'

defineProps({
  activePreset: {
    type: String,
    required: true,
  },
})

defineEmits(['presetSelected'])

const { timePresets } = useTimePresets()
</script>
