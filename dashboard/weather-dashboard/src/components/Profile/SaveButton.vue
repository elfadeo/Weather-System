<template>
  <div
    class="sticky bottom-2 sm:bottom-4 bg-surface rounded-xl shadow-lg border border-border p-3 sm:p-4 z-10"
  >
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
    >
      <div class="flex-1 w-full sm:w-auto">
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 translate-x-2"
          leave-to-class="opacity-0 translate-x-2"
        >
          <p
            v-if="status"
            class="text-xs sm:text-sm font-medium flex items-center gap-2"
            :class="
              status.includes('Error')
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            "
          >
            <Icon
              :icon="status.includes('Error') ? 'ph:x-circle' : 'ph:check-circle'"
              class="w-4 h-4 flex-shrink-0"
            />
            <span class="truncate">{{ status }}</span>
          </p>
        </Transition>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button
          v-if="hasChanges"
          @click="$emit('discard')"
          :disabled="isSaving"
          class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-text-light hover:text-text-main hover:bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Discard
        </button>

        <button
          @click="$emit('save')"
          :disabled="isSaving || !hasChanges"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Icon v-if="isSaving" icon="ph:circle-notch" class="w-4 h-4 animate-spin flex-shrink-0" />
          <Icon v-else icon="ph:floppy-disk" class="w-4 h-4 flex-shrink-0" />
          <span class="truncate">{{
            isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  hasChanges: Boolean,
  isSaving: Boolean,
  status: String,
})

defineEmits(['save', 'discard'])
</script>
