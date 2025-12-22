<template>
  <div>
    <LoadingSkeleton v-if="isGenerating" />
    <ErrorMessage v-else-if="generationError" :error="generationError" @retry="$emit('retry')" />
    <EmptyState v-else-if="!recommendations.length" />
    <RecommendationsList v-else :recommendations="recommendations" />
  </div>
</template>

<script setup>
import LoadingSkeleton from './LoadingSkeleton.vue'
import ErrorMessage from './ErrorMessage.vue'
import EmptyState from './EmptyState.vue'
import RecommendationsList from './RecommendationsList.vue'

defineProps({
  isGenerating: { type: Boolean, default: false },
  generationError: { type: String, default: null },
  recommendations: { type: Array, default: () => [] },
})

defineEmits(['retry'])
</script>
