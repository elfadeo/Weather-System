// utils/alertUtils.js

/**
 * Get alert styling configuration based on severity and status
 * Uses CSS Variable Theme Architecture (bg-[color]-50 auto-adapts to Dark Mode)
 */
export function getAlertStyle(alert) {
  const severity = alert.severity?.toLowerCase()
  const status = alert.status?.toLowerCase()

  // Multi-alert handling
  if (alert.alerts?.length > 0) {
    const hasCritical = alert.alerts.some((a) => a.severity === 'critical')
    return {
      // bg-red-50: Light Pink (Light Mode) -> Deep Maroon (Dark Mode)
      bg: hasCritical ? 'bg-red-50' : 'bg-orange-50',
      // text-red-600: Vibrant Red (Light Mode) -> Soft Red (Dark Mode)
      text: hasCritical ? 'text-red-600' : 'text-orange-600',
      icon: hasCritical ? 'ph:warning-octagon-bold' : 'ph:warning-bold',
      title: hasCritical
        ? 'Multiple Critical Alerts'
        : `${alert.alertCount || alert.alerts.length} Alerts Triggered`,
    }
  }

  // Single alert severity levels
  const severityMap = {
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'ph:fire-bold',
      title: 'Critical Alert',
    },
    warning: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
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
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'ph:check-circle-bold',
      title: 'System Check',
    }
  }

  // Default (Blue)
  return {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'ph:bell-bold',
    title: 'Alert Notification',
  }
}

/**
 * Get CSS classes for severity badges
 * Uses the 50/900/200 variable pattern for consistent contrast
 */
export function getSeverityBadge(severity) {
  const s = severity?.toLowerCase()

  const severityMap = {
    critical: 'bg-red-50 text-red-900 border border-red-200',
    warning: 'bg-orange-50 text-orange-900 border border-orange-200',
    advisory: 'bg-blue-50 text-blue-900 border border-blue-200',
    normal: 'bg-green-50 text-green-900 border border-green-200',
  }

  // Default to Gray palette if unknown
  return severityMap[s] || 'bg-gray-50 text-gray-900 border border-gray-200'
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
