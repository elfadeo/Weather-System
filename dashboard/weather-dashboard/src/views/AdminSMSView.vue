<template>
  <div class="min-h-screen bg-background text-text-main font-sans transition-colors duration-300">
    <header class="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20"
            >
              <Icon icon="ph:shield-check-fill" class="w-5 h-5 text-primary-text" />
            </div>
            <div>
              <h1 class="text-base font-bold text-text-main leading-none">SMS Admin</h1>
              <p class="text-[10px] font-bold text-text-light uppercase tracking-widest mt-0.5">
                Admin Console
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="hidden sm:flex flex-col items-end">
              <span class="text-xs font-bold text-text-main">System Admin</span>
              <span class="text-[10px] text-text-light font-mono">{{ currentUserEmail }}</span>
            </div>

            <div class="h-6 w-px bg-border hidden sm:block"></div>

            <button
              @click="loadAllData"
              :disabled="loading"
              class="group relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface hover:bg-hover text-text-light hover:text-primary transition-all active:scale-95"
              title="Sync Data"
            >
              <Icon
                icon="ph:arrows-clockwise-bold"
                class="w-4 h-4 transition-transform duration-700"
                :class="{ 'animate-spin': loading }"
              />
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <nav class="flex space-x-1 bg-surface p-1.5 rounded-xl border border-border shadow-sm">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-3"
            :class="[
              activeTab === tab.key
                ? 'bg-hover text-primary shadow-sm ring-1 ring-border'
                : 'text-text-light hover:text-text-main hover:bg-background',
            ]"
          >
            <Icon :icon="tab.icon" class="w-4 h-4" />
            <span>{{ tab.name }}</span>

            <span
              v-if="tab.count > 0"
              class="flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-extrabold leading-none transition-colors"
              :class="
                activeTab === tab.key
                  ? 'bg-primary text-primary-text'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              "
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>

        <div v-if="activeTab === 'active'" class="relative group w-full sm:w-64">
          <Icon
            icon="ph:magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-text-light w-4 h-4 group-focus-within:text-primary transition-colors"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search email or phone..."
            class="w-full bg-surface pl-9 pr-4 py-2 rounded-lg border border-border text-xs font-medium text-text-main placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      <div v-if="loading" class="py-24 flex flex-col items-center justify-center">
        <div
          class="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mb-4"
        ></div>
        <span class="text-xs font-bold text-text-light uppercase tracking-widest animate-pulse"
          >Synchronizing</span
        >
      </div>

      <div v-else-if="activeTab === 'requests'">
        <div
          v-if="pendingRequests.length === 0"
          class="flex flex-col items-center justify-center py-24 bg-surface rounded-2xl border border-border border-dashed"
        >
          <div class="bg-green-50 p-4 rounded-full mb-3 dark:bg-green-900/20">
            <Icon icon="ph:check-fat-fill" class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <p class="text-text-main font-semibold text-sm">All caught up!</p>
          <p class="text-text-light text-xs mt-1">No pending access requests.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="flex flex-col bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 overflow-hidden group"
          >
            <div class="p-5 flex-1">
              <div class="flex justify-between items-start mb-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/40 dark:text-orange-300"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Pending
                </span>
                <span class="text-[10px] text-text-light font-bold font-mono">{{
                  formatDateShort(request.requestedAt)
                }}</span>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="text-[10px] uppercase tracking-wider text-text-light font-semibold"
                    >User</label
                  >
                  <h3 class="text-sm font-bold text-text-main truncate" :title="request.userEmail">
                    {{ request.userEmail }}
                  </h3>
                </div>

                <div>
                  <label class="text-[10px] uppercase tracking-wider text-text-light font-semibold"
                    >Phone Number</label
                  >
                  <p class="text-base font-bold font-mono text-text-main tracking-wide mt-0.5">
                    {{ formatPhoneDisplay(request.phone) }}
                  </p>
                </div>
              </div>

              <div
                v-if="request.label"
                class="mt-4 inline-block px-2 py-0.5 rounded bg-background border border-border text-[10px] font-semibold text-text-main"
              >
                {{ request.label }}
              </div>
            </div>

            <div
              class="grid grid-cols-2 border-t border-border divide-x divide-border bg-background/30"
            >
              <button
                @click="openRejectModal(request)"
                class="px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 transition-colors"
              >
                Reject
              </button>
              <button
                @click="approveRequest(request)"
                class="px-4 py-3 text-xs font-bold text-primary hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'active'">
        <div class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-hover border-b border-border">
                  <th
                    class="py-3 pl-6 pr-4 text-[10px] font-bold uppercase tracking-widest text-text-light"
                  >
                    User Identity
                  </th>
                  <th
                    class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-light"
                  >
                    Contact Information
                  </th>
                  <th
                    class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-light"
                  >
                    Access Status
                  </th>
                  <th
                    class="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-light text-right pr-6"
                  >
                    Controls
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-if="filteredRecipients.length === 0">
                  <td colspan="4" class="py-12 text-center">
                    <div class="flex flex-col items-center justify-center opacity-60">
                      <Icon icon="ph:users-three" class="w-8 h-8 text-text-light mb-2" />
                      <span class="text-xs font-medium text-text-light">No recipients found</span>
                    </div>
                  </td>
                </tr>

                <tr
                  v-for="recipient in filteredRecipients"
                  :key="recipient.id"
                  class="group hover:bg-hover transition-colors"
                >
                  <td class="py-4 pl-6 pr-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/10"
                      >
                        {{ recipient.userEmail.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-text-main">{{
                          recipient.userEmail.split('@')[0]
                        }}</span>
                        <span class="text-[10px] font-medium text-text-light">{{
                          recipient.userEmail
                        }}</span>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold font-mono text-text-main tracking-wide">
                        {{ formatPhoneDisplay(recipient.phone) }}
                      </span>
                      <span
                        v-if="recipient.label"
                        class="text-[10px] text-text-light font-medium mt-0.5 flex items-center gap-1"
                      >
                        <Icon icon="ph:tag-simple-fill" class="w-3 h-3 opacity-50" />
                        {{ recipient.label }}
                      </span>
                    </div>
                  </td>

                  <td class="px-4 py-4">
                    <div class="flex items-center gap-3">
                      <button
                        @click="toggleRecipient(recipient.id, !recipient.enabled)"
                        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                        :class="recipient.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'"
                      >
                        <span
                          class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
                          :class="recipient.enabled ? 'translate-x-4.5' : 'translate-x-0.5'"
                        />
                      </button>
                      <span
                        class="text-[10px] font-bold uppercase tracking-wider"
                        :class="
                          recipient.enabled
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-text-light'
                        "
                      >
                        {{ recipient.enabled ? 'Active' : 'Paused' }}
                      </span>
                    </div>
                  </td>

                  <td class="px-4 py-4 text-right pr-6">
                    <button
                      @click="deleteRecipient(recipient)"
                      class="text-text-light hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Revoke Access"
                    >
                      <Icon icon="ph:trash-simple-bold" class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-background/50 border-t border-border px-6 py-2">
            <p class="text-[10px] font-bold text-text-light uppercase tracking-widest">
              Total Active: <span class="text-text-main">{{ filteredRecipients.length }}</span>
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'history'">
        <div class="bg-surface rounded-xl border border-border shadow-sm p-6">
          <div class="flex items-center gap-2 mb-6">
            <Icon icon="ph:scroll-bold" class="w-5 h-5 text-text-light" />
            <h3 class="text-sm font-bold text-text-main uppercase tracking-wider">
              System Audit Log
            </h3>
          </div>

          <div
            class="space-y-0 relative before:absolute before:inset-0 before:ml-2.5 before:w-px before:bg-border"
          >
            <div v-if="historyLogs.length === 0" class="pl-8 py-4">
              <p class="text-xs text-text-light italic">No system history available.</p>
            </div>

            <div v-for="log in historyLogs" :key="log.id" class="relative pl-8 py-4 group">
              <div
                class="absolute left-0 top-5 w-5 h-5 flex items-center justify-center rounded-full bg-surface border-2 z-10"
                :class="
                  log.status === 'approved'
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-red-200 dark:border-red-800'
                "
              >
                <div
                  class="w-2 h-2 rounded-full"
                  :class="log.status === 'approved' ? 'bg-green-600' : 'bg-red-600'"
                ></div>
              </div>

              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 -mt-2 rounded-lg hover:bg-hover transition-colors border border-transparent hover:border-border"
              >
                <div>
                  <p class="text-sm font-bold text-text-main">
                    <span
                      class="capitalize"
                      :class="
                        log.status === 'approved'
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      "
                      >{{ log.status }}</span
                    >:
                    {{ log.userEmail }}
                  </p>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span class="text-xs font-bold font-mono text-text-main">{{
                      formatPhoneDisplay(log.phone)
                    }}</span>

                    <span
                      v-if="log.rejectionReason"
                      class="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 rounded border border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
                    >
                      Reason: {{ log.rejectionReason }}
                    </span>
                  </div>
                </div>
                <time class="text-[10px] font-medium text-text-light font-mono whitespace-nowrap">
                  {{ formatDate(log.approvedAt || log.rejectedAt) }}
                </time>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Transition name="fade">
      <div
        v-if="showRejectModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
        @click.self="closeRejectModal"
      >
        <div
          class="bg-surface rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 ring-1 ring-border"
        >
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <div
                class="p-2 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              >
                <Icon icon="ph:warning-bold" class="w-5 h-5" />
              </div>
              <h3 class="text-sm font-bold text-text-main">Reject Request</h3>
            </div>

            <p class="text-xs text-text-light mb-4 leading-relaxed">
              Are you sure you want to reject
              <strong class="text-text-main">{{ rejectingRequest?.userEmail }}</strong
              >? This cannot be undone.
            </p>

            <div class="mb-5">
              <label
                class="block text-[10px] font-bold text-text-light uppercase tracking-widest mb-1.5"
                >Reason (Optional)</label
              >
              <textarea
                v-model="rejectionReason"
                rows="3"
                class="block w-full rounded-lg bg-background border border-border text-xs text-text-main placeholder:text-text-light focus:ring-1 focus:ring-primary focus:border-primary p-3 resize-none transition-all"
                placeholder="Ex: Invalid identity, Duplicate request..."
              ></textarea>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                @click="closeRejectModal"
                class="flex-1 py-2.5 rounded-lg border border-border bg-surface text-xs font-bold text-text-light hover:bg-hover hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                @click="confirmReject"
                class="flex-1 py-2.5 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="toast.show"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-gray-100 px-5 py-3 rounded-lg shadow-xl border border-gray-800 dark:border-gray-200"
      >
        <Icon
          :icon="toast.type === 'error' ? 'ph:warning-circle-fill' : 'ph:check-circle-fill'"
          :class="
            toast.type === 'error'
              ? 'text-red-400 dark:text-red-600'
              : 'text-green-400 dark:text-green-600'
          "
          class="w-5 h-5"
        />
        <p class="text-xs font-bold text-white dark:text-gray-900">{{ toast.message }}</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { db, auth } from '@/firebase'
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore'

