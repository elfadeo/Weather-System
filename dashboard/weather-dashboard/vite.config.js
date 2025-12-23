import { fileURLToPath, URL } from 'node:url'

  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import tailwindcss from '@tailwindcss/vite' // <-- Import the plugin

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [
      vue(),
      tailwindcss(), // <-- Add the plugin here
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  })
