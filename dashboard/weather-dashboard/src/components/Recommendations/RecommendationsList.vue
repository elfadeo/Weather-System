<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <RecommendationCard
      v-for="(rec, index) in recommendations"
      :key="index"
      :recommendation="rec"
    />
  </div>
</template>

<script setup>
import RecommendationCard from './RecommendationCard.vue'

defineProps({
  recommendations: { type: Array, required: true },
})
</script>
