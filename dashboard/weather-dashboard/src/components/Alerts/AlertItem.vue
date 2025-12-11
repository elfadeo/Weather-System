<template>
  <li class="p-5 hover:bg-hover transition-colors">
    <div class="flex items-start space-x-4">
      <!-- Alert Icon -->
      <div
        class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
        :class="alertStyle.bg"
      >
        <Icon :icon="alertStyle.icon" class="h-6 w-6" :class="alertStyle.text" />
      </div>

      <!-- Alert Content -->
      <div class="flex-1 min-w-0">
        <!-- Header with title and timestamp -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-1">
              <h3 class="font-bold text-text-main">{{ alertStyle.title }}</h3>
              <AlertBadge v-if="alert.severity" :severity="alert.severity" />
            </div>
            <p class="text-sm text-text-light leading-relaxed">{{ alertMessage }}</p>
          </div>

          <!-- Timestamp -->
          <div class="text-right flex-shrink-0 ml-4">
            <p class="text-sm font-medium text-text-light">{{ formattedTime }}</p>
            <p class="text-xs text-text-light mt-1">{{ relativeTime }}</p>
          </div>
        </div>

        <!-- Sensor Readings -->
        <div v-if="alert.readings" class="flex flex-wrap gap-3 mt-3 mb-3">
          <div
            v-for="reading in sensorReadings"
            :key="reading.key"
            class="flex items-center space-x-1 text-xs bg-background px-2 py-1 rounded text-text-main"
          >
            <Icon :icon="reading.icon" class="h-3 w-3" />
            <span>{{ reading.value }}</span>
          </div>
        </div>

        <!-- Multiple Alerts Display -->
        <div v-if="alert.alerts?.length" class="space-y-2 mt-3">
          <div
            v-for="(subAlert, index) in alert.alerts"
            :key="index"
            class="p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 dark:border-orange-600 rounded"
          >
            <div class="flex items-start space-x-2">
              <Icon
                :icon="subAlert.icon || 'ph:warning-bold'"
                class="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0"
              />
              <div class="flex-1">
                <p class="text-xs font-semibold text-text-main">
                  {{ subAlert.metric }}: {{ subAlert.value }}
                </p>
                <p class="text-xs text-text-main mt-1">
                  {{ subAlert.message }}
                </p>
                <div
                  v-if="subAlert.action"
                  class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded"
                >
                  <p class="text-xs text-blue-900 dark:text-blue-200">
                    <strong>Action:</strong> {{ subAlert.action }}
                  </p>
                </div>
                <p v-if="subAlert.source" class="text-xs text-text-light mt-1">
                  📚 {{ subAlert.source }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Status -->
        <div
          v-if="alert.emailSent"
          class="mt-3 flex items-center space-x-2 text-xs text-green-800 dark:text-green-300"
        >
          <Icon icon="ph:check-circle-bold" class="h-4 w-4" />
          <span>Email notification sent to {{ recipientCount }} recipient(s)</span>
        </div>

        <!-- Scientific Reference -->
        <div v-if="alert.source" class="mt-2 text-xs text-text-light">
          <Icon icon="ph:book-open-bold" class="inline h-3 w-3 mr-1" />
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
