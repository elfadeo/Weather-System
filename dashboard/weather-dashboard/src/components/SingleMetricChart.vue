<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  label: {
    type: String,
    default: 'Data'
  },
  suffix: {
    type: String,
    default: ''
  }
})

// Dark mode detection
const isDark = ref(document.documentElement.classList.contains('dark'))
let observer = null

onMounted(() => {
  observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// Processed chart data
const processedData = computed(() => ({
  labels: props.chartData.labels || [],
  datasets: [
    {
      label: props.label,
      data: props.chartData.data || [],
      borderColor: props.color,
      backgroundColor: `${props.color}20`,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: props.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: props.color,
      pointHoverBorderColor: '#fff'
    }
  ]
}))

// Chart options
const chartOptions = computed(() => {
  const textColor = isDark.value ? '#d1d5db' : '#374151'
  const gridColor = isDark.value ? '#374151' : '#e5e7eb'

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `${props.label}: ${value.toFixed(1)}${props.suffix}`
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 0,
          color: textColor,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor,
          drawBorder: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value.toFixed(0)}${props.suffix}`,
          color: textColor,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor,
          drawBorder: false
        }
      }
    }
  }
})
</script>

<template>
  <div class="w-full h-full">
    <Line :data="processedData" :options="chartOptions" />
  </div>
</template>
