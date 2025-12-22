const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// UPDATED: Use 'gemini-2.5-flash-lite' which is the current free-tier standard
const MODEL_NAME = 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`

export async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY') {
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

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.json()
      const errorMessage = errorBody.error?.message || response.statusText
      // Handle "Limit: 0" specifically to be helpful
      if (errorMessage.includes('limit: 0')) {
        throw new Error(
          'Quota exhausted or Model not available in free tier. Try checking your billing in Google AI Studio.',
        )
      }
      throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]

    // Check for safety blocks
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error('The model refused to answer due to safety concerns.')
    }

    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini API response format: No content generated.')
    }

    return candidate.content.parts[0].text
  } catch (error) {
    console.error('Gemini Request Failed:', error)
    throw error
  }
}
