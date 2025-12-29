<template>
  <div
    class="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] p-4 sm:p-6 mb-6 sm:mb-8"
  >
    <h3
      class="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-3 sm:mb-4"
    >
      Quick Range
    </h3>

    <div class="block sm:hidden relative">
      <select
        :value="activePreset"
        @change="$emit('presetSelected', $event.target.value)"
        class="appearance-none w-full rounded-lg border-0 bg-[var(--color-background)] py-2.5 pl-4 pr-10 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] text-sm font-medium transition-all duration-200"
      >
        <option v-for="preset in timePresets" :key="preset.value" :value="preset.value">
          {{ preset.label }}
        </option>
      </select>

      <div
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-light)]"
      >
        <Icon icon="ph:caret-down-bold" class="h-4 w-4" />
      </div>
    </div>

    <div class="hidden sm:flex flex-wrap gap-2 sm:gap-3">
      <button
        v-for="preset in timePresets"
        :key="preset.value"
        @click="$emit('presetSelected', preset.value)"
        class="group relative inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 select-none ring-1 ring-inset"
        :class="[
          activePreset === preset.value
            ? 'bg-[var(--color-primary)] ring-[var(--color-primary)] text-[var(--color-primary-text)] shadow-sm'
            : 'bg-[var(--color-background)] ring-[var(--color-border)] text-[var(--color-text-main)] hover:ring-[var(--color-text-light)] hover:bg-[var(--color-hover)]',
        ]"
      >
        <Icon
          :icon="preset.icon"
          class="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 transition-opacity duration-200 flex-shrink-0"
          :class="
            activePreset === preset.value ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
          "
        />
        <span class="whitespace-nowrap">{{ preset.label }}</span>
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
