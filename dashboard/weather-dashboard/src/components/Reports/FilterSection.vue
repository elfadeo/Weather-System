<template>
  <div
    class="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:shadow-md mb-8"
  >
    <div class="p-6">
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 w-full xl:w-auto flex-grow max-w-4xl">
          <div class="relative group">
            <label
              for="startDate"
              class="block text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-2 ml-1"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="datetime-local"
              :value="startDateTime"
              @input="handleStartDateChange"
              :disabled="isDisabled"
              class="block w-full rounded-lg border-0 bg-[var(--color-background)] py-2.5 px-4 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder-[var(--color-text-light)]"
            />
          </div>

          <div class="relative group">
            <label
              for="endDate"
              class="block text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-2 ml-1"
            >
              End Date
            </label>
            <input
              id="endDate"
              type="datetime-local"
              :value="endDateTime"
              @input="handleEndDateChange"
              :disabled="isDisabled"
              class="block w-full rounded-lg border-0 bg-[var(--color-background)] py-2.5 px-4 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div class="relative group">
            <label
              for="groupBy"
              class="block text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-2 ml-1"
            >
              Resolution
            </label>
            <div class="relative">
              <select
                id="groupBy"
                :value="groupBy"
                @change="$emit('update:groupBy', $event.target.value)"
                :disabled="isDisabled"
                class="block w-full appearance-none rounded-lg border-0 bg-[var(--color-background)] py-2.5 pl-4 pr-10 text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-border)] focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-light)]"
              >
                <Icon icon="ph:caret-down-bold" class="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex items-center gap-3 border-t xl:border-0 border-[var(--color-border)] pt-4 xl:pt-0"
        >
          <ExportButton
            type="csv"
            :is-active="isExporting === 'csv'"
            :is-disabled="isExportDisabled"
            @click="$emit('exportCsv')"
          />
          <ExportButton
            type="pdf"
            :is-active="isExporting === 'pdf'"
            :is-disabled="isExportDisabled"
            @click="$emit('exportPdf')"
          />
        </div>
      </div>
    </div>

    <div
      v-if="aggregatedData.length"
      class="bg-[var(--color-background)] border-t border-[var(--color-border)] px-6 py-3"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 text-xs font-medium text-[var(--color-text-light)]"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center" title="Aggregated Data Points">
            <Icon icon="ph:chart-bar-duotone" class="h-4 w-4 mr-1.5 text-[var(--color-primary)]" />
            <span class="text-[var(--color-text-main)]">{{ aggregatedData.length }}</span>
            <span class="ml-1">periods</span>
          </span>

          <span class="hidden sm:block opacity-30">|</span>

          <span class="flex items-center" title="Total Raw Readings">
            <Icon icon="ph:database-duotone" class="h-4 w-4 mr-1.5 text-[var(--color-primary)]" />
            <span class="text-[var(--color-text-main)]">{{ rawDataLength.toLocaleString() }}</span>
            <span class="ml-1">readings</span>
          </span>
        </div>

        <div class="flex items-center opacity-80">
          <Icon icon="ph:calendar-blank-duotone" class="h-4 w-4 mr-1.5" />
          {{ dataTimeRange }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import ExportButton from './ExportButton.vue'

const props = defineProps({
  startDateTime: { type: String, required: true },
  endDateTime: { type: String, required: true },
  groupBy: { type: String, required: true },
  isLoading: { type: Boolean, default: false },
  isExporting: { type: [Boolean, String], default: false },
  aggregatedData: { type: Array, required: true },
  rawDataLength: { type: Number, required: true },
  dataTimeRange: { type: String, required: true },
})

const emit = defineEmits([
  'update:startDateTime',
  'update:endDateTime',
  'update:groupBy',
  'customRange',
  'exportCsv',
  'exportPdf',
])

const isDisabled = computed(() => Boolean(props.isExporting) || props.isLoading)
const isExportDisabled = computed(() => !props.aggregatedData.length || isDisabled.value)

const handleStartDateChange = (event) => {
  emit('update:startDateTime', event.target.value)
  emit('customRange')
}

const handleEndDateChange = (event) => {
  emit('update:endDateTime', event.target.value)
  emit('customRange')
}
</script>
