<script setup>
import { ref, watch, nextTick } from 'vue' // Import nextTick
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix missing marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

defineProps({
  mapCenter: {
    type: Array,
    required: true,
    validator: (val) => val === null || (Array.isArray(val) && val.length === 2),
  },
  markerLatLng: {
    type: Array,
    required: true,
    validator: (val) => val === null || (Array.isArray(val) && val.length === 2),
  },
  deviceAddress: {
    type: String,
    required: true,
  },
  temperature: {
    type: [String, Number],
    required: true,
  },
  humidity: {
    type: [String, Number],
    required: true,
  },
  rainfall: {
    type: [String, Number],
    required: true,
  },
})

const mapConfig = {
  zoom: 15,
  defaultCenter: [8.07841, 124.21014],
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  popupOptions: {
    closeOnClick: false,
    autoClose: false,
    className: 'custom-popup',
  },
}

const mapZoom = ref(mapConfig.zoom)
const isMapLoading = ref(true)
const mapError = ref(null)
const mapRef = ref(null) // This ref is connected to your <l-map>

const onMapReady = () => {
  isMapLoading.value = false
}

const onMapError = (error) => {
  console.error('Map error:', error)
  mapError.value = 'Failed to load map properly'
  isMapLoading.value = false
}

// --- THE FIX IS HERE ---
// Watch for the mapRef to be populated. This happens when the v-if becomes true.
watch(mapRef, (newMapRefValue) => {
  if (newMapRefValue) {
    // Use nextTick to ensure the DOM is fully updated and the map container has a size.
    nextTick(() => {
      // Access the underlying Leaflet map object and call invalidateSize().
      newMapRefValue.leafletObject.invalidateSize()
    })
  }
})
</script>

<template>
  <div class="bg-surface/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-text-main">Station Location</h3>
      <span class="text-sm text-text-light font-medium">{{ deviceAddress }}</span>
    </div>

    <!-- Map -->
    <div class="relative h-[400px] rounded-xl overflow-hidden">
      <div
        v-if="!mapCenter"
        class="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-10"
      >
        <div class="text-center">
          <div class="animate-pulse text-text-light">Waiting for location data...</div>
        </div>
      </div>

      <div
        v-if="mapError"
        class="absolute inset-0 flex items-center justify-center bg-red-100 text-red-600 font-medium z-20"
      >
        {{ mapError }}
      </div>

      <l-map
        v-if="mapCenter"
        ref="mapRef"
        v-model:zoom="mapZoom"
        :center="mapCenter"
        @ready="onMapReady"
        @error="onMapError"
        class="h-full w-full rounded-xl shadow-inner"
      >
        <l-tile-layer :url="mapConfig.tileUrl" :attribution="mapConfig.attribution" />
        <l-marker :lat-lng="markerLatLng">
          <l-popup :options="mapConfig.popupOptions">
            <div class="p-3">
              <h4 class="font-medium text-text-main mb-2">Weather Station</h4>
              <div class="space-y-2">
                <p class="flex items-center justify-between text-sm">
                  <span class="text-text-light">Temperature</span>
                  <span class="font-medium text-red-500 dark:text-red-400"
                    >{{ temperature }}°C</span
                  >
                </p>
                <p class="flex items-center justify-between text-sm">
                  <span class="text-text-light">Humidity</span>
                  <span class="font-medium text-primary">{{ humidity }}%</span>
                </p>
                <p class="flex items-center justify-between text-sm">
                  <span class="text-text-light">Rainfall Rate (Est.)</span>
                  <span class="font-medium text-indigo-500 dark:text-indigo-400"
                    >{{ rainfall }} mm/hr</span
                  >
                </p>
              </div>
            </div>
          </l-popup>
        </l-marker>
      </l-map>
    </div>
  </div>
</template>

<style scoped>
.leaflet-container {
  border-radius: 0.75rem;
}
.leaflet-popup-content-wrapper {
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
.leaflet-popup-content {
  margin: 0;
  min-width: 220px;
}
.custom-popup .leaflet-popup-tip,
.custom-popup .leaflet-popup-content-wrapper {
  background: var(--color-surface);
  color: var(--color-text-main);
}
.custom-popup .leaflet-popup-close-button {
  color: var(--color-text-main);
}
.custom-popup .leaflet-popup-close-button:hover {
  color: var(--color-text-light);
}
</style>
