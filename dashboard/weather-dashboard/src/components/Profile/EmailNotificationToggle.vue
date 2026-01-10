<template>
  <div class="group transition-colors duration-300 hover:bg-hover/40">
    <div class="flex items-center justify-between p-5 min-h-[5rem]">
      <div class="flex items-center gap-5 mr-4">
        <div
          class="flex-shrink-0 transition-colors duration-300"
          :class="
            modelValue
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-text-light group-hover:text-blue-500'
          "
        >
          <Icon icon="ph:envelope-simple" class="w-6 h-6" />
        </div>

        <div>
          <p class="text-sm font-medium text-text-main leading-none">Email Notifications</p>
          <p class="text-xs text-text-light mt-1.5 leading-tight">
            Get alerts when thresholds are exceeded
          </p>
        </div>
      </div>

      <div class="flex-shrink-0 ml-auto flex items-center">
        <ToggleSwitch :model-value="modelValue" @update:model-value="handleToggle" />
      </div>
    </div>

    <Transition name="slide-fade">
      <div v-if="modelValue" class="pb-6 pl-[4.5rem] pr-6">
        <div class="pl-4 border-l-2 border-blue-500/30">
          <div class="flex items-center gap-3">
            <img
              v-if="googlePhoto"
              :src="googlePhoto"
              alt="User Avatar"
              class="w-8 h-8 rounded-full border border-border shadow-sm object-cover"
              referrerpolicy="no-referrer"
            />

            <div
              v-else
              class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-200 dark:border-blue-800"
            >
              {{ getInitials(userEmail) }}
            </div>

            <div class="flex-1">
              <p class="text-xs text-text-main">
                Active for:
                <span class="font-medium text-blue-600 dark:text-blue-400">{{ userEmail }}</span>
              </p>
              <p class="text-[10px] text-text-light mt-0.5 opacity-70">
                Using your Google account email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

defineProps({
  modelValue: Boolean,
  userEmail: String,
})

const emit = defineEmits(['update:modelValue'])

const googlePhoto = ref(null)
const currentUser = ref(null)

onMounted(() => {
  const auth = getAuth()

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = user

      if (user.photoURL) {
        googlePhoto.value = user.photoURL
        console.log('Found Main Photo:', user.photoURL)
      } else if (user.providerData && user.providerData.length > 0) {
        const providerWithPhoto = user.providerData.find((p) => p.photoURL)
        if (providerWithPhoto) {
          googlePhoto.value = providerWithPhoto.photoURL
          console.log('Found Provider Photo:', providerWithPhoto.photoURL)
        }
      }
    }
  })
})

const handleToggle = async (value) => {
  emit('update:modelValue', value)

  if (currentUser.value) {
    try {
      await setDoc(
        doc(db, 'users', currentUser.value.uid),
        {
          email: currentUser.value.email,
          emailNotificationsEnabled: value,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )

      console.log(`✅ Email notifications ${value ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('❌ Error updating email notifications:', error)
    }
  }
}

const getInitials = (email) => {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-bottom: 0;
}
</style>
