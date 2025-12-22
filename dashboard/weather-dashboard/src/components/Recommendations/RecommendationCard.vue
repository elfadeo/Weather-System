<template>
  <div
    class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
  >
    <div class="flex items-center mb-3">
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        :class="iconDetails.bg"
      >
        <Icon :icon="iconDetails.icon" class="h-6 w-6" :class="iconDetails.text" />
      </div>
      <h3 class="ml-4 text-lg font-bold text-text-main">
        {{ recommendation.category }}
      </h3>
    </div>
    <p class="text-text-light leading-relaxed">
      {{ recommendation.recommendation }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getCategoryIcon } from '@/utils/categoryIcons.js'

const props = defineProps({
  recommendation: { type: Object, required: true },
})

const iconDetails = computed(() => getCategoryIcon(props.recommendation.category))
</script>
