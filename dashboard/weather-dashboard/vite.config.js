import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // --- ADDED: Optimization settings to fix large file warnings ---
  build: {
    chunkSizeWarningLimit: 1600, // Increases warning threshold to 1.6MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split Firebase into its own file (usually the biggest one)
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Split Charting libraries
            if (id.includes('chart.js') || id.includes('chartjs') || id.includes('vue-chartjs')) {
              return 'chartjs';
            }
            // Split Maps
            if (id.includes('leaflet')) {
              return 'leaflet';
            }
            // Bundle all other small libraries into 'vendor'
            return 'vendor';
          }
        },
      },
    },
  },
})
