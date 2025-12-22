import { ref } from 'vue'
import { callGeminiAPI } from '@/services/geminiService.js'
import { buildPrompt } from '@/utils/promptBuilder.js'

export function useGeminiRecommendations() {
  const recommendations = ref([])
  const isGenerating = ref(false)
  const generationError = ref(null)

  const generateRecommendations = async (data) => {
    isGenerating.value = true
    recommendations.value = []
    generationError.value = null

    try {
      const prompt = buildPrompt(data)
      const rawResponse = await callGeminiAPI(prompt)

      const cleanedResponse = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedResponse)

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Invalid response format: expected an array of recommendations')
      }

      recommendations.value = parsed.slice(0, 3)
    } catch (err) {
      console.error('Error generating recommendations:', err)
      generationError.value = `Failed to generate recommendations: ${err.message}`
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
