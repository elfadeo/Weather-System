// utils/alertUtils.js

/**
 * Get alert styling configuration based on severity and status
 */
export function getAlertStyle(alert) {
  const severity = alert.severity?.toLowerCase()
  const status = alert.status?.toLowerCase()

  // Multi-alert handling
  if (alert.alerts?.length > 0) {
    const hasCritical = alert.alerts.some((a) => a.severity === 'critical')
    return {
      bg: hasCritical ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30',
      text: hasCritical ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400',
      icon: hasCritical ? 'ph:warning-octagon-bold' : 'ph:warning-bold',
      title: hasCritical
        ? 'Multiple Critical Alerts'
        : `${alert.alertCount || alert.alerts.length} Alerts Triggered`,
    }
  }

  // Single alert severity levels
  const severityMap = {
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'ph:fire-bold',
      title: 'Critical Alert',
    },
    warning: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'ph:warning-bold',
      title: 'Warning',
    },
  }

  if (severityMap[severity]) {
    return severityMap[severity]
  }

  // Status-based styling
  if (status === 'normal') {
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      icon: 'ph:check-circle-bold',
      title: 'System Check',
    }
  }

  // Default
  return {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'ph:bell-bold',
    title: 'Alert Notification',
  }
}

/**
 * Get CSS classes for severity badges
 */
export function getSeverityBadge(severity) {
  const severityMap = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    warning: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    advisory: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  }
  return (
    severityMap[severity?.toLowerCase()] || 'bg-background border border-border text-text-light'
  )
}

/**
 * Get default message for alert
 */
export function getDefaultMessage(alert) {
  if (alert.status === 'normal') {
    return 'All sensor readings within safe thresholds.'
  }
  return alert.message || 'Alert condition detected.'
}

/**
 * Parse Firestore timestamp to Date object
 */
export function parseTimestamp(timestamp) {
  if (!timestamp) return null
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp) {
  const date = parseTimestamp(timestamp)
  if (!date) return '...'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Get relative time string (e.g., "5m ago")
 */
export function timeAgo(timestamp) {
  const date = parseTimestamp(timestamp)
  if (!date) return ''

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000)

  if (diffSeconds < 60) return `${diffSeconds}s ago`

  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}
