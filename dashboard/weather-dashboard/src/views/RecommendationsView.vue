<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Recommendations</h1>
        <p class="text-text-light mt-2">
          Generate actionable insights based on the latest weather data.
        </p>
      </div>

      <!-- Control and Current Data Panel -->
      <div class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 mb-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <!-- Left: Data -->
          <div class="flex-1">
            <h2 class="text-xl font-bold text-text-main">Analysis Input</h2>
            <p class="text-text-light mt-1">
              Using the latest sensor readings to generate insights:
            </p>

            <!-- Current Data Display -->
            <div v-if="isDataLoading" class="mt-4 text-text-light">Fetching latest data...</div>
            <div v-else-if="latestData" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <Icon icon="ph:thermometer-bold" class="h-5 w-5 text-red-500" />
                <span class="text-text-main">
                  Temp: <strong>{{ latestData.temperature?.toFixed(1) || 'N/A' }}°C</strong>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:drop-bold" class="h-5 w-5 text-blue-500" />
                <span class="text-text-main">
                  Humidity: <strong>{{ latestData.humidity?.toFixed(0) || 'N/A' }}%</strong>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:cloud-rain-bold" class="h-5 w-5 text-indigo-500" />
                <span class="text-text-main">
                  Rate: <strong>{{ rainfallRate }} mm/hr</strong>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:chart-line-up-bold" class="h-5 w-5 text-cyan-500" />
                <span class="text-text-main">
                  Total: <strong>{{ totalRainfall }} mm</strong>
                </span>
              </div>
            </div>
            <div v-else class="mt-4 text-red-500">Could not load latest data.</div>
          </div>

          <!-- Right: Button -->
          <button
            @click="handleGenerate"
            :disabled="isGenerating || isDataLoading || !latestData"
            class="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Icon icon="ph:sparkle-bold" class="h-5 w-5 mr-2" />
            {{ isGenerating ? 'Analyzing...' : 'Generate Recommendations' }}
          </button>
        </div>
      </div>

      <!-- Recommendations Display Area -->
      <div>
        <!-- Loading Skeleton -->
        <div v-if="isGenerating" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="n in 3"
            :key="n"
            class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 animate-pulse"
          >
            <div class="flex items-center mb-3">
              <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div class="ml-4 h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-full"></div>
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-5/6"></div>
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-4/6"></div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-else-if="generationError"
          class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg p-6 text-center"
        >
          <Icon icon="ph:warning-circle-bold" class="h-12 w-12 mx-auto mb-3" />
          <h3 class="font-bold text-lg">Analysis Failed</h3>
          <p class="mt-2">{{ generationError }}</p>
          <button
            @click="handleGenerate"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!recommendations.length"
          class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-12 text-center"
        >
          <Icon icon="ph:lightbulb-bold" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-text-main mb-2">No Recommendations Yet</h3>
          <p class="text-text-light mb-6">
            Click "Generate Recommendations" to get AI-powered insights based on current weather
            conditions.
          </p>
        </div>

        <!-- Recommendations List -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(rec, index) in recommendations"
            :key="index"
            class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-3">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                :class="getIconDetails(rec.category).bg"
              >
                <Icon
                  :icon="getIconDetails(rec.category).icon"
                  class="h-6 w-6"
                  :class="getIconDetails(rec.category).text"
                />
              </div>
              <h3 class="ml-4 text-lg font-bold text-text-main">
                {{ rec.category }}
              </h3>
            </div>
            <p class="text-text-light leading-relaxed">
              {{ rec.recommendation }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { rtdb } from '@/firebase.js'
import { query, ref as dbRef, orderByChild, get, startAt } from 'firebase/database'
import { Icon } from '@iconify/vue'
import { useWeatherData } from '@/composables/useWeatherData.js'

// --- CONFIGURATION ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const props = defineProps({
  deviceAddress: { type: String, default: 'Philippines' },
})

const { latestData, isLoading: isDataLoading } = useWeatherData()

// Computed values for correct field names
const rainfallRate = computed(() => {
  return latestData.value?.rainRateEstimated_mm_hr_bucket?.toFixed(2) || 'N/A'
})

const totalRainfall = computed(() => {
  return latestData.value?.rainfall_total_estimated_mm_bucket?.toFixed(2) || 'N/A'
})

const historicalSummary = ref(null)
const recommendations = ref([])
const isGenerating = ref(false)
const generationError = ref(null)

// --- Fetch historical rainfall data (24 hours) ---
const fetchHistoricalData = async () => {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const historicalQuery = query(
      dbRef(rtdb, 'sensor_logs'),
      orderByChild('timestamp'),
      startAt(oneDayAgo),
    )
    const historicalSnapshot = await get(historicalQuery)

    let totalRainfall24h = 0
    let avgTemp = 0
    let avgHumidity = 0
    let count = 0

    if (historicalSnapshot.exists()) {
      const logs = Object.values(historicalSnapshot.val())

      // Get first and last rainfall totals to calculate 24h accumulation
      const rainfallTotals = logs
        .map((log) => log.rainfall_total_estimated_mm_bucket)
        .filter((val) => val != null)

      if (rainfallTotals.length > 0) {
        const sortedTotals = rainfallTotals.sort((a, b) => a - b)
        totalRainfall24h = sortedTotals[sortedTotals.length - 1] - sortedTotals[0]
      }

      // Calculate averages
      logs.forEach((log) => {
        if (log.temperature != null) {
          avgTemp += log.temperature
          count++
        }
        if (log.humidity != null) {
          avgHumidity += log.humidity
        }
      })

      if (count > 0) {
        avgTemp /= count
        avgHumidity /= count
      }
    }

    historicalSummary.value = {
      totalRainfall24h,
      avgTemp24h: avgTemp,
      avgHumidity24h: avgHumidity,
    }

    return true
  } catch (err) {
    console.error('Error fetching historical data:', err)
    generationError.value = 'Could not fetch historical data for analysis.'
    return false
  }
}

