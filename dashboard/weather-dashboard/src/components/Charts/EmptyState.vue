<template>
  <div class="flex h-full w-full items-center justify-center">
    <div class="flex flex-col items-center text-center">
      <div class="mb-3 rounded-full bg-[var(--color-background)] p-3">
        <svg
          class="h-6 w-6 text-[var(--color-text-light)] opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-[var(--color-text-light)]">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'No data available'
  }
})
</script>