// --- State Management ---
const activeTab = ref('requests')
const loading = ref(true)
const searchQuery = ref('')
const allRequests = ref([])
const activeRecipients = ref([])

// --- UI State ---
const showRejectModal = ref(false)
const rejectingRequest = ref(null)
const rejectionReason = ref('')
const toast = ref({ show: false, message: '', type: 'success' })

// --- Computed Properties ---
const currentUserEmail = computed(() => auth.currentUser?.email || 'Unknown User')

const pendingRequests = computed(() => {
  return allRequests.value.filter((r) => r.status === 'pending')
})

const historyLogs = computed(() => {
  return allRequests.value.filter((r) => r.status !== 'pending')
})

const filteredRecipients = computed(() => {
  if (!searchQuery.value) return activeRecipients.value
  const lower = searchQuery.value.toLowerCase()
  return activeRecipients.value.filter(
    (r) =>
      r.userEmail?.toLowerCase().includes(lower) ||
      r.phone?.includes(lower) ||
      r.label?.toLowerCase().includes(lower),
  )
})

const tabs = computed(() => [
  {
    name: 'Access Requests',
    key: 'requests',
    icon: 'ph:clipboard-text-bold',
    count: pendingRequests.value.length,
  },
  {
    name: 'Active Registry',
    key: 'active',
    icon: 'ph:users-three-bold',
    count: activeRecipients.value.length,
  },
  {
    name: 'Audit Logs',
    key: 'history',
    icon: 'ph:scroll-bold',
    count: 0,
  },
])

