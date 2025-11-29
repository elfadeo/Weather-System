// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { requestPermission, setupForegroundListener } from './firebase.js'
import '@/user.js'
import './assets/main.css'
import 'leaflet/dist/leaflet.css'
import './utils/leaflet-fix.js'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)

app.use(router)
app.use(VueApexCharts)

app.mount('#app')

// Wait for the app to be fully mounted, then request notification permission
setTimeout(() => {
  console.log('🚀 App mounted, initializing notifications...')

  // Request notification permission on app load
  requestPermission()

  // Setup foreground message listener
  setupForegroundListener()

  console.log('✅ Notification system initialized')
}, 1000) // Small delay to ensure everything is loaded
