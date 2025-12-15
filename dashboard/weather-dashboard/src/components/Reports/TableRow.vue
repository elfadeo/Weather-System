<template>
  <tr class="hover:bg-background dark:hover:bg-hover transition-colors">
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
      {{ record.period }}
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
      <span
        :class="[
          'inline-flex items-center px-2 py-0.5 rounded leading-none',
          getTempColor(record.temperature),
        ]"
      >
        {{ record.temperature }}
      </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
      <span
        :class="[
          'inline-flex items-center px-2 py-0.5 rounded leading-none',
          getHumidityColor(record.humidity),
        ]"
      >
        {{ record.humidity }}
      </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
      {{ record.rainfallRate }}
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-main">
      <span
        :class="[
          'inline-flex items-center px-2 py-0.5 rounded font-medium leading-none',
          getRainfallColor(record.periodRainfall),
        ]"
      >
        {{ record.periodRainfall }}
      </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">
      {{ record.count }}
    </td>
  </tr>
</template>

<script setup>
import { useColorHelpers } from '@/composables/useColorHelpers'

defineProps({
  record: {
    type: Object,
    required: true,
  },
})

const { getTempColor, getHumidityColor, getRainfallColor } = useColorHelpers()
</script>
