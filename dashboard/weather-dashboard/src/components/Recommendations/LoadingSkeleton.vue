<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div
      v-for="n in 3"
      :key="n"
      class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 animate-pulse"
    >
      <div class="flex items-center mb-3">
        <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div class="ml-4 h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
      <div class="space-y-2">
        <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-full"></div>
        <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-5/6"></div>
        <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-4/6"></div>
      </div>
    </div>
  </div>
</template>
