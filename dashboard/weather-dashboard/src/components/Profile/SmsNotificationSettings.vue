<template>
  <div
    class="group transition-colors duration-300 hover:bg-hover/40 border border-transparent hover:border-border/30 rounded-xl"
  >
    <div class="flex items-center justify-between p-4 sm:p-5 min-h-[4rem] sm:min-h-[5rem]">
      <div class="flex items-center gap-3 sm:gap-5 mr-4">
        <div
          class="flex-shrink-0 transition-colors duration-300"
          :class="
            enabled
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-text-light group-hover:text-emerald-500'
          "
        >
          <Icon icon="ph:device-mobile" class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div>
          <p class="text-sm font-medium text-text-main leading-none">SMS Notifications</p>
          <p class="text-xs text-text-light mt-1.5 leading-tight">
            {{ phoneNumbers?.length || 0 }} number{{ (phoneNumbers?.length || 0) !== 1 ? 's' : '' }}
            configured
          </p>
        </div>
      </div>

      <button
        @click="$emit('update:enabled', !enabled)"
        :class="enabled ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'"
        class="flex-shrink-0 ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <span class="sr-only">Enable SMS</span>
        <span
          :class="enabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white shadow-sm'"
          class="inline-block h-4 w-4 transform rounded-full transition-transform duration-300"
        />
      </button>
    </div>

    <Transition name="slide-fade">
      <div v-if="enabled" class="pb-5 pl-4 pr-4 sm:pb-6 sm:pl-[4.5rem] sm:pr-6">
        <div class="pl-3 sm:pl-4 border-l-2 border-emerald-500/30 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs font-medium text-text-light uppercase tracking-wider">
              Phone Numbers ({{ phoneNumbers?.length || 0 }}/5)
            </p>
            <button
              @click="$emit('add-number')"
              :disabled="(phoneNumbers?.length || 0) >= 5"
              class="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 py-1"
            >
              <Icon icon="ph:plus-bold" class="w-3 h-3" />
              Add Number
            </button>
          </div>

          <div class="space-y-3">
            <TransitionGroup name="list">
              <PhoneNumberInput
                v-for="(phone, index) in phoneNumbers"
                :key="phone.id || index"
                :number="phone.number"
                :label="phone.label"
                :error="phone.error"
                @update:number="handlePhoneUpdate(index, 'number', $event)"
                @update:label="handlePhoneUpdate(index, 'label', $event)"
                @remove="$emit('remove-number', index)"
                @validate="$emit('validate-number', index)"
              />
            </TransitionGroup>

            <div
              v-if="!phoneNumbers || phoneNumbers.length === 0"
              class="text-center py-6 text-text-light bg-gray-50/50 dark:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-white/10"
            >
              <Icon icon="ph:phone-plus-bold" class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p class="text-sm font-medium">No phone numbers</p>
              <p class="text-xs mt-1 opacity-70">Tap "Add Number" above</p>
            </div>
          </div>

          <p class="text-[10px] sm:text-xs text-text-light opacity-60 leading-relaxed">
            Format: 09171234567 or +639171234567 • Maximum 5 numbers
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import PhoneNumberInput from './PhoneNumberInput.vue'

defineProps({
  enabled: { type: Boolean, default: false },
  phoneNumbers: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:enabled',
  'add-number',
  'remove-number',
  'validate-number',
  'update:phone-field',
])

const handlePhoneUpdate = (index, field, value) => {
  emit('update:phone-field', { index, field, value })
  emit('validate-number', index)
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-bottom: 0;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
