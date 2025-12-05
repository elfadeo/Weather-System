<template>
  <div class="w-full h-12 transition-colors duration-300">
    <ApexChart :options="chartOptions" :series="series" type="line" height="48" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Register ApexCharts component
const ApexChart = VueApexCharts

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  color: {
    type: String,
    default: 'var(--color-primary)',
  },
})

// Series
const series = computed(() => [
  {
    name: 'Value',
    data: props.data,
  },
])

// Dark mode reactive state
const isDark = ref(document.documentElement.classList.contains('dark'))

let observer = null
onMounted(() => {
  observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// Chart options (updates when dark mode changes)
const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: 48,
    sparkline: { enabled: true },
    animations: { enabled: true, easing: 'easeinout', speed: 400 },
    background: 'transparent',
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  tooltip: {
    enabled: true,
    theme: isDark.value ? 'dark' : 'light',
    x: { show: false },
    y: {
      formatter: (value) => (value != null ? value.toFixed(1) : ''),
    },
  },
  colors: [props.color],
  dataLabels: { enabled: false },
  markers: {
    size: 0,
    hover: { size: 4 },
  },
  grid: {
    borderColor: isDark.value ? 'var(--color-surface-mute)' : 'var(--color-surface-soft)',
  },
}))
</script>
