<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">
          Alerts & Notifications
        </h1>
        <p class="text-text-light mt-2">
          Comprehensive monitoring system with standard and agricultural thresholds
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Column 1: Threshold Settings -->
        <div class="lg:col-span-1">
          <div class="bg-surface rounded-2xl shadow-sm p-6 sticky top-8 space-y-6">

            <!-- Standard Temperature/Humidity Alerts -->
            <div class="border-l-4 border-blue-500 pl-4">
              <h2 class="text-xl font-bold text-text-main mb-2 flex items-center">
                <Icon icon="ph:thermometer-simple-bold" class="h-6 w-6 mr-2 text-blue-500" />
                Standard Thresholds
              </h2>
              <p class="text-xs text-text-light mb-4">
                Basic temperature and humidity monitoring
              </p>

              <!-- Temperature -->
              <div class="space-y-2 mb-4">
                <label class="block text-sm font-medium text-text-light">Temperature (°C)</label>
                <div class="flex items-center space-x-3">
                  <input
                    type="number"
                    placeholder="Min"
                    v-model.number="thresholds.temp_min"
                    class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    v-model.number="thresholds.temp_max"
                    class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                </div>
              </div>

              <!-- Humidity -->
              <div class="space-y-2 mb-4">
                <label class="block text-sm font-medium text-text-light">Humidity (%)</label>
                <div class="flex items-center space-x-3">
                  <input
                    type="number"
                    placeholder="Min"
                    v-model.number="thresholds.humidity_min"
                    class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    v-model.number="thresholds.humidity_max"
                    class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                  />
                </div>
              </div>

              <!-- Basic Rainfall -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-text-light">Rainfall Max (mm/30min)</label>
                <input
                  type="number"
                  placeholder="Max"
                  v-model.number="thresholds.rainfall_max"
                  class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                />
                <p class="text-xs text-text-light/70">
                  Basic threshold for heavy rainfall
                </p>
              </div>
            </div>

            <!-- Rice Agriculture Section -->
            <div class="border-l-4 border-green-500 pl-4">
              <div class="flex items-center justify-between mb-2">
                <h2 class="text-xl font-bold text-text-main flex items-center">
                  <Icon icon="ph:plant-bold" class="h-6 w-6 mr-2 text-green-500" />
                  Rice Agriculture
                </h2>
                <button
                  @click="thresholds.agriculture_mode_enabled = !thresholds.agriculture_mode_enabled"
                  :class="thresholds.agriculture_mode_enabled ? 'bg-green-600' : 'bg-gray-300'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                >
                  <span
                    :class="thresholds.agriculture_mode_enabled ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  />
                </button>
              </div>
              <p class="text-xs text-text-light mb-4">
                Enable science-based alerts for rice farming
              </p>

              <div v-if="thresholds.agriculture_mode_enabled" class="space-y-4">
                <!-- Heat Stress -->
                <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <label class="block text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                    🌡️ Heat Stress (°C)
                  </label>
                  <input
                    type="number"
                    v-model.number="thresholds.temp_critical"
                    placeholder="35"
                    class="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800"
                  />
                  <p class="text-xs text-red-700 dark:text-red-300 mt-1">
                    IRRI: >35°C causes spikelet sterility
                  </p>
                </div>

                <!-- PAGASA Rainfall -->
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🌧️ PAGASA Rainfall System (mm/hr)
                  </p>
                  <div class="space-y-2">
                    <div>
                      <label class="text-xs text-yellow-700 dark:text-yellow-400">🟡 Yellow</label>
                      <input
                        type="number"
                        v-model.number="thresholds.rainfall_yellow"
                        placeholder="7.5"
                        class="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-orange-700 dark:text-orange-400">🟠 Orange</label>
                      <input
                        type="number"
                        v-model.number="thresholds.rainfall_orange"
                        placeholder="15"
                        class="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-red-700 dark:text-red-400">🔴 Red</label>
                      <input
                        type="number"
                        v-model.number="thresholds.rainfall_red"
                        placeholder="30"
                        class="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <!-- Disease Monitoring -->
                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="thresholds.disease_monitoring_enabled"
                      class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span class="ml-2 text-sm font-semibold text-purple-900 dark:text-purple-100">
                      🦠 Disease Risk Detection
                    </span>
                  </label>
                  <p class="text-xs text-purple-700 dark:text-purple-300 mt-2">
                    IRRI: Auto-detect Rice Blast & Bacterial Blight conditions
                  </p>
                </div>
              </div>

              <div v-else class="text-center py-4 text-sm text-text-light">
                Enable to activate agricultural alerts
              </div>
            </div>

            <!-- Email Notifications -->
            <div class="border-t border-text-light/10 pt-6">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-text-light">Email Notifications</label>
                <button
                  @click="thresholds.email_notifications_enabled = !thresholds.email_notifications_enabled"
                  :class="thresholds.email_notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                >
                  <span
                    :class="thresholds.email_notifications_enabled ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  />
                </button>
              </div>
              <p class="text-xs text-text-light/70">
                Receive email alerts for all triggered conditions
              </p>
            </div>

            <!-- Save Button -->
            <button
              @click="saveThresholds"
              :disabled="isSaving"
              class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Alert Settings</span>
            </button>
            <p
              v-if="saveStatus"
              class="text-sm text-center mt-3"
              :class="saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'"
            >
              {{ saveStatus }}
            </p>
          </div>
        </div>

        <!-- Column 2: Alert History -->
        <div class="lg:col-span-2">
          <div class="bg-surface rounded-2xl shadow-sm">
            <div class="p-6 border-b border-text-light/10">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-bold text-text-main">Alert History</h2>
                  <p class="text-sm text-text-light mt-1">
                    Showing standard {{ thresholds.agriculture_mode_enabled ? 'and agricultural' : '' }} alerts
                  </p>
                </div>
                <div v-if="thresholds.agriculture_mode_enabled" class="flex items-center space-x-2 text-xs">
                  <span class="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    <Icon icon="ph:plant-bold" class="inline h-3 w-3 mr-1" />
                    Agriculture Mode
                  </span>
                </div>
              </div>
            </div>

            <div v-if="isLoadingHistory" class="p-6 text-center text-text-light">
              <Icon icon="ph:circle-notch-bold" class="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading alert history...</p>
            </div>

            <div v-else-if="!alertHistory.length" class="p-12 text-center text-text-light">
              <Icon icon="ph:shield-check-bold" class="h-16 w-16 text-green-400 mx-auto mb-4" />
              <p class="text-lg font-medium text-text-main">No alerts triggered</p>
              <p class="text-sm mt-1">All conditions are within safe parameters</p>
            </div>

            <ul v-else class="divide-y divide-text-light/10">
              <li
                v-for="alert in alertHistory"
                :key="alert.id"
                class="p-4 hover:bg-background transition-colors"
              >
                <div class="flex items-start space-x-4">
                  <div
                    class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    :class="getAlertClass(alert.type).bg"
                  >
                    <Icon
                      :icon="getAlertClass(alert.type).icon"
                      class="h-6 w-6"
                      :class="getAlertClass(alert.type).text"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <p class="font-semibold text-text-main">
                          {{ getAlertClass(alert.type).title }}
                        </p>
                        <p class="text-sm text-text-light mt-1">{{ alert.message }}</p>

                        <!-- Agricultural Recommendation -->
                        <div v-if="alert.recommendation" class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p class="text-xs font-semibold text-blue-900 dark:text-blue-100 flex items-start">
                            <Icon icon="ph:lightbulb-bold" class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{{ alert.recommendation }}</span>
                          </p>
                        </div>

                        <!-- Scientific Reference -->
                        <div v-if="alert.reference" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <Icon icon="ph:book-open-bold" class="inline h-3 w-3 mr-1" />
                          {{ alert.reference }}
                        </div>
                      </div>
                      <div class="text-right flex-shrink-0 ml-4">
                        <p class="text-sm font-medium text-text-light">
                          {{ formatTimestamp(alert.timestamp) }}
                        </p>
                        <p class="text-xs text-text-light/70 mt-1">
                          {{ timeAgo(alert.timestamp) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Scientific References (shown only when agriculture mode is on) -->
          <div
            v-if="thresholds.agriculture_mode_enabled"
            class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl shadow-sm p-6 mt-6"
          >
            <h3 class="text-lg font-bold text-text-main mb-4 flex items-center">
              <Icon icon="ph:graduation-cap-bold" class="h-6 w-6 mr-2" />
              Scientific References
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p class="font-semibold text-text-main">🌡️ Heat Stress</p>
                <p class="text-text-light text-xs mt-1">
                  IRRI: ">35°C during flowering causes spikelet sterility"
                </p>
              </div>
              <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p class="font-semibold text-text-main">🌧️ Rainfall System</p>
                <p class="text-text-light text-xs mt-1">
                  PAGASA: Color-coded flood risk thresholds
                </p>
              </div>
              <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p class="font-semibold text-text-main">🍄 Rice Blast</p>
                <p class="text-text-light text-xs mt-1">
                  IRRI: High humidity (>90%) + cool temps (24-28°C)
                </p>
              </div>
              <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p class="font-semibold text-text-main">🦠 Bacterial Blight</p>
                <p class="text-text-light text-xs mt-1">
                  IRRI: High humidity (>85%) + heat (>30°C)
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
import { doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { Icon } from '@iconify/vue'

// State for thresholds
const thresholds = ref({
  // Standard thresholds
  temp_min: null,
  temp_max: null,
  humidity_min: null,
  humidity_max: null,
  rainfall_max: null,

  // Agriculture mode toggle
  agriculture_mode_enabled: false,

  // Agricultural thresholds (only active when agriculture_mode_enabled = true)
  temp_critical: 35,
  rainfall_yellow: 7.5,
  rainfall_orange: 15,
  rainfall_red: 30,
  disease_monitoring_enabled: true,

  // Email notifications
  email_notifications_enabled: false,
})

const isSaving = ref(false)
const saveStatus = ref('')
const alertHistory = ref([])
const isLoadingHistory = ref(true)
let unsubscribeFromAlerts = null

// Fetch thresholds
const fetchThresholds = async () => {
  try {
    const docRef = doc(db, 'alerts', 'thresholds')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      thresholds.value = { ...thresholds.value, ...docSnap.data() }
    }
  } catch (error) {
    console.error('Error fetching thresholds:', error)
    saveStatus.value = 'Error: Could not load settings.'
  }
}

// Save thresholds
const saveThresholds = async () => {
  isSaving.value = true
  saveStatus.value = ''
  try {
    const docRef = doc(db, 'alerts', 'thresholds')
    await setDoc(docRef, thresholds.value, { merge: true })
    saveStatus.value = 'Settings saved successfully!'
  } catch (error) {
    console.error('Error saving thresholds:', error)
    saveStatus.value = 'Error: Could not save settings.'
  } finally {
    isSaving.value = false
    setTimeout(() => (saveStatus.value = ''), 3000)
  }
}

// Listen for alerts
const listenForAlerts = () => {
  const alertsRef = collection(db, 'alerts_history')
  const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50))

  unsubscribeFromAlerts = onSnapshot(
    q,
    (snapshot) => {
      alertHistory.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      isLoadingHistory.value = false
    },
    (error) => {
      console.error('Error listening for alerts:', error)
      isLoadingHistory.value = false
    },
  )
}

