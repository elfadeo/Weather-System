<template>
  <div class="flex items-center pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-border">
    <div class="relative flex-shrink-0">
      <div
        class="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl sm:text-3xl font-bold shadow-lg"
      >
        <img
          v-if="photoUrl && typeof photoUrl === 'string' && photoUrl.trim() !== ''"
          :src="photoUrl"
          alt="Profile Avatar"
          class="w-full h-full object-cover"
        />
        <span v-else>{{ avatarInitials }}</span>
      </div>
    </div>

    <div class="ml-3 sm:ml-4 min-w-0 flex-1">
      <p class="text-base sm:text-lg font-semibold text-text-main truncate">
        {{ displayName || 'No name set' }}
      </p>
      <p class="text-xs sm:text-sm text-text-light truncate">{{ email }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  displayName: {
    type: String,
    default: '',
  },
  photoUrl: {
    type: String,
    default: '',
  },
  avatarInitials: {
    type: String,
    default: '?',
  },
  email: {
    type: String,
    default: '',
  },
})
</script>
