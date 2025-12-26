<template>
  <div class="flex items-center pb-6 mb-6 border-b border-border">
    <div class="relative">
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold shadow-lg"
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

    <div class="ml-4">
      <p class="text-lg font-semibold text-text-main">
        {{ displayName || 'No name set' }}
      </p>
      <p class="text-sm text-text-light">{{ email }}</p>
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
