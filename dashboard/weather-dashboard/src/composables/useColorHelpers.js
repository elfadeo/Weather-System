export function useColorHelpers() {
  /**
   * Get color classes for temperature values
   */
  const getTempColor = (temp) => {
    if (temp === 'N/A') {
      return 'bg-background border border-border text-text-light'
    }

    const t = parseFloat(temp)

    if (t >= 35) {
      return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200'
    }
    if (t >= 30) {
      return 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200'
    }
    if (t >= 25) {
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200'
    }
    if (t >= 20) {
      return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200'
    }
    return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
  }

  /**
   * Get color classes for humidity values
   */
  const getHumidityColor = (humidity) => {
    if (humidity === 'N/A') {
      return 'bg-background border border-border text-text-light'
    }

    const h = parseFloat(humidity)

    if (h >= 80) {
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
    }
    if (h >= 60) {
      return 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-200'
    }
    if (h >= 40) {
      return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200'
    }
    return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200'
  }

  /**
   * Get color classes for rainfall values
   */
  const getRainfallColor = (rainfall) => {
    if (rainfall === 'N/A') {
      return 'bg-background border border-border text-text-light'
    }

    const r = parseFloat(rainfall)

    if (r === 0) {
      return 'bg-background border border-border text-text-light'
    }
    if (r < 2.5) {
      return 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-200'
    }
    if (r < 10) {
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
    }
    if (r < 50) {
      return 'bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-100'
    }
    return 'bg-blue-300 dark:bg-blue-700/70 text-blue-900 dark:text-blue-50'
  }

  return {
    getTempColor,
    getHumidityColor,
    getRainfallColor,
  }
}