// --- Helper Functions ---
function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

function formatPhoneDisplay(phone) {
  if (!phone) return 'N/A'
  // Format +639123456789 -> 0912 345 6789
  if (phone.startsWith('+63')) {
    const digits = phone.substring(3)
    if (digits.length === 10) {
      return `0${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`
    }
  }
  return phone
}

function formatDate(timestamp) {
  if (!timestamp) return '-'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(timestamp) {
  if (!timestamp) return 'Just now'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  const now = new Date()
  const diff = now - date

  // If less than 24 hours, show time
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// --- Firebase Operations ---

/**
 * Loads both Request History and Active Recipients
 */
async function loadAllData() {
  loading.value = true
  try {
    // 1. Fetch Requests (Pending & History)
    const reqQ = query(collection(db, 'sms_requests'), orderBy('requestedAt', 'desc'))
    const reqSnap = await getDocs(reqQ)
    allRequests.value = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // 2. Fetch Active Recipients
    const recQ = query(collection(db, 'sms_recipients'), orderBy('approvedAt', 'desc'))
    const recSnap = await getDocs(recQ)
    activeRecipients.value = recSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    if (!loading.value) {
      // Only show toast on manual refresh
      showToast('System data synchronized')
    }
  } catch (error) {
    console.error(error)
    showToast('Failed to fetch data', 'error')
  } finally {
    loading.value = false
  }
}

/**
 * Approve a pending request
 */
async function approveRequest(request) {
  try {
    // 1. Update Request Status
    await updateDoc(doc(db, 'sms_requests', request.id), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: currentUserEmail.value,
    })

    // 2. Create Recipient Record
    await addDoc(collection(db, 'sms_recipients'), {
      userId: request.userId,
      userEmail: request.userEmail,
      phone: request.phone,
      label: request.label || 'Standard User',
      enabled: true,
      approvedAt: serverTimestamp(),
      approvedBy: currentUserEmail.value,
      addedBy: 'admin_panel',
    })

    await loadAllData()
    showToast(`Access granted to ${request.userEmail}`)
  } catch (error) {
    showToast('Approval failed: ' + error.message, 'error')
  }
}

/**
 * Modal Logic for Rejection
 */
function openRejectModal(request) {
  rejectingRequest.value = request
  rejectionReason.value = ''
  showRejectModal.value = true
}

function closeRejectModal() {
  showRejectModal.value = false
  setTimeout(() => {
    rejectingRequest.value = null
  }, 200) // Wait for fade out
}

async function confirmReject() {
  if (!rejectingRequest.value) return

  try {
    await updateDoc(doc(db, 'sms_requests', rejectingRequest.value.id), {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy: currentUserEmail.value,
      rejectionReason: rejectionReason.value || 'Admin discretion',
    })
    closeRejectModal()
    await loadAllData()
    showToast('Request rejected')
  } catch (error) {
    showToast('Rejection failed: ' + error.message, 'error')
  }
}

/**
 * Toggle Recipient Status (Active/Paused)
 */
async function toggleRecipient(id, currentState) {
  // Optimistic UI update
  const recipient = activeRecipients.value.find((r) => r.id === id)
  const originalState = !currentState

  if (recipient) recipient.enabled = currentState

  try {
    await updateDoc(doc(db, 'sms_recipients', id), { enabled: currentState })
    showToast(currentState ? 'Recipient activated' : 'Recipient paused')
  } catch (error) {
    console.error('Toggle failed:', error)
    // Revert on failure
    if (recipient) recipient.enabled = originalState
    showToast('Update failed: ' + error.message, 'error')
  }
}

/**
 * Permanently Delete Recipient
 */
async function deleteRecipient(recipient) {
  const confirmMsg = `Are you sure you want to remove ${recipient.userEmail}? \n\nThis will immediately revoke their SMS access.`
  if (!confirm(confirmMsg)) return

  try {
    // 1. Delete from Registry
    await deleteDoc(doc(db, 'sms_recipients', recipient.id))

    // 2. Optional: Clean up associated requests to keep history clean
    // (Or keep them for audit - here we delete for full cleanup)
    const q = query(collection(db, 'sms_requests'), where('userId', '==', recipient.userId))
    const snap = await getDocs(q)
    const deletions = snap.docs.map((d) => deleteDoc(doc(db, 'sms_requests', d.id)))
    await Promise.all(deletions)

    await loadAllData()
    showToast('Recipient access revoked')
  } catch (error) {
    showToast('Deletion failed: ' + error.message, 'error')
  }
}

// Initial Load
onMounted(() => {
  if (auth.currentUser) {
    loadAllData()
  }
})
</script>

<style scoped>
/* Smooth Fades for Modals */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Toast Slide Up Animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
