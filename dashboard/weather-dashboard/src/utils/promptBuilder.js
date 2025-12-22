export function buildPrompt({
  deviceAddress,
  latestData,
  rainfallRate,
  totalRainfall,
  historicalSummary,
}) {
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' })

  // --- 1. PRE-CALCULATE RISKS ---
  const temp = latestData.temperature || 0
  const humidity = latestData.humidity || 0
  const rain = rainfallRate || 0

  // Extract historical data (Fixes the "unused var" error)
  const avgTemp24h = historicalSummary?.avgTemp24h ? historicalSummary.avgTemp24h.toFixed(1) : 'N/A'
  const avgHum24h = historicalSummary?.avgHumidity24h
    ? historicalSummary.avgHumidity24h.toFixed(0)
    : 'N/A'

  const activeAlerts = []

  // A. PAGASA Rainfall Alerts
  let rainStatus = 'Normal'
  if (rain >= 30) {
    rainStatus = 'RED WARNING (Torrential)'
    activeAlerts.push('CRITICAL: EVACUATION ALERT (Red Rainfall Warning)')
  } else if (rain >= 15) {
    rainStatus = 'ORANGE WARNING (Intense)'
    activeAlerts.push('ALERT: Prepare for possible flooding (Orange Rainfall Warning)')
  } else if (rain >= 7.5) {
    rainStatus = 'YELLOW WARNING (Heavy)'
    activeAlerts.push('MONITOR: Flood risk designated (Yellow Rainfall Warning)')
  }

  // B. IRRI Temperature Thresholds
  if (temp > 35) {
    activeAlerts.push('CROP STRESS: Heat Stress Detected (>35°C). High risk of spikelet sterility.')
  }

  // C. IRRI Disease Thresholds
  if (humidity > 90 && temp >= 24 && temp <= 28) {
    activeAlerts.push('DISEASE RISK: High Probability of Rice Blast (High RH + Cool Temp).')
  }
  if (humidity > 85 && temp >= 30 && temp <= 34) {
    activeAlerts.push('DISEASE RISK: High Probability of Bacterial Blight (High RH + Warm Temp).')
  }

  const riskContext =
    activeAlerts.length > 0
      ? activeAlerts.join('\n- ')
      : 'Conditions are within normal ranges. Focus on routine maintenance.'

  // --- 2. BUILD THE PROMPT ---
  return `
You are an expert Agricultural Advisor and Disaster Risk specialist for Rice Farmers in Brgy. Angayen, Balo-i, Lanao del Norte.
Use the following OFFICIAL IRRI and PAGASA thresholds to generate advice.

CURRENT SENSOR DATA:
- Location: ${deviceAddress}
- Date: ${currentDate.toDateString()} (${currentMonth})
- Rainfall Rate: ${rain} mm/hr [Status: ${rainStatus}]
- Cumulative Rain (24h): ${totalRainfall} mm
- Temperature: ${temp.toFixed(1)}°C
- Humidity: ${humidity.toFixed(0)}%

24-HOUR TRENDS:
- Avg Temperature: ${avgTemp24h}°C
- Avg Humidity: ${avgHum24h}%

DETECTED RISK EVENTS (Must Address):
- ${riskContext}

SCIENTIFIC REFERENCE TABLE:
1. Heat Stress: >35°C (Causes spikelet sterility)
2. Rice Blast: >90% RH AND 24-28°C
3. Bacterial Blight: >85% RH AND 30-34°C
4. PAGASA Alerts: Yellow (7.5+), Orange (15+), Red (30+)

TASK:
Generate exactly THREE (3) recommendations.
IF any "DETECTED RISK EVENTS" are listed above, you MUST prioritize them.

OUTPUT FORMAT (JSON ARRAY ONLY):
[
  {
    "category": "Category Name",
    "recommendation": "Actionable advice."
  }
]
`
}
