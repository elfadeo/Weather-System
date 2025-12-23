<template>
  <tr
    class="group border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-hover)] transition-colors duration-200"
  >
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-main)]">
      {{ record.period }}
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums">
      <span class="font-semibold" :style="getTempStyle(record.temperature)">
        {{ record.temperature }}
      </span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums">
      <span class="font-semibold" :style="getHumidityStyle(record.humidity)">
        {{ record.humidity }}
      </span>
    </td>

    <td
      class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-main)] text-right tabular-nums"
    >
      {{ record.rainfallRate }}
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-sm text-right tabular-nums">
      <span
        :class="parseFloat(record.periodRainfall) > 0 ? 'font-bold' : 'font-normal'"
        :style="getRainfallStyle(record.periodRainfall)"
      >
        {{ record.periodRainfall }}
      </span>
    </td>

    <td
      class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-light)] text-right tabular-nums"
    >
      {{ record.count }}
    </td>
  </tr>
</template>

<script setup>
defineProps({
  record: {
    type: Object,
    required: true,
  },
})

// Helper: Safely parse value
const getValue = (val) => {
  const v = parseFloat(val)
  return isNaN(v) ? null : v
}

// 1. Temperature Coloring
// Uses explicit CSS variables to respect Dark/Light mode overrides
const getTempStyle = (temp) => {
  const val = getValue(temp)
  if (val === null) return { color: 'var(--color-text-light)' }

  if (val >= 35) return { color: 'var(--color-red-600)' } // Extreme Heat
  if (val >= 30) return { color: 'var(--color-orange-600)' } // Hot
  if (val >= 25) return { color: 'var(--color-green-600)' } // Comfortable
  if (val >= 20) return { color: 'var(--color-primary)' } // Cool (Blue)
  return { color: 'var(--color-purple-600)' } // Cold
}

// 2. Humidity Coloring
const getHumidityStyle = (humidity) => {
  const val = getValue(humidity)
  if (val === null) return { color: 'var(--color-text-light)' }

  if (val >= 80) return { color: 'var(--color-primary)' } // Wet
  if (val >= 60) return { color: 'var(--color-green-600)' } // Comfortable
  if (val >= 40) return { color: 'var(--color-orange-600)' } // Dry
  return { color: 'var(--color-red-600)' } // Very Dry
}

// 3. Rainfall Coloring
const getRainfallStyle = (rainfall) => {
  const val = getValue(rainfall)
  // If 0 or null, use light text to reduce visual noise
  if (val === null || val === 0) return { color: 'var(--color-text-light)', opacity: 0.7 }

  if (val < 2.5) return { color: 'var(--color-primary)' } // Light Rain
  if (val < 10) return { color: 'var(--color-orange-600)' } // Moderate
  if (val < 50) return { color: 'var(--color-red-600)' } // Heavy
  return { color: 'var(--color-red-800)' } // Extreme
}
</script>
