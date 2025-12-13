<template>
  <li class="p-3 sm:p-4 md:p-5 hover:bg-hover transition-colors">
    <div class="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
      <!-- Alert Icon -->
      <div
        class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
        :class="alertStyle.bg"
      >
        <Icon :icon="alertStyle.icon" class="h-5 w-5 sm:h-6 sm:w-6" :class="alertStyle.text" />
      </div>

      <!-- Alert Content -->
      <div class="flex-1 min-w-0 w-full">
        <!-- Header with title and timestamp -->
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

          <!-- Timestamp -->
          <div
            class="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 text-left sm:text-right flex-shrink-0"
          >
            <p class="text-xs sm:text-sm font-medium text-text-light">{{ formattedTime }}</p>
            <span class="text-text-light sm:hidden">•</span>
            <p class="text-xs text-text-light sm:mt-1">{{ relativeTime }}</p>
          </div>
        </div>

        <!-- Sensor Readings -->
        <div v-if="alert.readings" class="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 mb-2 sm:mb-3">
          <div
            v-for="reading in sensorReadings"
            :key="reading.key"
            class="flex items-center space-x-1 text-xs bg-background px-2 py-1 rounded text-text-main"
          >
            <Icon :icon="reading.icon" class="h-3 w-3 flex-shrink-0" />
            <span class="whitespace-nowrap">{{ reading.value }}</span>
          </div>
        </div>

        <!-- Multiple Alerts Display -->
        <div v-if="alert.alerts?.length" class="space-y-2 mt-2 sm:mt-3">
          <div
            v-for="(subAlert, index) in alert.alerts"
            :key="index"
            class="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 dark:border-orange-600 rounded"
          >
            <div class="flex items-start space-x-2">
              <Icon
                :icon="subAlert.icon || 'ph:warning-bold'"
                class="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-text-main break-words">
                  {{ subAlert.metric }}: {{ subAlert.value }}
                </p>
                <p class="text-xs text-text-main mt-1 break-words">
                  {{ subAlert.message }}
                </p>
                <div
                  v-if="subAlert.action"
                  class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded"
                >
                  <p class="text-xs text-blue-900 dark:text-blue-200 break-words">
                    <strong>Action:</strong> {{ subAlert.action }}
                  </p>
                </div>
                <p v-if="subAlert.source" class="text-xs text-text-light mt-1 break-words">
                  📚 {{ subAlert.source }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Status -->
        <div
          v-if="alert.emailSent"
          class="mt-2 sm:mt-3 flex items-center space-x-2 text-xs text-green-800 dark:text-green-300"
        >
          <Icon icon="ph:check-circle-bold" class="h-4 w-4 flex-shrink-0" />
          <span class="break-words"
            >Email notification sent to {{ recipientCount }} recipient(s)</span
          >
        </div>

        <!-- Scientific Reference -->
        <div v-if="alert.source" class="mt-2 text-xs text-text-light break-words">
          <Icon icon="ph:book-open-bold" class="inline h-3 w-3 mr-1 flex-shrink-0" />
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

// Computed properties to avoid multiple function calls
const alertStyle = computed(() => getAlertStyle(props.alert))
const alertMessage = computed(() => props.alert.message || getDefaultMessage(props.alert))
const formattedTime = computed(() => formatTimestamp(props.alert.timestamp))
const relativeTime = computed(() => timeAgo(props.alert.timestamp))
const recipientCount = computed(() => (props.alert.recipients ? props.alert.recipients.length : 1))

// Sensor readings array for v-for
const sensorReadings = computed(() => {
  if (!props.alert.readings) return []

  return [
    {
      key: 'temperature',
      icon: 'ph:thermometer-simple-bold',
      value: `${props.alert.readings.temperature}°C`,
    },
    {
      key: 'humidity',
      icon: 'ph:drop-bold',
      value: `${props.alert.readings.humidity}%`,
    },
    {
      key: 'rainfall',
      icon: 'ph:cloud-rain-bold',
      value: `${props.alert.readings.rainfall}mm`,
    },
  ]
})
</script>
