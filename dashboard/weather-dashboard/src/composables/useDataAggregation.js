export function useDataAggregation() {
  /**
   * Get field value from record, trying multiple field names
   */
  const getFieldValue = (record, ...fields) => {
    if (!record || !fields?.length) return null

    for (const fieldName of fields) {
      if (!fieldName) continue
      const value = record[fieldName]
      if (value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value))) {
        return Number(value)
      }
    }
    return null
  }

  /**
   * Get grouping key and label for a record
   */
  const getGroupKey = (record, period) => {
    if (!record?.timestamp) return null

    const date = new Date(Number(record.timestamp))
    if (Number.isNaN(date.getTime())) return null

    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const hour = date.getHours()

    switch (period) {
      case 'hourly':
        return {
          key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(hour).padStart(2, '0')}`,
          label: date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
        }

      case 'daily':
        return {
          key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          label: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        }

      case 'weekly': {
        const tmp = new Date(date)
        const dayOfWeek = tmp.getDay()
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        tmp.setDate(tmp.getDate() - daysSinceMonday)
        tmp.setHours(0, 0, 0, 0)

        const startOfWeek = tmp
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        const localIso = (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        return {
          key: localIso(startOfWeek),
          label: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        }
      }

      case 'monthly':
        return {
          key: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        }

      case 'yearly':
        return {
          key: `${year}-01-01`,
          label: `Year ${year}`,
        }

      default:
        return null
    }
  }

  /**
   * Calculate period rainfall from readings
   */
  const calculatePeriodRainfall = (rainfallReadings, groupByValue) => {
    if (!rainfallReadings.length) return 0

    const sorted = rainfallReadings.sort((a, b) => a.timestamp - b.timestamp)

    if (groupByValue === 'hourly') {
      const hourlyValues = sorted.map((r) => r.hourly).filter((v) => v > 0)

      if (hourlyValues.length > 0) {
        const firstValue = hourlyValues[0]
        // ✅ FIXED: Used 'hourlyValues.length' instead of 'lastValue.length'
        const lastValue = hourlyValues[hourlyValues.length - 1]

        if (lastValue >= firstValue) {
          return lastValue - firstValue
        } else {
          return lastValue
        }
      }
      return 0
    }

    // For daily, weekly, monthly, yearly
    const firstDaily = sorted[0].daily
    const lastDaily = sorted[sorted.length - 1].daily

    if (lastDaily >= firstDaily) {
      return lastDaily - firstDaily
    }

    // Handle counter reset - sum hourly readings
    const hourlyMap = new Map()

    sorted.forEach((reading) => {
      const date = new Date(reading.timestamp)
      const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`

      const current = hourlyMap.get(hourKey)
      if (
        !current ||
        reading.hourly > current.hourly ||
        (reading.hourly === current.hourly && reading.timestamp > current.timestamp)
      ) {
        hourlyMap.set(hourKey, reading)
      }
    })

    return Array.from(hourlyMap.values()).reduce((sum, reading) => sum + reading.hourly, 0)
  }

  /**
   * Check if record is pre-aggregated data
   */
  const isAggregatedRecord = (record) => {
    return record.aggregation_type === 'daily' || record.aggregation_type === 'hourly'
  }

  /**
   * Handle pre-aggregated data and correctly calculate Rain Rate
   */
  const aggregatePreAggregatedData = (rawData, groupByValue) => {
    const result = []
    const groups = new Map()

    rawData.forEach((record) => {
      const groupResult = getGroupKey(record, groupByValue)
      if (!groupResult) return

      const { key, label } = groupResult

      if (!groups.has(key)) {
        groups.set(key, {
          label,
          tempSum: 0,
          tempCount: 0,
          humiditySum: 0,
          humidityCount: 0,
          rainfallSum: 0,
          rainfallCount: 0,
          rainRateSum: 0,
          rainRateCount: 0,
          recordCount: 0,
        })
      }

      const group = groups.get(key)

      // Temperature
      const temp = getFieldValue(record, 'temperature', 'avgTemperature')
      if (temp !== null) {
        group.tempSum += temp
        group.tempCount++
      }

      // Humidity
      const hum = getFieldValue(record, 'humidity', 'avgHumidity')
      if (hum !== null) {
        group.humiditySum += hum
        group.humidityCount++
      }

      // Total Rainfall
      const rain = getFieldValue(record, 'totalRainfall', 'rainfall_hourly_mm')
      if (rain !== null) {
        group.rainfallSum += rain
        group.rainfallCount++
      }

      // Rain Rate
      const rate = getFieldValue(record, 'avgRainRate', 'rainRate')
      if (rate !== null) {
        group.rainRateSum += rate
        group.rainRateCount++
      }

      group.recordCount++
    })

    // Build result
    for (const [key, group] of groups) {
      result.push({
        period: group.label,
        temperature: group.tempCount > 0 ? (group.tempSum / group.tempCount).toFixed(1) : 'N/A',
        humidity:
          group.humidityCount > 0 ? (group.humiditySum / group.humidityCount).toFixed(0) : 'N/A',

        rainfallRate:
          group.rainRateCount > 0 ? (group.rainRateSum / group.rainRateCount).toFixed(1) : 'N/A',

        periodRainfall:
          group.rainfallCount > 0 ? (group.rainfallSum / group.rainfallCount).toFixed(2) : 'N/A',
        count: group.recordCount,
        sortKey: key,
      })
    }

    return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }

  /**
   * Aggregate raw data into periods
   */
  const aggregateData = (rawData, groupByValue, getFieldValueFn) => {
    if (!rawData.length) return []

    // Check if we're dealing with pre-aggregated data
    const firstRecord = rawData[0]
    if (isAggregatedRecord(firstRecord)) {
      console.log(
        `📊 Detected ${firstRecord.aggregation_type} pre-aggregated data, using optimized grouping`,
      )
      return aggregatePreAggregatedData(rawData, groupByValue)
    }

    // Original logic for raw sensor data
    const groups = new Map()

    // Group data
    rawData.forEach((record) => {
      const result = getGroupKey(record, groupByValue)
      if (!result) return

      const { key, label } = result

      if (!groups.has(key)) {
        groups.set(key, {
          label,
          tempSum: 0,
          tempCount: 0,
          humiditySum: 0,
          humidityCount: 0,
          rainfallRateSum: 0,
          rainfallRateCount: 0,
          rainfallReadings: [],
          recordCount: 0,
        })
      }

      const group = groups.get(key)

      // Temperature
      const temp = getFieldValueFn(record, 'temperature', 'temp')
      if (temp !== null) {
        group.tempSum += temp
        group.tempCount++
      }

      // Humidity
      const hum = getFieldValueFn(record, 'humidity', 'hum')
      if (hum !== null) {
        group.humiditySum += hum
        group.humidityCount++
      }

      // Rain rate
      const rainRate = getFieldValueFn(
        record,
        'rainRateEstimated_mm_hr_bucket',
        'rainRate_mm_hr',
        'rainRate_mm',
      )
      if (rainRate !== null) {
        group.rainfallRateSum += rainRate
        group.rainfallRateCount++
      }

      // Rainfall readings
      const timestamp = Number(record.timestamp)
      const hourlyMm = getFieldValueFn(
        record,
        'rainfall_hourly_mm',
        'rainfall_hourly',
        'rain_mm_hour',
      )
      const dailyMm = getFieldValueFn(
        record,
        'rainfall_daily_mm',
        'rainfall_total_estimated_mm_bucket',
        'rainfall_cumulative_mm',
      )

      if (!Number.isNaN(timestamp)) {
        group.rainfallReadings.push({
          timestamp,
          hourly: hourlyMm !== null ? hourlyMm : 0,
          daily: dailyMm !== null ? dailyMm : 0,
        })
      }

      group.recordCount++
    })

    // Build result
    const result = []

    for (const [key, group] of groups) {
      const periodRainfall = Math.max(
        0,
        calculatePeriodRainfall(group.rainfallReadings, groupByValue),
      )

      result.push({
        period: group.label,
        temperature: group.tempCount > 0 ? (group.tempSum / group.tempCount).toFixed(1) : 'N/A',
        humidity:
          group.humidityCount > 0 ? (group.humiditySum / group.humidityCount).toFixed(0) : 'N/A',
        rainfallRate:
          group.rainfallRateCount > 0
            ? (group.rainfallRateSum / group.rainfallRateCount).toFixed(2)
            : 'N/A',
        periodRainfall: periodRainfall.toFixed(2),
        count: group.recordCount,
        sortKey: key,
      })
    }

    return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }

  return {
    getFieldValue,
    aggregateData,
    isAggregatedRecord,
  }
}
