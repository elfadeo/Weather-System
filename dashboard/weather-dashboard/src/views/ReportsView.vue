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

// ----------------------------------------------------------------------------
// STATE
// ----------------------------------------------------------------------------
const startDateTime = ref('')
const endDateTime = ref('')
const groupBy = ref('hourly')
const activePreset = ref('last24h')
const isExporting = ref(false)

// ----------------------------------------------------------------------------
// COMPOSABLES
// ----------------------------------------------------------------------------
const { formatDateTimeLocal, timePresets } = useTimePresets()
const { rawReportData, isLoading, loadingProgress, loadingMessage, fetchData, cleanup } =
  useFirebaseData()
const { aggregateData, getFieldValue } = useDataAggregation()
const { exportCSV, exportPDF } = useExport()

// ----------------------------------------------------------------------------
// TIME RANGE HANDLING
// ----------------------------------------------------------------------------

/**
 * Applies a time preset and automatically selects the best grouping.
 * FIXED: Now allows Hourly view for up to 48h, and Daily view for up to 60 days.
 */
const applyTimePreset = (presetValue) => {
  activePreset.value = presetValue
  const now = new Date()
  const preset = timePresets.find((p) => p.value === presetValue)
  if (!preset) return

  endDateTime.value = formatDateTimeLocal(now)
  const start = new Date(now)

  if (preset.hours) {
    start.setHours(now.getHours() - preset.hours)
    // 👇 UPDATED LOGIC:
    // If range is 48 hours or less, use Hourly. Otherwise Daily.
    // This ensures "Last 24h" shows 24 hourly bars.
    groupBy.value = preset.hours <= 48 ? 'hourly' : 'daily'
  } else if (preset.days) {
    start.setDate(now.getDate() - preset.days)
    // 👇 UPDATED LOGIC:
    // If range is 60 days or less, use Daily. Otherwise Weekly.
    // This ensures "Last 30 Days" shows 30 daily bars.
    groupBy.value = preset.days <= 60 ? 'daily' : 'weekly'
  }

  startDateTime.value = formatDateTimeLocal(start)
}

const onCustomRangeSelected = () => {
  activePreset.value = 'custom'
}

// ----------------------------------------------------------------------------
// COMPUTED PROPERTIES
// ----------------------------------------------------------------------------

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
  // Pass the raw data and the unified field getter to the aggregator
  return aggregateData(rawReportData.value, groupBy.value, getFieldValue)
})

// ----------------------------------------------------------------------------
// EXPORT FUNCTIONS
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// LIFECYCLE & WATCHERS
// ----------------------------------------------------------------------------

watch([startDateTime, endDateTime], () => {
  if (startDateTime.value && endDateTime.value) {
    fetchData(startDateTime.value, endDateTime.value)
  }
})

onMounted(() => {
  // Default to Last 24 Hours on load
  applyTimePreset('last24h')
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.reports-page {
  min-height: 100vh;
  background-color: #f8fafc; /* Light gray background for contrast */
}
</style>
