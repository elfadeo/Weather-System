import { ref } from 'vue'
import { callGeminiAPI } from '@/services/geminiService.js'
import { buildPrompt } from '@/utils/promptBuilder.js'

export function useGeminiRecommendations() {
  const recommendations = ref([])
  const isGenerating = ref(false)
  const generationError = ref(null)

  const generateRecommendations = async ({
    deviceAddress,
    latestData,
    rainfallRate,
    totalRainfall,
    historicalSummary,
  }) => {
    isGenerating.value = true
    recommendations.value = []
    generationError.value = null

    try {
      // 1. Build the prompt
      const prompt = buildPrompt({
        deviceAddress,
        latestData,
        rainfallRate,
        totalRainfall,
        historicalSummary,
      })

      // 2. Call Gemini
      const rawResponse = await callGeminiAPI(prompt)

      // 3. INTELLIGENT CLEANING (The Fix)
      // This looks for the Array brackets [...] and ignores everything outside them
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/)

      if (!jsonMatch) {
        throw new Error('AI did not return a valid JSON array.')
      }

      // Parse only the matched array part
      const parsed = JSON.parse(jsonMatch[0])

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI returned an empty list.')
      }

      // Limit to 4 cards for UI consistency
      recommendations.value = parsed.slice(0, 4)
    } catch (err) {
      console.error('Error generating recommendations:', err)

      // User-friendly error mapping
      if (err.message.includes('Quota') || err.message.includes('429')) {
        generationError.value = 'Daily AI limit reached. Please try again later.'
      } else if (err.message.includes('JSON')) {
        generationError.value = 'AI response format error. Retrying...'
      } else {
        generationError.value = 'Unable to analyze data. Please check your connection.'
      }
    } finally {
      isGenerating.value = false
    }
  }

  return {
    recommendations,
    isGenerating,
    generationError,
    generateRecommendations,
  }
}
