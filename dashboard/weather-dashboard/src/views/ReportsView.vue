<template>
  <div class="reports-page p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <PageHeader />

      <TimeRangePresets :active-preset="activePreset" @preset-selected="applyTimePreset" />

      <FilterSection
        v-model:start-date-time="startDateTime"
        v-model:end-date-time="endDateTime"
        v-model:group-by="groupBy"
        :is-loading="isLoading"
        :is-exporting="isExporting"
        :aggregated-data="aggregatedData"
        :raw-data-length="rawReportData.length"
        :data-time-range="dataTimeRange"
        @custom-range="onCustomRangeSelected"
        @export-csv="exportToCSV"
        @export-pdf="exportToPDF"
      />

      <DataTable
        :aggregated-data="aggregatedData"
        :is-loading="isLoading"
        :loading-progress="loadingProgress"
        :loading-message="loadingMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useFirebaseData } from '@/composables/useFirebaseData'
import { useTimePresets } from '@/composables/useTimePresets'
import { useDataAggregation } from '@/composables/useDataAggregation'
import { useExport } from '@/composables/useExport'

import PageHeader from '@/components/Reports/PageHeader.vue'
import TimeRangePresets from '@/components/Reports/TimeRangePresets.vue'
import FilterSection from '@/components/Reports/FilterSection.vue'
import DataTable from '@/components/Reports/DataTable.vue'

// State
const startDateTime = ref('')
const endDateTime = ref('')
const groupBy = ref('hourly')
const activePreset = ref('last24h')
const isExporting = ref(false)

// Composables
const { formatDateTimeLocal, timePresets } = useTimePresets()
const { rawReportData, isLoading, loadingProgress, loadingMessage, fetchData, cleanup } =
  useFirebaseData()
const { aggregateData, getFieldValue } = useDataAggregation()
const { exportCSV, exportPDF } = useExport()

// Time Preset Handling
const applyTimePreset = (presetValue) => {
  activePreset.value = presetValue
  const now = new Date()
  const preset = timePresets.find((p) => p.value === presetValue)
  if (!preset) return

  endDateTime.value = formatDateTimeLocal(now)
  const start = new Date(now)

  if (preset.hours) {
    start.setHours(now.getHours() - preset.hours)
    groupBy.value = preset.hours <= 12 ? 'hourly' : 'daily'
  } else if (preset.days) {
    start.setDate(now.getDate() - preset.days)
    groupBy.value = preset.days <= 7 ? 'daily' : 'weekly'
  }

  startDateTime.value = formatDateTimeLocal(start)
}

const onCustomRangeSelected = () => {
  activePreset.value = 'custom'
}

// Computed Properties
const dataTimeRange = computed(() => {
  if (!rawReportData.value.length) return 'No data'

  const timestamps = rawReportData.value
    .map((r) => (r?.timestamp ? Number(r.timestamp) : NaN))
    .filter((t) => !Number.isNaN(t))

  if (!timestamps.length) return 'No data'

  const earliest = new Date(Math.min(...timestamps))
  const latest = new Date(Math.max(...timestamps))

  const fmt = (d) =>
    d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return `${fmt(earliest)} to ${fmt(latest)}`
})

const aggregatedData = computed(() => {
  return aggregateData(rawReportData.value, groupBy.value, getFieldValue)
})

// Export Functions
const exportToCSV = () => {
  if (!aggregatedData.value.length) return
  isExporting.value = 'csv'

  try {
    exportCSV(aggregatedData.value, groupBy.value)
  } finally {
    setTimeout(() => {
      isExporting.value = false
    }, 300)
  }
}

const exportToPDF = () => {
  if (!aggregatedData.value.length) return
  isExporting.value = 'pdf'

  try {
    exportPDF(aggregatedData.value, groupBy.value, dataTimeRange.value, rawReportData.value.length)
  } finally {
    setTimeout(() => {
      isExporting.value = false
    }, 300)
  }
}

// Watchers
watch([startDateTime, endDateTime], () => {
  fetchData(startDateTime.value, endDateTime.value)
})

// Lifecycle
onMounted(() => {
  applyTimePreset('last24h')
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.reports-page {
  min-height: 100vh;
}
</style>
