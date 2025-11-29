<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Skeleton Loader Cards (4 cards to match weather data) -->
    <template v-if="isLoading">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 animate-pulse transition-colors duration-500"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="h-8 w-24 bg-[var(--color-text-light)]/20 rounded-md transition-colors duration-500"
          ></div>
          <div
            class="h-10 w-10 bg-[var(--color-text-light)]/20 rounded-full transition-colors duration-500"
          ></div>
        </div>
        <div
          class="h-12 w-32 bg-[var(--color-text-light)]/20 rounded-md mb-4 transition-colors duration-500"
        ></div>
        <div
          class="h-16 bg-[var(--color-text-light)]/20 rounded-md transition-colors duration-500"
        ></div>
      </div>
    </template>

    <!-- Data Cards -->
    <template v-else>
      <div
        v-for="card in weatherData"
        :key="card.id"
        class="bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 transition-all duration-500 ease-in-out hover:shadow-xl hover:-translate-y-1 flex flex-col"
      >
        <!-- Card Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-[var(--color-text-light)] transition-colors duration-500">
            {{ card.title }}
          </h3>
          <div class="p-2 rounded-full transition-all duration-500" :class="card.bgColor">
            <Icon :icon="card.icon" class="h-6 w-6" :class="card.color" />
          </div>
        </div>

        <!-- Main Value -->
        <div class="mb-4">
          <span
            class="text-4xl font-bold text-[var(--color-text-main)] transition-colors duration-500"
          >
            {{ card.value }}
          </span>
          <span
            class="text-xl font-medium text-[var(--color-text-light)] ml-1 transition-colors duration-500"
          >
            {{ card.unit }}
          </span>
        </div>

        <!-- Sparkline (takes remaining space) -->
        <div class="flex-grow flex items-end">
          <Sparkline :data="getSparklineData(card.id) || []" :color-class="card.color" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, onValue, off, query, limitToLast } from 'firebase/database'
import Sparkline from './SparklineChart.vue'

defineProps({
  weatherData: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// Store historical sensor values for sparkline charts
// IMPORTANT: Keys must match card IDs from Dashboard.vue
const historicalData = ref({
  temp: [],
  humidity: [],
  rainfall_rate: [],
  total_rainfall: [],
})

let historyRef = null

// Fetch the last 20 sensor logs
onMounted(() => {
  historyRef = query(dbRef(rtdb, 'sensor_logs'), limitToLast(20))

  onValue(historyRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const records = Object.values(data)

      // Map to the correct field names from your ESP32
      historicalData.value.temp = records.map((r) => r.temperature ?? 0)
      historicalData.value.humidity = records.map((r) => r.humidity ?? 0)
      historicalData.value.rainfall_rate = records.map((r) => r.rainRateEstimated_mm_hr_bucket ?? 0)
      historicalData.value.total_rainfall = records.map((r) => r.rainfall_total_estimated_mm_bucket ?? 0)
    }
  })
})

// Clean up the Firebase listener when component unmounts
onUnmounted(() => {
  if (historyRef) off(historyRef)
})

// Function to get sparkline data based on card ID
// Card IDs: 'temp', 'humidity', 'rainfall_rate', 'total_rainfall'
const getSparklineData = (cardId) => {
  return historicalData.value[cardId] || []
}
</script>
