<template>
  <div class="bg-surface rounded-2xl shadow-sm border border-border p-6">
    <h2 class="text-lg font-semibold text-text-main mb-6">Profile Information</h2>

    <ProfileAvatar
      :display-name="profile.displayName"
      :photo-url="profile.photoURL"
      :avatar-initials="initials"
      :email="email"
    />

    <div class="space-y-4">
      <FormInput
        label="Email Address"
        type="email"
        :model-value="email"
        disabled
        helper-text="Email cannot be changed"
      />

      <FormInput
        label="Display Name"
        type="text"
        :model-value="profile.displayName"
        placeholder="e.g., Juan Dela Cruz"
        @update:model-value="$emit('update:display-name', $event)"
      />

      <FormInput
        label="Location"
        type="text"
        :model-value="profile.location"
        placeholder="e.g., Manila, Philippines"
        helper-text="This helps in providing more localized recommendations"
        @update:model-value="$emit('update:location', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProfileAvatar from './ProfileAvatar.vue'
import FormInput from '@/components/common/FormInput.vue'

const props = defineProps({
  profile: {
    type: Object,
    required: true,
    default: () => ({ displayName: '', location: '', photoURL: '' }),
  },
  email: {
    type: String,
    default: '',
  },
})

defineEmits(['update:display-name', 'update:location'])

const initials = computed(() => {
  const name = props.profile.displayName || props.email || ''
  if (!name) return '?'

  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>