// --- Gemini API Call ---
const generateAIAssistantResponse = async (prompt) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY' || !GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
    )
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetails = `API request failed with status ${response.status}.`
    try {
      const errorBody = await response.json()
      console.error('Gemini API Error:', errorBody)
      errorDetails += ` Details: ${errorBody.error?.message || JSON.stringify(errorBody)}`
    } catch {
      errorDetails += ' Could not parse error response.'
    }
    throw new Error(errorDetails)
  }

  const data = await response.json()
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini API response format')
  }
  return data.candidates[0].content.parts[0].text
}

// --- Generate recommendations ---
const handleGenerate = async () => {
  if (!latestData.value) {
    generationError.value = 'Cannot generate insights without current data.'
    return
  }

  isGenerating.value = true
  recommendations.value = []
  generationError.value = null

  const historicalDataFetched = await fetchHistoricalData()
  if (!historicalDataFetched) {
    isGenerating.value = false
    return
  }

  try {
    const currentDate = new Date()
    const month = currentDate.toLocaleString('en-US', { month: 'long' })
    const season = ['June', 'July', 'August', 'September', 'October', 'November'].includes(month)
      ? 'typhoon season'
      : 'dry season'

    const prompt = `
You are a senior agricultural and disaster-preparedness advisor from PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration).

CURRENT SITUATION:
- Location: ${props.deviceAddress}
- Date: ${currentDate.toDateString()}
- Season: ${month} (${season})

CURRENT WEATHER CONDITIONS:
- Temperature: ${latestData.value.temperature?.toFixed(1) || 'N/A'}°C
- Humidity: ${latestData.value.humidity?.toFixed(0) || 'N/A'}%
- Current Rainfall Rate: ${rainfallRate.value} mm/hr
- Cumulative Rainfall: ${totalRainfall.value} mm

24-HOUR HISTORICAL DATA:
- Total Rainfall: ${historicalSummary.value?.totalRainfall24h?.toFixed(1) || 0} mm
- Average Temperature: ${historicalSummary.value?.avgTemp24h?.toFixed(1) || 'N/A'}°C
- Average Humidity: ${historicalSummary.value?.avgHumidity24h?.toFixed(0) || 'N/A'}%

TASK:
Generate exactly THREE actionable recommendations based on the current weather conditions.

CATEGORIES (choose from these):
1. "Crop Management" - Agricultural advice for rice farming
2. "Health & Safety" - Public health and safety guidance
3. "Typhoon Preparedness" - Storm and flood preparation
4. "Irrigation Management" - Water management advice
5. "Disease Prevention" - Crop disease risk and prevention

REQUIREMENTS:
- Each recommendation must be specific, actionable, and evidence-based
- Reference the actual weather data in your reasoning
- Consider both immediate actions and preventive measures
- Be practical for Filipino rice farmers and communities

OUTPUT FORMAT:
Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "category": "Category Name",
    "recommendation": "Detailed recommendation with specific actions to take"
  },
  {
    "category": "Category Name",
    "recommendation": "Detailed recommendation with specific actions to take"
  },
  {
    "category": "Category Name",
    "recommendation": "Detailed recommendation with specific actions to take"
  }
]
`

    const rawResponse = await generateAIAssistantResponse(prompt)

    // Clean response - remove markdown code blocks if present
    const cleanedResponse = rawResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedResponse)

    // Validate response
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid response format: expected an array of recommendations')
    }

    recommendations.value = parsed.slice(0, 3) // Ensure exactly 3 recommendations
  } catch (err) {
    console.error('Error generating recommendations:', err)
    generationError.value = `Failed to generate recommendations: ${err.message}`
  } finally {
    isGenerating.value = false
  }
}

// --- Category Icons ---
const getIconDetails = (category) => {
  const categoryLower = category.toLowerCase()

  if (
    categoryLower.includes('typhoon') ||
    categoryLower.includes('storm') ||
    categoryLower.includes('flood')
  ) {
    return {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-300',
      icon: 'ph:wind-bold',
    }
  }

  if (
    categoryLower.includes('crop') ||
    categoryLower.includes('farming') ||
    categoryLower.includes('irrigation')
  ) {
    return {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-600 dark:text-green-300',
      icon: 'ph:plant-bold',
    }
  }

  if (categoryLower.includes('health') || categoryLower.includes('safety')) {
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-900/40',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: 'ph:first-aid-kit-bold',
    }
  }

  if (categoryLower.includes('disease')) {
    return {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-600 dark:text-red-300',
      icon: 'ph:bug-bold',
    }
  }

  // Default
  return {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
    icon: 'ph:info-bold',
  }
}
</script>
