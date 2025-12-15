<template>
  <div class="bg-surface rounded-2xl shadow-md p-6 mb-8 ring-1 ring-border">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label for="startDate" class="block text-sm font-medium text-text-main mb-1">
            Start Date & Time
          </label>
          <input
            id="startDate"
            type="datetime-local"
            :value="startDateTime"
            @input="handleStartDateChange"
            :disabled="isDisabled"
            class="border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-main px-3 py-2"
          />
        </div>

        <div>
          <label for="endDate" class="block text-sm font-medium text-text-main mb-1">
            End Date & Time
          </label>
          <input
            id="endDate"
            type="datetime-local"
            :value="endDateTime"
            @input="handleEndDateChange"
            :disabled="isDisabled"
            class="border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-main px-3 py-2"
          />
        </div>

        <div>
          <label for="groupBy" class="block text-sm font-medium text-text-main mb-1">
            Group By
          </label>
          <select
            id="groupBy"
            :value="groupBy"
            @change="$emit('update:groupBy', $event.target.value)"
            :disabled="isDisabled"
            class="border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-main px-3 py-2"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <ExportButton
          type="csv"
          :is-active="isExporting === 'csv'"
          :is-disabled="!aggregatedData.length || Boolean(isExporting) || isLoading"
          @click="$emit('exportCsv')"
        />

        <ExportButton
          type="pdf"
          :is-active="isExporting === 'pdf'"
          :is-disabled="!aggregatedData.length || Boolean(isExporting) || isLoading"
          @click="$emit('exportPdf')"
        />
      </div>
    </div>

    <div v-if="aggregatedData.length" class="mt-4 pt-4 border-t border-border">
      <div class="flex items-center justify-between text-sm">
        <p class="text-text-light">
          <Icon icon="ph:info-bold" class="inline h-4 w-4 mr-1" />
          Showing <strong>{{ aggregatedData.length }}</strong> {{ groupBy }} period(s) •
          <strong>{{ rawDataLength }}</strong> total readings •
          <strong>{{ dataTimeRange }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import ExportButton from './ExportButton.vue'

const props = defineProps({
  startDateTime: {
    type: String,
    required: true,
  },
  endDateTime: {
    type: String,
    required: true,
  },
  groupBy: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isExporting: {
    type: [Boolean, String],
    default: false,
  },
  aggregatedData: {
    type: Array,
    required: true,
  },
  rawDataLength: {
    type: Number,
    required: true,
  },
  dataTimeRange: {
    type: String,
    required: true,
  },
})

const emit = defineEmits([
  'update:startDateTime',
  'update:endDateTime',
  'update:groupBy',
  'customRange',
  'exportCsv',
  'exportPdf',
])

const isDisabled = computed(() => {
  return Boolean(props.isExporting) || props.isLoading
})

const handleStartDateChange = (event) => {
  emit('update:startDateTime', event.target.value)
  emit('customRange')
}

const handleEndDateChange = (event) => {
  emit('update:endDateTime', event.target.value)
  emit('customRange')
}
</script>
