<template>
  <div
    class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden transition-all hover:shadow-md duration-500"
  >
    <div
      class="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/60 bg-background/50 backdrop-blur-sm"
    >
      <h2 class="text-base sm:text-lg font-semibold text-text-main">Notifications</h2>
      <p class="text-xs text-text-light mt-1">Manage how you receive alerts and updates.</p>
    </div>

    <div class="divide-y divide-border/60">
      <EmailNotificationToggle
        :user-email="email"
        :user-id="userId"
        :model-value="emailEnabled"
        @update:model-value="$emit('update:email-enabled', $event)"
      />

      <PushNotificationToggle :user-id="userId" />

      <SmsNotificationSettings
        :enabled="smsEnabled"
        :phone-numbers="phoneNumbers"
        @update:enabled="$emit('update:sms-enabled', $event)"
        @update:phone-field="$emit('update:phone-field', $event)"
        @add-number="$emit('add-number')"
        @remove-number="$emit('remove-number', $event)"
        @validate-number="$emit('validate-number', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import EmailNotificationToggle from './EmailNotificationToggle.vue'
import PushNotificationToggle from './PushNotificationToggle.vue'
import SmsNotificationSettings from './SmsNotificationSettings.vue'

defineProps({
  email: String,
  userId: String,
  emailEnabled: { type: Boolean, default: false },
  smsEnabled: { type: Boolean, default: false },
  phoneNumbers: { type: Array, default: () => [] },
})

defineEmits([
  'update:email-enabled',
  'update:sms-enabled',
  'update:phone-field',
  'add-number',
  'remove-number',
  'validate-number',
])
</script>
