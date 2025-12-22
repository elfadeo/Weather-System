<template>
  <div class="mb-10">
    <h1 class="text-4xl font-bold text-text-main tracking-tight">{{ title }}</h1>
    <p class="text-text-light mt-2">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>
