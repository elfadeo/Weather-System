export function buildPrompt({
  deviceAddress,
  latestData,
  rainfallRate,
  totalRainfall,
  historicalSummary,
}) {
  const currentDate = new Date()

  // --- 1. PRE-CALCULATE RISKS (IRRI & PAGASA Standards) ---
  // Use safe defaults to prevent crashes
  const temp = latestData.temperature || 0
  const humidity = latestData.humidity || 0
  const rain = parseFloat(rainfallRate) || 0

  // Historical context (Safe navigation ?. checks if summary exists)
  const avgTemp24h = historicalSummary?.avgTemp24h ? historicalSummary.avgTemp24h.toFixed(1) : 'N/A'
  const avgHum24h = historicalSummary?.avgHumidity24h
    ? historicalSummary.avgHumidity24h.toFixed(0)
    : 'N/A'

  const activeAlerts = []

  // A. PAGASA Rainfall Alerts (Check highest severity first)
  let rainStatus = 'Normal'
  if (rain >= 30) {
    rainStatus = 'RED WARNING (Torrential)'
    activeAlerts.push(
      'FLOOD WATCH: RED Rainfall Warning (Torrential >30mm/hr). Serious flood risk.',
    )
  } else if (rain >= 15) {
    rainStatus = 'ORANGE WARNING (Intense)'
    activeAlerts.push(
      'FLOOD WATCH: ORANGE Rainfall Warning (Intense >15mm/hr). Prepare for flooding.',
    )
  } else if (rain >= 7.5) {
    rainStatus = 'YELLOW WARNING (Heavy)'
    activeAlerts.push('FLOOD WATCH: YELLOW Rainfall Warning (Heavy >7.5mm/hr). Monitor conditions.')
  }

  // B. IRRI Temperature Thresholds
  if (temp > 35) {
    activeAlerts.push('HEAT STRESS: Critical Temp >35°C detected. Risk of spikelet sterility.')
  }

  // C. IRRI Disease Thresholds
  if (humidity > 90 && temp >= 24 && temp <= 28) {
    activeAlerts.push('DISEASE RISK: High Probability of Rice Blast (High RH + Cool Temp).')
  }
  if (humidity > 85 && temp >= 30 && temp <= 34) {
    activeAlerts.push('DISEASE RISK: High Probability of Bacterial Blight (High RH + Warm Temp).')
  }

  // Define Risk Context string
  const riskContext =
    activeAlerts.length > 0
      ? `CRITICAL ALERTS DETECTED:\n- ${activeAlerts.join('\n- ')}`
      : 'STATUS: Normal conditions. No critical thresholds exceeded.'

  // --- 2. BUILD THE PROMPT ---
  return `
    You are an expert Agricultural Advisor for Rice Farmers in ${deviceAddress || 'Philippines'}.

    CURRENT METRICS:
    - Date: ${currentDate.toDateString()}
    - Rain Rate: ${rain.toFixed(1)} mm/hr [${rainStatus}]
    - Total Rain (24h): ${totalRainfall} mm
    - Temp: ${temp.toFixed(1)}°C (Avg 24h: ${avgTemp24h}°C)
    - Humidity: ${humidity.toFixed(0)}% (Avg 24h: ${avgHum24h}%)

    ${riskContext}

    STRICT INSTRUCTIONS:
    1. If "CRITICAL ALERTS DETECTED" are listed above, you MUST prioritize them as the first recommendations.
    2. If status is "Normal", focus on maintenance (Fertilizer, Weeding, Water Level).
    3. KEEP RECOMMENDATIONS SHORT (Max 20 words each).
    4. CATEGORIES MUST BE ONE OF: "Disease Risk", "Heat Stress", "Irrigation", "Fertilizer", "Flood Watch", "Pest Control".

    OUTPUT FORMAT:
    Return a valid JSON array of objects. Do not include markdown formatting.
    [
      { "category": "Disease Risk", "recommendation": "Monitor leaf tips..." }
    ]
  `
}
