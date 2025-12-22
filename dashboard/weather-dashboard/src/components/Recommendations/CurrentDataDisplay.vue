<template>
  <div v-if="isLoading" class="mt-4 text-text-light">Fetching latest data...</div>
  <div v-else-if="data" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    <DataItem icon="ph:thermometer-bold" color="red" label="Temp">
      {{ data.temperature?.toFixed(1) || 'N/A' }}°C
    </DataItem>
    <DataItem icon="ph:drop-bold" color="blue" label="Humidity">
      {{ data.humidity?.toFixed(0) || 'N/A' }}%
    </DataItem>
    <DataItem icon="ph:cloud-rain-bold" color="indigo" label="Rate">
      {{ rainfallRate }} mm/hr
    </DataItem>
    <DataItem icon="ph:chart-line-up-bold" color="cyan" label="Total">
      {{ totalRainfall }} mm
    </DataItem>
  </div>
  <div v-else class="mt-4 text-red-500">Could not load latest data.</div>
</template>

<script setup>
import DataItem from './DataItem.vue'

defineProps({
  isLoading: { type: Boolean, default: false },
  data: { type: Object, default: null },
  rainfallRate: { type: [String, Number], required: true },
  totalRainfall: { type: [String, Number], required: true },
})
</script>
