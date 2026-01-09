<template>
  <div
    class="group relative p-4 sm:p-5 transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-white/5"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div
          class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500"
          :class="[userRequest ? statusColors.bgSoft : 'bg-gray-100 dark:bg-white/10']"
        >
          <Icon
            :icon="statusIcon"
            class="w-5 h-5 transition-colors duration-300"
            :class="statusColors.text"
          />
        </div>

        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold text-text-main tracking-tight">SMS Notifications</h3>

          <div class="flex items-center gap-2">
            <div class="relative flex h-1.5 w-1.5" v-if="userRequest?.status === 'approved'">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                :class="statusColors.dot"
              ></span>
              <span
                class="relative inline-flex rounded-full h-1.5 w-1.5"
                :class="statusColors.dot"
              ></span>
            </div>
            <span
              v-else
              class="relative inline-flex rounded-full h-1.5 w-1.5"
              :class="statusColors.dot"
            ></span>

            <p class="text-xs font-medium text-text-light opacity-80">
              {{ statusText }}
            </p>
          </div>
        </div>
      </div>

      <button
        @click="openModal"
        class="shrink-0 px-4 py-1.5 bg-transparent border border-border text-text-main text-[11px] font-semibold uppercase tracking-wider rounded-full hover:bg-text-main hover:text-background transition-all duration-300"
      >
        {{ userRequest ? 'Manage' : 'Enable' }}
      </button>
    </div>
  </div>

  <Transition name="modal">
    <div
      v-if="showModal"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/20 backdrop-blur-md"
      @click.self="closeModal"
    >
      <div
        class="bg-surface border border-border/50 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] transition-all transform duration-500"
      >
        <div class="px-8 pt-8 pb-2 flex items-start justify-between bg-surface shrink-0">
          <div>
            <h2 class="text-xl font-bold text-text-main tracking-tight">SMS Setup</h2>
            <p class="text-xs text-text-light mt-1 font-medium">Emergency weather alerts</p>
          </div>
          <button
            @click="closeModal"
            class="p-2 -mr-2 -mt-2 text-text-light/50 hover:text-text-main transition-colors rounded-full"
          >
            <Icon icon="ph:x" class="w-5 h-5" />
          </button>
        </div>

        <div class="px-8 py-6 overflow-y-auto custom-scrollbar">
          <!-- Loading State -->
          <div v-if="loading" class="py-12 flex flex-col items-center justify-center opacity-50">
            <Icon icon="ph:spinner-gap" class="animate-spin w-6 h-6 text-text-main mb-2" />
            <p class="text-[10px] font-bold uppercase tracking-widest text-text-light">Syncing</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="py-8 space-y-4">
            <div class="flex flex-col items-center text-center">
              <div
                class="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3"
              >
                <Icon icon="ph:warning" class="w-6 h-6 text-red-500" />
              </div>
              <h3 class="text-sm font-bold text-text-main">Connection Error</h3>
              <p class="text-xs text-text-light mt-1">{{ error }}</p>
            </div>
            <button
              @click="retryLoad"
              class="w-full py-3 bg-text-main text-background font-bold rounded-2xl hover:opacity-90 transition-all text-sm"
            >
              Retry
            </button>
          </div>

          <!-- New Request Form -->
          <div v-else-if="!userRequest" class="space-y-8">
            <div
              class="text-xs text-text-light leading-relaxed opacity-80 pl-3 border-l-2 border-primary/30"
            >
              Receive critical alerts directly to your mobile device. Strictly emergency use only.
            </div>

            <div class="space-y-5">
              <div class="group">
                <label
                  class="block text-[10px] font-bold text-text-light uppercase tracking-widest mb-2 ml-1"
                >
                  Mobile Number
                </label>
                <div class="relative flex items-center">
                  <span
                    class="absolute left-4 text-text-light text-sm font-mono select-none pointer-events-none transition-colors group-focus-within:text-primary"
                    >+63</span
                  >
                  <input
                    v-model="phoneInputModel"
                    type="tel"
                    maxlength="10"
                    placeholder="917 000 0000"
                    class="w-full pl-12 pr-10 py-3.5 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-text-main placeholder:text-text-light/30 text-sm font-mono focus:ring-1 focus:ring-primary/50 transition-all"
                    @input="validatePhoneInput"
                    :disabled="submitting"
                  />
                  <div
                    class="absolute right-4 transition-all duration-300"
                    :class="isValidPhone ? 'scale-100 opacity-100' : 'scale-50 opacity-0'"
                  >
                    <Icon icon="ph:check-circle-fill" class="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div
                  v-if="phoneError"
                  class="mt-2 ml-1 text-[10px] text-red-500 font-medium flex items-center gap-1"
                >
                  <Icon icon="ph:warning-circle" class="w-3 h-3" />
                  {{ phoneError }}
                </div>
              </div>

              <div>
                <label
                  class="block text-[10px] font-bold text-text-light uppercase tracking-widest mb-2 ml-1"
                >
                  Label <span class="opacity-50 font-normal normal-case">(Optional)</span>
                </label>
                <input
                  v-model="requestLabel"
                  type="text"
                  placeholder="e.g. My iPhone"
                  maxlength="30"
                  class="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-text-main placeholder:text-text-light/30 text-sm focus:ring-1 focus:ring-primary/50 transition-all"
                  :disabled="submitting"
                />
              </div>
            </div>

            <button
              @click="submitRequest"
              :disabled="!isValidPhone || submitting"
              class="w-full py-4 bg-text-main text-background font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-xl shadow-text-main/10"
            >
              <Icon v-if="submitting" icon="ph:spinner-gap-bold" class="animate-spin w-4 h-4" />
              <span>{{ submitting ? 'Processing' : 'Register Device' }}</span>
            </button>
          </div>

          <!-- Pending Status -->
          <div v-else-if="userRequest.status === 'pending'" class="space-y-8 py-4">
            <div class="flex flex-col items-center text-center space-y-4">
              <div class="relative">
                <div class="absolute inset-0 bg-orange-400 blur-xl opacity-20 rounded-full"></div>
                <Icon
                  icon="ph:hourglass-simple-medium"
                  class="relative w-12 h-12 text-orange-500"
                />
              </div>
              <div>
                <h3 class="text-lg font-bold text-text-main">Reviewing</h3>
                <p class="text-xs text-text-light mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Admin approval is required for new devices.
                </p>
              </div>
            </div>

            <div class="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-[10px] uppercase tracking-widest text-text-light">Number</span>
                <span class="font-mono text-sm font-semibold text-text-main">{{
                  formatPhoneDisplay(userRequest.phone)
                }}</span>
              </div>
              <div class="h-px bg-border/50 w-full"></div>
              <div class="flex justify-between items-center">
                <span class="text-[10px] uppercase tracking-widest text-text-light">Requested</span>
                <span class="text-xs font-medium text-text-main">{{
                  formatDate(userRequest.requestedAt)
                }}</span>
              </div>
            </div>

            <button
              @click="cancelRequest"
              :disabled="submitting"
              class="w-full py-3.5 border border-border rounded-2xl text-xs font-semibold text-text-light hover:text-red-500 hover:border-red-200 hover:bg-red-50/10 transition-all disabled:opacity-50"
            >
              {{ submitting ? 'Canceling...' : 'Cancel Request' }}
            </button>
          </div>

          <!-- Approved Status -->
          <div v-else-if="userRequest.status === 'approved'" class="space-y-8">
            <div
              class="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-500/5 dark:from-green-400/10 dark:to-transparent border border-green-500/20 rounded-2xl p-6"
            >
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span
                    class="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400"
                    >Active</span
                  >
                </div>
                <Icon icon="ph:shield-check-fill" class="w-5 h-5 text-green-500" />
              </div>

              <div class="space-y-1">
                <h3 class="text-2xl font-mono font-bold text-text-main tracking-tight">
                  {{ formatPhoneDisplay(userRequest.phone) }}
                </h3>
                <p class="text-sm text-text-light">{{ userRequest.label || 'Primary Device' }}</p>
              </div>
            </div>

            <div class="flex gap-3 px-2">
              <Icon icon="ph:check" class="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p class="text-xs text-text-light leading-relaxed">
                System connected. You will receive high-priority SMS alerts on this number.
              </p>
            </div>

            <button
              @click="removeNumber"
              :disabled="submitting"
              class="w-full py-3.5 text-red-500 text-xs font-bold hover:bg-red-50/50 dark:hover:bg-red-900/10 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Icon icon="ph:trash-simple" />
              {{ submitting ? 'Disconnecting...' : 'Disconnect' }}
            </button>
          </div>

          <!-- Rejected Status -->
          <div v-else-if="userRequest.status === 'rejected'" class="space-y-6">
            <div class="flex flex-col items-center text-center pt-4 space-y-2">
              <div
                class="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-2"
              >
                <Icon icon="ph:x" class="w-6 h-6 text-red-500" />
              </div>
              <h3 class="text-lg font-bold text-text-main">Request Declined</h3>
              <p class="text-xs text-red-500/80 max-w-[200px] leading-relaxed">
                {{ userRequest.rejectionReason || 'No reason provided.' }}
              </p>
            </div>

            <div
              class="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center"
            >
              <span class="text-xs text-text-light font-mono">{{
                formatPhoneDisplay(userRequest.phone)
              }}</span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-red-400"
                >Rejected</span
              >
            </div>

            <button
              @click="deleteAndRetry"
              :disabled="submitting"
              class="w-full py-4 bg-text-main text-background font-bold rounded-2xl hover:opacity-90 transition-all text-sm shadow-xl shadow-text-main/10 disabled:opacity-50"
            >
              {{ submitting ? 'Processing...' : 'Try Again' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { db, auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'

// Valid Philippine mobile prefixes
const VALID_PREFIXES = [
  // Globe & Touch Mobile (TM)
  '817',
  '905', '906', '915', '916', '917',
  '926', '927', '935', '936', '937',
  '945', '953', '954', '955', '956', '957',
  '975', '976', '977', '978', '979',
  '994', '995', '996', '997',

  // Smart Communications
  '908', '909', '910', '911', '912', '913', '914',
  '918', '919', '920', '921', '928', '929', '930',
  '938', '939', '946', '947', '948', '949', '950', '951',
  '960', '961', '963', '965', '966', '967',
  '980', '981', '989',

  // Sun Cellular
  '922', '923', '924', '925',
  '931', '932', '933', '934',
  '940', '941', '942', '943', '944',

  // Dito Telecommunity
  '895', '896', '897', '898',
  '991', '992', '993', '998', '999',

  // PLDT & Others
  '900', '901', '902', '903', '904', '907',
  '958', '959', '968', '969', '970',
  '971', '972', '973', '974',
  '982', '983', '984', '985', '986', '987', '988', '990',
]

// --- State ---
const showModal = ref(false)
const loading = ref(false)
const submitting = ref(false)
const error = ref(null)
const userRequest = ref(null)
const authUnsubscribe = ref(null)
const isAuthReady = ref(false)

// Form Input
const phoneInputModel = ref('')
const requestLabel = ref('')
const phoneError = ref('')

// --- Computed Visuals ---
const statusColors = computed(() => {
  if (!userRequest.value)
    return { bgSoft: 'bg-gray-100 dark:bg-white/5', text: 'text-text-light', dot: 'bg-gray-300' }
  switch (userRequest.value.status) {
    case 'approved':
      return {
        bgSoft: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        dot: 'bg-green-500',
      }
    case 'pending':
      return {
        bgSoft: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        dot: 'bg-orange-500',
      }
    case 'rejected':
      return {
        bgSoft: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        dot: 'bg-red-500',
      }
    default:
      return { bgSoft: 'bg-gray-100 dark:bg-white/5', text: 'text-text-light', dot: 'bg-gray-300' }
  }
})

const statusIcon = computed(() => {
  if (!userRequest.value) return 'ph:device-mobile-camera'
  switch (userRequest.value.status) {
    case 'approved':
      return 'ph:check'
    case 'pending':
      return 'ph:hourglass'
    case 'rejected':
      return 'ph:warning-circle'
    default:
      return 'ph:device-mobile'
  }
})

const statusText = computed(() => {
  if (!userRequest.value) return 'Not Configured'
  switch (userRequest.value.status) {
    case 'approved':
      return 'Active'
    case 'pending':
      return 'Pending Approval'
    case 'rejected':
      return 'Action Required'
    default:
      return 'Unknown'
  }
})

const isValidPhone = computed(() => {
  if (phoneInputModel.value.length !== 10) return false
  const prefix = phoneInputModel.value.substring(0, 3)
  return VALID_PREFIXES.includes(prefix)
})

// --- Validation & Formatting ---
function validatePhoneInput() {
  phoneInputModel.value = phoneInputModel.value.replace(/\D/g, '')

  if (phoneInputModel.value.length === 0) {
    phoneError.value = ''
  } else if (!/^9/.test(phoneInputModel.value)) {
    phoneError.value = 'Must start with 9'
  } else if (phoneInputModel.value.length >= 3) {
    const prefix = phoneInputModel.value.substring(0, 3)
    if (!VALID_PREFIXES.includes(prefix)) {
      phoneError.value = 'Invalid network prefix'
    } else {
      phoneError.value = ''
    }
  } else {
    phoneError.value = ''
  }
}

function formatPhoneDisplay(phone) {
  if (!phone) return ''
  if (phone.startsWith('+63')) {
    const digits = phone.substring(3)
    return `0${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`
  }
  return phone
}

function formatDate(timestamp) {
  if (!timestamp) return 'Just now'
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (err) {
    console.error('Date formatting error:', err)
    return 'Recently'
  }
}

// --- Firebase Actions ---
async function loadUserRequest() {
  if (!isAuthReady.value || !auth.currentUser) {
    console.log('Auth not ready or no user, skipping load')
    return
  }

  loading.value = true
  error.value = null

  try {
    const userId = auth.currentUser.uid
    const q = query(collection(db, 'sms_requests'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data()
      userRequest.value = { id: querySnapshot.docs[0].id, ...data }
      console.log('User request loaded:', userRequest.value.status)
    } else {
      console.log('No request found for user')
      userRequest.value = null
    }
  } catch (err) {
    console.error('Load error:', err)
    error.value = 'Failed to load your SMS settings. Please try again.'
  } finally {
    loading.value = false
  }
}

async function submitRequest() {
  if (!isValidPhone.value || submitting.value) return

  submitting.value = true
  error.value = null

  try {
    const formattedPhone = `+63${phoneInputModel.value}`

    await addDoc(collection(db, 'sms_requests'), {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      phone: formattedPhone,
      label: requestLabel.value.trim() || 'Primary Mobile',
      status: 'pending',
      requestedAt: serverTimestamp(),
    })

    phoneInputModel.value = ''
    requestLabel.value = ''
    phoneError.value = ''

    await loadUserRequest()
  } catch (err) {
    console.error('Submit error:', err)
    error.value = 'Failed to submit request: ' + err.message
  } finally {
    submitting.value = false
  }
}

async function cancelRequest() {
  if (submitting.value) return
  await deleteRequest()
}

async function removeNumber() {
  if (submitting.value) return
  await deleteRequest(true)
}

async function deleteAndRetry() {
  if (submitting.value) return
  await deleteRequest()
}

async function deleteRequest(checkRecipients = false) {
  submitting.value = true
  error.value = null

  try {
    if (userRequest.value?.id) {
      await deleteDoc(doc(db, 'sms_requests', userRequest.value.id))
    }

    if (checkRecipients) {
      const q = query(collection(db, 'sms_recipients'), where('userId', '==', auth.currentUser.uid))
      const snap = await getDocs(q)
      const deletions = snap.docs.map((d) => deleteDoc(doc(db, 'sms_recipients', d.id)))
      await Promise.all(deletions)
    }

    userRequest.value = null
  } catch (err) {
    console.error('Delete error:', err)
    error.value = 'Failed to process request. Please try again.'
  } finally {
    submitting.value = false
  }
}

function openModal() {
  showModal.value = true
  // Refresh data when opening modal to ensure it's up-to-date
  if (isAuthReady.value && auth.currentUser) {
    loadUserRequest()
  }
}

function closeModal() {
  showModal.value = false
  phoneError.value = ''
  error.value = null
}

function retryLoad() {
  error.value = null
  loadUserRequest()
}

// --- Lifecycle ---
onMounted(() => {
  authUnsubscribe.value = onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? user.email : 'No user')
    isAuthReady.value = true

    if (user) {
      // Always load on auth, not just when modal is open
      loadUserRequest()
    } else {
      userRequest.value = null
    }
  })
})

onUnmounted(() => {
  if (authUnsubscribe.value) {
    authUnsubscribe.value()
    authUnsubscribe.value = null
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-light);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-surface {
  transition:
    transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.3s ease;
}
.modal-leave-active .bg-surface {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.modal-enter-from .bg-surface {
  opacity: 0;
  transform: scale(0.95) translateY(15px);
}
.modal-leave-to .bg-surface {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
