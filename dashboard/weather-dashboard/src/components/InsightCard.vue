<template>
  <div
    class="bg-surface rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-md"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="text-text-light">
      <div class="animate-pulse flex flex-col items-center">
        <div class="h-10 w-10 bg-gray-200 rounded-full mb-4"></div>
        <div class="h-4 w-32 bg-gray-200 rounded mb-2"></div>
        <div class="h-3 w-24 bg-gray-100 rounded"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center space-x-4 text-red-500">
      <Icon icon="ph:warning-circle-bold" class="h-10 w-10" />
      <div>
        <h3 class="text-lg font-bold text-text-main">Error</h3>
        <p class="text-text-light">{{ error || 'Something went wrong.' }}</p>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="insight" class="flex flex-col items-center space-y-4">
      <div class="flex items-center space-x-4">
        <Icon :icon="insightIcon" class="h-10 w-10" :class="insightColor" />
        <div class="text-left">
          <h3 class="text-lg font-bold text-text-main">Predictive Insights</h3>
          <p class="text-text-light">{{ insight.message }}</p>
          <div class="flex items-center space-x-2 mt-1">
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="[insightColor, 'bg-opacity-10']"
            >
              {{ insight.likelihood.toUpperCase() }}
            </span>
            <span
              v-if="insight.confidence"
              class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
            >
              {{ getConfidenceLabel(insight.confidence) }}
            </span>
          </div>
          <p v-if="insight.updatedAt" class="text-xs text-gray-400 mt-1">
            Updated: {{ formattedTimestamp }}
          </p>
        </div>
      </div>
      <div v-if="insight.details" class="w-full mt-4 pt-4 border-t border-gray-100">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div v-for="(value, key) in insight.details" :key="key" class="text-left">
            <span class="text-gray-500">{{ key }}:</span>
            <span class="ml-1 font-medium text-text-main">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-text-light">
      <Icon icon="ph:info-bold" class="h-10 w-10 text-gray-400 mb-2" />
      <p>Prediction data is not available yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, onValue } from 'firebase/database'
import { Icon } from '@iconify/vue'

// Constants
const LIKELIHOOD = {
  VERY_HIGH: 'very_high',
  HIGH: 'high',
  MODERATE: 'moderate',
  LOW: 'low',
  VERY_LOW: 'very_low',
  DEFAULT: 'default',
}

const ICONS = {
  [LIKELIHOOD.VERY_HIGH]: 'ph:cloud-lightning-bold',
  [LIKELIHOOD.HIGH]: 'ph:cloud-rain-bold',
  [LIKELIHOOD.MODERATE]: 'ph:cloud-bold',
  [LIKELIHOOD.LOW]: 'ph:sun-dim-bold',
  [LIKELIHOOD.VERY_LOW]: 'ph:sun-bold',
  [LIKELIHOOD.DEFAULT]: 'ph:question-bold',
}

const COLORS = {
  [LIKELIHOOD.VERY_HIGH]: 'text-purple-500',
  [LIKELIHOOD.HIGH]: 'text-blue-500',
  [LIKELIHOOD.MODERATE]: 'text-yellow-500',
  [LIKELIHOOD.LOW]: 'text-orange-500',
  [LIKELIHOOD.VERY_LOW]: 'text-red-500',
  [LIKELIHOOD.DEFAULT]: 'text-gray-400',
}

// State
const insight = ref(null)
const isLoading = ref(true)
const error = ref(null)

// Helper Functions
const getConfidenceLabel = (confidence) => {
  if (confidence >= 0.9) return 'Very High Confidence'
  if (confidence >= 0.7) return 'High Confidence'
  if (confidence >= 0.5) return 'Moderate Confidence'
  if (confidence >= 0.3) return 'Low Confidence'
  return 'Very Low Confidence'
}

const processInsightData = (data) => {
  // Normalize likelihood (handle uppercase, camelCase, etc.)
  const likelihood = data.likelihood?.toString().toLowerCase() || LIKELIHOOD.DEFAULT
  const validLikelihoods = Object.values(LIKELIHOOD)

  return {
    likelihood: validLikelihoods.includes(likelihood) ? likelihood : LIKELIHOOD.DEFAULT,
    message: data.message || 'No prediction available',
    confidence:
      typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1
        ? data.confidence
        : null,
    details: data.details || null,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  }
}

// Computed Properties
const formattedTimestamp = computed(() => {
  if (!insight.value?.updatedAt) return ''

  const now = Date.now()
  const diffSeconds = Math.round((now - insight.value.updatedAt) / 1000)

  if (diffSeconds < 2) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`

  return new Date(insight.value.updatedAt).toLocaleDateString()
})

const insightIcon = computed(() => ICONS[insight.value?.likelihood] || ICONS[LIKELIHOOD.DEFAULT])

const insightColor = computed(() => COLORS[insight.value?.likelihood] || COLORS[LIKELIHOOD.DEFAULT])

// Firebase Integration
let unsubscribe = () => {}

onMounted(() => {
  const insightRef = dbRef(rtdb, 'insights/daily_prediction')

  unsubscribe = onValue(
    insightRef,
    (snapshot) => {
      try {
        if (snapshot.exists()) {
          const rawData = snapshot.val()
          insight.value = processInsightData(rawData)
          error.value = null
        } else {
          insight.value = null
        }
      } catch (err) {
        console.error('Error processing insight data:', err)
        error.value = 'Invalid prediction data received.'
        insight.value = null
      } finally {
        isLoading.value = false
      }
    },
    (err) => {
      console.error('Error fetching insight:', err)
      error.value = 'Failed to load prediction data.'
      insight.value = null
      isLoading.value = false
    },
  )
})

onUnmounted(() => {
  unsubscribe()
})
</script>
