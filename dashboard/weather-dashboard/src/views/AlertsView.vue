<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-[var(--color-text-main)] tracking-tight">
          Alert System
        </h1>
        <p class="text-[var(--color-text-light)] mt-2">
          Real-time monitoring with scientifically validated thresholds
        </p>
      </div>

      <!-- System Info Banner -->
      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200"
      >
        <div class="flex items-start space-x-4">
          <Icon
            icon="ph:info-bold"
            class="h-6 w-6 text-blue-600 flex-shrink-0 mt-1"
          />
          <div class="flex-1">
            <h3 class="font-bold text-blue-900 mb-2">
              How the Alert System Works
            </h3>
            <div class="text-sm text-blue-800 space-y-2">
              <p>
                <strong>🚨 Real-Time Email Alerts:</strong> Automated monitoring runs every 15
                minutes via GitHub Actions. When sensor readings exceed critical thresholds (based
                on IRRI & PAGASA research), emails are sent automatically.
              </p>
              <p>
                <strong>📊 Dashboard History:</strong> This page displays the history of triggered
                alerts. Thresholds are pre-configured based on scientific research for rice
                agriculture.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Column 1: Active Thresholds Display (Read-Only) -->
        <div class="lg:col-span-1">
          <div
            class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm p-6 sticky top-8 space-y-6 border border-surface-soft"
          >
            <!-- Current Thresholds Header -->
            <div>
              <h2
                class="text-xl font-bold text-text-main mb-2 flex items-center"
              >
                <Icon icon="ph:shield-check-bold" class="h-6 w-6 mr-2 text-blue-600" />
                Active Thresholds
              </h2>
              <p class="text-xs text-text-light">
                Scientific thresholds from IRRI & PAGASA research
              </p>
            </div>

            <!-- Rice Agriculture Thresholds (IRRI) -->
            <div
              class="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg"
            >
              <h3
                class="text-sm font-bold text-green-900 mb-3 flex items-center"
              >
                <Icon icon="ph:plant-bold" class="h-5 w-5 mr-2" />
                Rice Agriculture (IRRI)
              </h3>

              <!-- Heat Stress -->
              <div class="mb-3 pb-3 border-b border-green-200">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-green-900"
                    >🔥 Heat Stress</span
                  >
                  <span
                    class="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded"
                  >
                    &gt;35°C
                  </span>
                </div>
                <p class="text-xs text-green-700">
                  Causes spikelet sterility during flowering
                </p>
              </div>

              <!-- Optimal Range -->
              <div class="mb-3 pb-3 border-b border-green-200">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-green-900"
                    >✅ Optimal Range</span
                  >
                  <span
                    class="text-xs font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded"
                  >
                    25-33°C
                  </span>
                </div>
                <p class="text-xs text-green-700">
                  Ideal temperature for rice growth
                </p>
              </div>

              <!-- Disease Monitoring -->
              <div>
                <p class="text-xs font-semibold text-green-900 mb-2">
                  🦠 Disease Detection
                </p>
                <ul class="text-xs text-green-700 space-y-1">
                  <li>• Rice Blast: &gt;90% RH + 24-28°C</li>
                  <li>• Bacterial Blight: &gt;85% RH + 30-34°C</li>
                </ul>
              </div>
            </div>

            <!-- PAGASA Rainfall System -->
            <div
              class="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg"
            >
              <h3 class="text-sm font-bold text-blue-900 mb-3 flex items-center">
                <Icon icon="ph:cloud-rain-bold" class="h-5 w-5 mr-2" />
                PAGASA Rainfall System
              </h3>

              <div class="space-y-2">
                <div
                  class="flex items-center justify-between p-2 bg-yellow-100 rounded"
                >
                  <span class="text-xs font-semibold text-yellow-900"
                    >🟡 Yellow Alert</span
                  >
                  <span class="text-xs font-mono">≥7.5 mm/hr</span>
                </div>
                <div
                  class="flex items-center justify-between p-2 bg-orange-100 rounded"
                >
                  <span class="text-xs font-semibold text-orange-900"
                    >🟠 Orange Alert</span
                  >
                  <span class="text-xs font-mono">≥15 mm/hr</span>
                </div>
                <div
                  class="flex items-center justify-between p-2 bg-red-100 rounded"
                >
                  <span class="text-xs font-semibold text-red-900"
                    >🔴 Red Alert</span
                  >
                  <span class="text-xs font-mono">≥30 mm/hr</span>
                </div>
              </div>

              <p class="text-xs text-blue-700 mt-3">
                Color-coded flood risk assessment system
              </p>
            </div>

            <!-- Email Status -->
            <div class="border-t border-surface-soft pt-4">
              <div
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center space-x-2">
                  <Icon
                    icon="ph:envelope-simple-bold"
                    class="h-5 w-5 text-gray-600"
                  />
                  <span class="text-sm font-medium text-text-main"
                    >Email Alerts</span
                  >
                </div>
                <span
                  class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full"
                >
                  Active
                </span>
              </div>
              <p class="text-xs text-text-light mt-2 text-center">
                Automated via GitHub Actions (every 15 min)
              </p>
            </div>

            <!-- Info Note -->
            <div
              class="bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              <p class="text-xs text-blue-800">
                <Icon icon="ph:info-bold" class="inline h-3 w-3 mr-1" />
                <strong>Note:</strong> These thresholds are based on peer-reviewed research and
                cannot be changed from the dashboard. They are configured in the backend monitoring
                system.
              </p>
            </div>
          </div>
        </div>

        <!-- Column 2: Alert History -->
        <div class="lg:col-span-2">
          <div
            class="bg-surface/70 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-soft"
          >
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-bold text-text-main">Alert History</h2>
                  <p class="text-sm text-text-light mt-1">
                    Recent threshold violations and email notifications
                  </p>
                </div>
                <button
                  @click="refreshHistory"
                  class="p-2 rounded-lg hover:bg-surface-soft transition-colors"
                  title="Refresh history"
                >
                  <Icon
                    icon="ph:arrow-clockwise-bold"
                    class="h-5 w-5 text-text-light"
                    :class="{ 'animate-spin': isLoadingHistory }"
                  />
                </button>
              </div>
            </div>

            <div
              v-if="isLoadingHistory"
              class="p-12 text-center text-text-light"
            >
              <Icon
                icon="ph:circle-notch-bold"
                class="h-10 w-10 animate-spin mx-auto mb-3 text-primary"
              />
              <p class="font-medium">Loading alert history...</p>
            </div>

            <div
              v-else-if="!alertHistory.length"
              class="p-12 text-center text-text-light"
            >
              <Icon icon="ph:shield-check-bold" class="h-16 w-16 text-green-400 mx-auto mb-4" />
              <p class="text-lg font-medium text-text-main">All Clear!</p>
              <p class="text-sm mt-2">No alerts have been triggered recently</p>
              <p class="text-xs mt-1 text-text-light">
                Monitoring continues every 15 minutes
              </p>
            </div>

            <ul v-else class="divide-y divide-surface-soft">
              <li
                v-for="alert in alertHistory"
                :key="alert.id"
                class="p-5 hover:bg-surface-soft transition-colors"
              >
                <div class="flex items-start space-x-4">
                  <!-- Alert Icon -->
                  <div
                    class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    :class="getAlertStyle(alert).bg"
                  >
                    <Icon
                      :icon="getAlertStyle(alert).icon"
                      class="h-6 w-6"
                      :class="getAlertStyle(alert).text"
                    />
                  </div>

                  <!-- Alert Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                          <h3 class="font-bold text-text-main">
                            {{ getAlertStyle(alert).title }}
                          </h3>
                          <span
                            v-if="alert.severity"
                            class="px-2 py-0.5 text-xs font-semibold rounded-full"
                            :class="getSeverityBadge(alert.severity)"
                          >
                            {{ alert.severity.toUpperCase() }}
                          </span>
                        </div>
                        <p class="text-sm text-text-light leading-relaxed">
                          {{ alert.message || getDefaultMessage(alert) }}
                        </p>
                      </div>

                      <!-- Timestamp -->
                      <div class="text-right flex-shrink-0 ml-4">
                        <p class="text-sm font-medium text-text-light">
                          {{ formatTimestamp(alert.timestamp) }}
                        </p>
                        <p class="text-xs text-text-light mt-1">
                          {{ timeAgo(alert.timestamp) }}
                        </p>
                      </div>
                    </div>

                    <!-- Sensor Readings -->
                    <div v-if="alert.readings" class="flex flex-wrap gap-3 mt-3 mb-3">
                      <div
                        class="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        <Icon icon="ph:thermometer-simple-bold" class="h-3 w-3" />
                        <span>{{ alert.readings.temperature }}°C</span>
                      </div>
                      <div
                        class="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        <Icon icon="ph:drop-bold" class="h-3 w-3" />
                        <span>{{ alert.readings.humidity }}%</span>
                      </div>
                      <div
                        class="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        <Icon icon="ph:cloud-rain-bold" class="h-3 w-3" />
                        <span>{{ alert.readings.rainfall }}mm</span>
                      </div>
                    </div>

                    <!-- Multiple Alerts Display -->
                    <div v-if="alert.alerts && alert.alerts.length > 0" class="space-y-2 mt-3">
                      <div
                        v-for="(subAlert, index) in alert.alerts"
                        :key="index"
                        class="p-3 bg-orange-50 border-l-3 border-orange-500 rounded"
                      >
                        <div class="flex items-start space-x-2">
                          <Icon
                            :icon="subAlert.icon || 'ph:warning-bold'"
                            class="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0"
                          />
                          <div class="flex-1">
                            <p class="text-xs font-semibold text-orange-900">
                              {{ subAlert.metric }}: {{ subAlert.value }}
                            </p>
                            <p class="text-xs text-orange-700 mt-1">
                              {{ subAlert.message }}
                            </p>
                            <div
                              v-if="subAlert.action"
                              class="mt-2 p-2 bg-blue-50 rounded"
                            >
                              <p class="text-xs text-blue-800">
                                <strong>Action:</strong> {{ subAlert.action }}
                              </p>
                            </div>
                            <p
                              v-if="subAlert.source"
                              class="text-xs text-text-light mt-1"
                            >
                              📚 {{ subAlert.source }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Email Status -->
                    <div
                      v-if="alert.emailSent"
                      class="mt-3 flex items-center space-x-2 text-xs text-green-700"
                    >
                      <Icon icon="ph:check-circle-bold" class="h-4 w-4" />
                      <span
                        >Email notification sent to
                        {{ alert.recipients ? alert.recipients.length : 1 }} recipient(s)</span
                      >
                    </div>

                    <!-- Scientific Reference -->
                    <div v-if="alert.source" class="mt-2 text-xs text-text-light">
                      <Icon icon="ph:book-open-bold" class="inline h-3 w-3 mr-1" />
                      Based on: {{ alert.source }}
                    </div>
                  </div>
                </div>
              </li>
            </ul>

            <!-- Load More Button -->
            <div
              v-if="alertHistory.length >= 50"
              class="p-4 border-t border-gray-200 text-center"
            >
              <button
                class="text-sm text-blue-600 hover:underline font-medium"
                @click="loadMoreAlerts"
              >
                Load More Alerts
              </button>
            </div>
          </div>

          <!-- Scientific References Footer -->
          <div
            class="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-sm p-6 mt-6 border border-green-200"
          >
            <h3 class="text-lg font-bold text-text-main mb-4 flex items-center">
              <Icon icon="ph:graduation-cap-bold" class="h-6 w-6 mr-2 text-green-600" />
              Scientific Foundation
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div
                class="p-4 bg-surface rounded-lg border border-surface-soft"
              >
                <p class="font-bold text-text-main mb-1">
                  🌡️ Heat Stress Threshold
                </p>
                <p class="text-xs text-text-light mb-2">
                  Temperature >35°C during flowering causes spikelet sterility
                </p>
                <p class="text-xs text-blue-600 font-medium">
                  Source: IRRI Rice Knowledge Bank
                </p>
              </div>
              <div
                class="p-4 bg-surface rounded-lg border border-surface-soft"
              >
                <p class="font-bold text-text-main mb-1">
                  🌧️ Rainfall Warning System
                </p>
                <p class="text-xs text-text-light mb-2">
                  Color-coded thresholds based on flood risk levels
                </p>
                <p class="text-xs text-blue-600 font-medium">
                  Source: PAGASA Heavy Rainfall Warning System
                </p>
              </div>
              <div
                class="p-4 bg-surface rounded-lg border border-surface-soft"
              >
                <p class="font-bold text-text-main mb-1">
                  🍄 Rice Blast Conditions
                </p>
                <p class="text-xs text-text-light mb-2">
                  High humidity (>90%) with cool temperatures (24-28°C)
                </p>
                <p class="text-xs text-blue-600 font-medium">
                  Source: IRRI Rice Doctor
                </p>
              </div>
              <div
                class="p-4 bg-surface rounded-lg border border-surface-soft"
              >
                <p class="font-bold text-text-main mb-1">
                  🦠 Bacterial Blight Conditions
                </p>
                <p class="text-xs text-text-light mb-2">
                  High humidity (>85%) with heat (30-34°C)
                </p>
                <p class="text-xs text-blue-600 font-medium">
                  Source: IRRI Rice Doctor
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/firebase.js'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { Icon } from '@iconify/vue'

const alertHistory = ref([])
const isLoadingHistory = ref(true)
let unsubscribeFromAlerts = null

// Listen for alerts from Firestore
const listenForAlerts = () => {
  const alertsRef = collection(db, 'alerts_history')
  const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50))

  unsubscribeFromAlerts = onSnapshot(
    q,
    (snapshot) => {
      alertHistory.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      isLoadingHistory.value = false
    },
    (error) => {
      console.error('Error listening for alerts:', error)
      isLoadingHistory.value = false
    },
  )
}