// Alert styling
const getAlertClass = (type) => {
  const classes = {
    // Standard alerts
    'HIGH_TEMP': {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'ph:thermometer-hot-bold',
      title: 'High Temperature',
    },
    'LOW_TEMP': {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'ph:thermometer-cold-bold',
      title: 'Low Temperature',
    },
    'HIGH_HUMIDITY': {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      icon: 'ph:drop-half-bold',
      title: 'High Humidity',
    },
    'LOW_HUMIDITY': {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'ph:drop-half-bottom-bold',
      title: 'Low Humidity',
    },
    'HEAVY_RAINFALL': {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      icon: 'ph:cloud-rain-bold',
      title: 'Heavy Rainfall',
    },

    // Agricultural alerts
    'HEAT_STRESS': {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'ph:fire-bold',
      title: '🌡️ Critical Heat Stress',
    },
    'RAINFALL_YELLOW': {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'ph:cloud-rain-bold',
      title: '🟡 Yellow Rainfall Warning',
    },
    'RAINFALL_ORANGE': {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'ph:cloud-rain-bold',
      title: '🟠 Orange Rainfall Warning',
    },
    'RAINFALL_RED': {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'ph:warning-bold',
      title: '🔴 Red Rainfall Alert',
    },
    'RICE_BLAST_RISK': {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'ph:bug-bold',
      title: '🍄 Rice Blast Risk',
    },
    'BACTERIAL_BLIGHT_RISK': {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'ph:bug-bold',
      title: '🦠 Bacterial Blight Risk',
    },
  }

  return classes[type] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    icon: 'ph:warning-circle-bold',
    title: 'System Alert',
  }
}

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '...'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Time ago
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
  fetchThresholds()
  listenForAlerts()
})

onUnmounted(() => {
  if (unsubscribeFromAlerts) {
    unsubscribeFromAlerts()
  }
})
</script>
