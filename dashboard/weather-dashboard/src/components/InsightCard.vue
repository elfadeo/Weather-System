<template>
  <div
    class="bg-surface rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md"
    role="region"
    aria-label="Smart weather insights"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold text-text-main">Smart Insights</h3>
        <p class="text-xs text-text-light">Data-driven weather analysis</p>
      </div>
      <div class="flex items-center space-x-2">
        <Icon
          icon="ph:arrow-clockwise-bold"
          class="h-5 w-5 text-text-light cursor-pointer hover:text-primary transition-colors"
          :class="{ 'animate-spin': isSummaryLoading }"
          @click="refreshInsights"
          title="Refresh insights"
          aria-label="Refresh insights"
        />
        <Icon icon="ph:lightbulb-bold" class="h-6 w-6 text-amber-500" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isSummaryLoading" class="text-text-light">
      <div class="animate-pulse space-y-3">
        <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div v-for="i in 3" :key="i" class="flex justify-between items-center">
          <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="summaryData?.error" class="flex items-center space-x-3 text-red-500">
      <Icon icon="ph:warning-circle-bold" class="h-8 w-8" />
      <div>
        <p class="font-semibold">Unable to load insights</p>
        <p class="text-sm">{{ summaryData.error }}</p>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="summaryData" class="space-y-4">

      <!-- Current Condition Status Card -->
      <div
        class="p-4 rounded-lg border transition-colors"
        :class="conditionStyles.bgClass"
      >
        <div class="flex items-start space-x-3">
          <Icon
            :icon="conditionStyles.icon"
            class="h-10 w-10 flex-shrink-0"
            :class="conditionStyles.iconClass"
          />
          <div class="flex-1">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold" :class="conditionStyles.textClass">
                {{ conditionTitle }}
              </h4>
              <span
                class="px-2 py-1 rounded-full text-xs font-semibold"
                :class="conditionStyles.badgeClass"
              >
                {{ insightType }}
              </span>
            </div>
            <p class="text-sm leading-relaxed" :class="conditionStyles.textClass">
              {{ summaryData.message || 'Analyzing current conditions...' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Pattern Detection (if available) -->
      <div
        v-if="summaryData.pattern"
        class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div class="flex items-start space-x-2">
          <Icon icon="ph:trend-up-bold" class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-blue-900 dark:text-blue-100 font-medium">Pattern Detected</p>
            <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">{{ summaryData.pattern }}</p>
          </div>
        </div>
      </div>

      <!-- 24-Hour Summary Metrics -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-semibold text-text-light uppercase tracking-wide">
            24-Hour Summary
          </h5>
          <span class="text-xs text-gray-400">{{ dataPointsCount }} readings</span>
        </div>

        <div
          v-for="(value, key) in summaryData.details"
          :key="key"
          class="flex justify-between items-center text-sm py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <span class="text-text-light flex items-center space-x-2">
            <Icon :icon="getMetricIcon(key)" class="h-4 w-4" />
            <span>{{ key }}</span>
          </span>
          <span class="font-semibold text-text-main">{{ value || 'N/A' }}</span>
        </div>
      </div>

      <!-- Recommendation (if available) -->
      <div
        v-if="summaryData.recommendation"
        class="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
      >
        <div class="flex items-start space-x-2">
          <Icon icon="ph:info-bold" class="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-purple-900 dark:text-purple-100 font-medium">Suggestion</p>
            <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">{{ summaryData.recommendation }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <p class="text-xs text-gray-400">
          Updated {{ formattedTimestamp }}
        </p>
        <div class="flex items-center space-x-1 text-xs text-gray-400">
          <Icon icon="ph:database-bold" class="h-3 w-3" />
          <span>Sensor Data</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center text-text-light py-8">
      <Icon icon="ph:chart-line-up-bold" class="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <p class="text-sm font-semibold mb-1">Collecting data...</p>
      <p class="text-xs text-gray-400">Insights will appear soon</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeatherData } from '@/composables/useWeatherData'
import { Icon } from '@iconify/vue'

const { summaryData, isSummaryLoading, fetchSummaryData } = useWeatherData()

// Refresh function
const refreshInsights = () => {
  if (!isSummaryLoading.value && fetchSummaryData) {
    fetchSummaryData()
  }
}

// Insight type label
const insightType = computed(() => {
  const type = summaryData.value?.type?.toLowerCase()

  const labels = {
    'alert': 'Alert',
    'warning': 'Warning',
    'observation': 'Observation',
    'normal': 'Normal',
    'favorable': 'Favorable'
  }

  return labels[type] || 'Analysis'
})

// Condition title based on type
const conditionTitle = computed(() => {
  const type = summaryData.value?.type?.toLowerCase()

  const titles = {
    'alert': 'Adverse Conditions Detected',
    'warning': 'Unusual Weather Pattern',
    'observation': 'Notable Conditions',
    'normal': 'Normal Weather Conditions',
    'favorable': 'Favorable Weather'
  }

  return titles[type] || 'Weather Analysis'
})

// Data points count (if available)
const dataPointsCount = computed(() => {
  return summaryData.value?.dataPoints || '24h'
})

// Dynamic styling based on condition type
const conditionStyles = computed(() => {
  const type = summaryData.value?.type?.toLowerCase()

  const styles = {
    'alert': {
      bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textClass: 'text-red-900 dark:text-red-100',
      iconClass: 'text-red-600 dark:text-red-400',
      badgeClass: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200',
      icon: 'ph:warning-circle-bold'
    },
    'warning': {
      bgClass: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      textClass: 'text-orange-900 dark:text-orange-100',
      iconClass: 'text-orange-600 dark:text-orange-400',
      badgeClass: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200',
      icon: 'ph:warning-bold'
    },
    'observation': {
      bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-900 dark:text-blue-100',
      iconClass: 'text-blue-600 dark:text-blue-400',
      badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',
      icon: 'ph:eye-bold'
    },
    'normal': {
      bgClass: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
      textClass: 'text-gray-900 dark:text-gray-100',
      iconClass: 'text-gray-600 dark:text-gray-400',
      badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
      icon: 'ph:check-circle-bold'
    },
    'favorable': {
      bgClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textClass: 'text-green-900 dark:text-green-100',
      iconClass: 'text-green-600 dark:text-green-400',
      badgeClass: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200',
      icon: 'ph:sun-bold'
    }
  }

  return styles[type] || styles['observation']
})

// Get icon for each metric
const getMetricIcon = (key) => {
  const iconMap = {
    'Avg Temp': 'ph:thermometer-simple-bold',
    'Avg Humidity': 'ph:drop-bold',
    'Total Rainfall': 'ph:cloud-rain-bold',
    'Temp Range': 'ph:arrows-out-simple-bold',
    'Wind Speed': 'ph:wind-bold',
    'Pressure': 'ph:gauge-bold',
    'Max Temp': 'ph:thermometer-hot-bold',
    'Min Temp': 'ph:thermometer-cold-bold'
  }

  return iconMap[key] || 'ph:chart-line-bold'
}

// Format timestamp
const formattedTimestamp = computed(() => {
  if (!summaryData.value?.updatedAt) return 'never'

  const now = Date.now()
  const diffSeconds = Math.round((now - summaryData.value.updatedAt) / 1000)

  if (diffSeconds < 2) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`

  return new Date(summaryData.value.updatedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>