const refreshHistory = () => {
  isLoadingHistory.value = true
  // The snapshot listener will automatically update
  setTimeout(() => {
    isLoadingHistory.value = false
  }, 1000)
}

const loadMoreAlerts = () => {
  // Implement pagination if needed
  console.log('Load more alerts')
}

// Get alert styling based on type or severity
const getAlertStyle = (alert) => {
  // Handle different alert formats
  const severity = alert.severity?.toLowerCase()
  const status = alert.status?.toLowerCase()

  // Check if this is a multi-alert with nested alerts
  if (alert.alerts && alert.alerts.length > 0) {
    const hasCritical = alert.alerts.some((a) => a.severity === 'critical')
    if (hasCritical) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: 'ph:warning-octagon-bold',
        title: 'Multiple Critical Alerts',
      }
    }
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      icon: 'ph:warning-bold',
      title: `${alert.alertCount || alert.alerts.length} Alerts Triggered`,
    }
  }

  if (severity === 'critical') {
    return {
      bg: 'bg-red-100',
      text: 'text-red-600',
      icon: 'ph:fire-bold',
      title: 'Critical Alert',
    }
  }

  if (severity === 'warning') {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      icon: 'ph:warning-bold',
      title: 'Warning',
    }
  }

  if (status === 'normal') {
    return {
      bg: 'bg-green-100',
      text: 'text-green-600',
      icon: 'ph:check-circle-bold',
      title: 'System Check',
    }
  }

  // Default
  return {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    icon: 'ph:bell-bold',
    title: 'Alert Notification',
  }
}

const getSeverityBadge = (severity) => {
  const classes = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-orange-100 text-orange-700',
    advisory: 'bg-blue-100 text-blue-700',
  }
  return (
    classes[severity?.toLowerCase()] ||
    'bg-gray-100 text-gray-700'
  )
}

const getDefaultMessage = (alert) => {
  if (alert.status === 'normal') {
    return 'All sensor readings within safe thresholds.'
  }
  return alert.message || 'Alert condition detected.'
}

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '...'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Time ago helper
const timeAgo = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000)

  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

onMounted(() => {
  listenForAlerts()
})

onUnmounted(() => {
  if (unsubscribeFromAlerts) {
    unsubscribeFromAlerts()
  }
})
</script>
