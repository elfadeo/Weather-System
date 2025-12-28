<template>
  <li
    class="p-3 sm:p-4 md:p-5 hover:bg-hover transition-colors duration-200 border-b border-border last:border-0"
  >
    <div class="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
      <div
        class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-transparent"
        :class="alertStyle.bg"
      >
        <Icon :icon="alertStyle.icon" class="h-5 w-5 sm:h-6 sm:w-6" :class="alertStyle.text" />
      </div>

      <div class="flex-1 min-w-0 w-full">
        <div
          class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2"
        >
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h3 class="font-bold text-sm sm:text-base text-text-main">{{ alertStyle.title }}</h3>
              <AlertBadge v-if="alert.severity" :severity="alert.severity" />
            </div>
            <p class="text-xs sm:text-sm text-text-light leading-relaxed">{{ alertMessage }}</p>
          </div>

          <div
            class="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 text-left sm:text-right flex-shrink-0"
          >
            <p class="text-xs sm:text-sm font-medium text-text-light">{{ formattedTime }}</p>
            <span class="text-text-light sm:hidden">•</span>
            <p class="text-xs text-text-light sm:mt-1 opacity-80">{{ relativeTime }}</p>
          </div>
        </div>

        <div v-if="alert.readings" class="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 mb-2 sm:mb-3">
          <div
            v-for="reading in sensorReadings"
            :key="reading.key"
            class="flex items-center space-x-1 text-xs bg-background border border-border px-2 py-1 rounded-md text-text-main shadow-sm"
          >
            <Icon :icon="reading.icon" class="h-3 w-3 flex-shrink-0 text-text-light" />
            <span class="whitespace-nowrap font-mono font-medium">{{ reading.value }}</span>
          </div>
        </div>

        <div v-if="alert.alerts?.length" class="space-y-2 mt-2 sm:mt-3">
          <div
            v-for="(subAlert, index) in alert.alerts"
            :key="index"
            class="p-3 border-l-4 rounded-r-md transition-colors"
            :class="getSubAlertClass(subAlert.severity)"
          >
            <div class="flex items-start space-x-2">
              <Icon
                :icon="subAlert.icon || 'ph:warning-bold'"
                class="h-4 w-4 mt-0.5 flex-shrink-0"
                :class="getSubAlertIconClass(subAlert.severity)"
              />
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-bold break-words"
                  :class="getSubAlertTextClass(subAlert.severity, 'main')"
                >
                  {{ subAlert.metric }}: {{ subAlert.value }}
                </p>
                <p
                  class="text-xs mt-1 break-words leading-relaxed"
                  :class="getSubAlertTextClass(subAlert.severity, 'sub')"
                >
                  {{ subAlert.message }}
                </p>

                <div
                  v-if="subAlert.action"
                  class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-900"
                >
                  <p class="text-xs break-words flex gap-1">
                    <strong class="uppercase text-[10px] tracking-wider mt-0.5">Action:</strong>
                    <span>{{ subAlert.action }}</span>
                  </p>
                </div>

                <div
                  v-if="subAlert.source"
                  class="text-[10px] mt-1.5 flex items-center gap-1 opacity-80"
                  :class="getSubAlertTextClass(subAlert.severity, 'sub')"
                >
                  <Icon icon="ph:book-bookmark-fill" /> {{ subAlert.source }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="alert.emailSent"
          class="mt-2 sm:mt-3 flex items-center space-x-2 text-xs text-green-700"
        >
          <Icon icon="ph:check-circle-fill" class="h-4 w-4 flex-shrink-0" />
          <span class="font-medium"
            >Email notification sent to {{ recipientCount }} recipient(s)</span
          >
        </div>

        <div
          v-if="alert.source"
          class="mt-2 text-xs text-text-light opacity-75 flex items-center gap-1"
        >
          <Icon icon="ph:book-open-bold" class="h-3 w-3 flex-shrink-0" />
          Based on: {{ alert.source }}
        </div>
      </div>
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getAlertStyle, getDefaultMessage, formatTimestamp, timeAgo } from '@/utils/alertUtils'
import AlertBadge from './AlertBadge.vue'

const props = defineProps({
  alert: { type: Object, required: true },
})

// === Helpers for Dynamic Sub-Alert Styling ===
const isCritical = (severity) => severity?.toLowerCase() === 'critical'

const getSubAlertClass = (severity) => {
  // Returns Red-50 if critical, Orange-50 otherwise (Auto-inverts in dark mode)
  return isCritical(severity) ? 'bg-red-50 border-red-600' : 'bg-orange-50 border-orange-600'
}

const getSubAlertIconClass = (severity) => {
  return isCritical(severity) ? 'text-red-600' : 'text-orange-600'
}

const getSubAlertTextClass = (severity, type) => {
  if (isCritical(severity)) {
    return type === 'main' ? 'text-red-900' : 'text-red-800'
  }
  return type === 'main' ? 'text-orange-900' : 'text-orange-800'
}
// ============================================

const alertStyle = computed(() => getAlertStyle(props.alert))
const alertMessage = computed(() => props.alert.message || getDefaultMessage(props.alert))
const formattedTime = computed(() => formatTimestamp(props.alert.timestamp))
const relativeTime = computed(() => timeAgo(props.alert.timestamp))
const recipientCount = computed(() => (props.alert.recipients ? props.alert.recipients.length : 1))

// Sensor readings with Null Safety
const sensorReadings = computed(() => {
  if (!props.alert.readings) return []

  const r = props.alert.readings

  return [
    {
      key: 'temperature',
      icon: 'ph:thermometer-simple-bold',
      // Fallback to '--' if null
      value: r.temperature != null ? `${r.temperature}°C` : '--',
    },
    {
      key: 'humidity',
      icon: 'ph:drop-bold',
      value: r.humidity != null ? `${r.humidity}%` : '--',
    },
    {
      key: 'rainfall',
      icon: 'ph:cloud-rain-bold',
      value: r.rainfall != null ? `${r.rainfall}mm` : '--',
    },
  ]
})
</script>
