<template>
  <div class="mb-10">
    <h1 class="text-4xl font-bold text-text-main tracking-tight">{{ title }}</h1>
    <p class="text-text-light mt-2">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>
