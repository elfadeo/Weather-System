<template>
  <div class="min-h-screen bg-background">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader title="Profile Settings" />

      <LoadingSpinner v-if="isLoading" />

      <div v-else-if="user" class="space-y-6">
        <ProfileInformationCard
          :profile="profile"
          :email="user.email"
          @update:display-name="profile.displayName = $event"
          @update:location="profile.location = $event"
        />

        <NotificationSettingsCard
          :email="user.email"
          :user-id="user.uid"
          :email-enabled="profile.emailNotifications"
          :sms-enabled="smsSettings?.enabled || false"
          :phone-numbers="smsSettings?.phoneNumbers || []"
          @update:email-enabled="profile.emailNotifications = $event"
          @update:sms-enabled="handleSmsToggle"
          @update:phone-field="handlePhoneFieldUpdate"
          @add-number="addPhoneNumber"
          @remove-number="removePhoneNumber"
          @validate-number="validatePhoneNumber"
        />

        <SystemInfoBanner />
      </div>

      <SaveButton
        v-if="user"
        :has-changes="hasChanges"
        :is-saving="isSaving"
        :status="saveStatus"
        @save="handleSave"
        @discard="resetChanges"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthState } from '@/composables/useAuthState'
import { useProfileData } from '@/composables/useProfileData'
import { useSmsSettings } from '@/composables/useSmsSettings'
import { useProfileSave } from '@/composables/useProfileSave'
import { validatePhoneNumber as validatePhone, isDuplicateNumber } from '@/utils/phoneUtils'

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PageHeader from '@/components/Profile/PageHeader.vue'
import ProfileInformationCard from '@/components/Profile/ProfileInformationCard.vue'
import NotificationSettingsCard from '@/components/Profile/NotificationSettingsCard.vue'
import SystemInfoBanner from '@/components/Profile/SystemInfoBanner.vue'
import SaveButton from '@/components/Profile/SaveButton.vue'

const router = useRouter()

// Composables
const { user, isLoading } = useAuthState(router)
const { profile, originalProfile, fetchUserProfile } = useProfileData(user)
const { smsSettings, originalSmsSettings, fetchSmsSettings } = useSmsSettings()
const { isSaving, saveStatus, saveProfile } = useProfileSave(
  user,
  profile,
  originalProfile,
  smsSettings,
  originalSmsSettings,
)

// Computed
const hasChanges = computed(() => {
  const profileChanged = JSON.stringify(profile.value) !== JSON.stringify(originalProfile.value)
  const smsChanged = JSON.stringify(smsSettings.value) !== JSON.stringify(originalSmsSettings.value)
  return profileChanged || smsChanged
})

// Watch for user changes
watch(
  user,
  async (newUser) => {
    if (newUser) {
      await fetchUserProfile(newUser.uid)
      await fetchSmsSettings()
    }
  },
  { immediate: true },
)

// Methods
const handleSmsToggle = (enabled) => {
  if (!smsSettings.value) {
    smsSettings.value = { enabled: false, phoneNumbers: [] }
  }

  smsSettings.value.enabled = enabled

  if (enabled && (!smsSettings.value.phoneNumbers || smsSettings.value.phoneNumbers.length === 0)) {
    addPhoneNumber()
  }
}

// NEW: Handle phone field updates
const handlePhoneFieldUpdate = ({ index, field, value }) => {
  if (!smsSettings.value?.phoneNumbers?.[index]) return

  smsSettings.value.phoneNumbers[index][field] = value
}

const addPhoneNumber = () => {
  if (!smsSettings.value) {
    smsSettings.value = { enabled: true, phoneNumbers: [] }
  }
  if (!smsSettings.value.phoneNumbers) {
    smsSettings.value.phoneNumbers = []
  }

  if (smsSettings.value.phoneNumbers.length < 5) {
    smsSettings.value.phoneNumbers.push({
      id: Date.now() + Math.random(),
      number: '',
      label: '',
      error: '',
    })
  }
}

const removePhoneNumber = (index) => {
  if (smsSettings.value?.phoneNumbers) {
    smsSettings.value.phoneNumbers.splice(index, 1)
  }
}

const validatePhoneNumber = (index) => {
  if (!smsSettings.value?.phoneNumbers?.[index]) return

  const phone = smsSettings.value.phoneNumbers[index]
  phone.error = ''

  const formatError = validatePhone(phone.number)
  if (formatError) {
    phone.error = formatError
    return
  }

  if (isDuplicateNumber(phone.number, smsSettings.value.phoneNumbers, index)) {
    phone.error = 'This number is already added'
  }
}

const resetChanges = () => {
  profile.value = { ...originalProfile.value }
  smsSettings.value = JSON.parse(JSON.stringify(originalSmsSettings.value))
}

const handleSave = async () => {
  await saveProfile()
}
</script>
