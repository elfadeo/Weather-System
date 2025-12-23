<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
      @click="closeMobile"
      @touchend.prevent="closeMobile"
      @keydown.esc="closeMobile"
      role="presentation"
      aria-hidden="true"
    ></div>
  </transition>

  <aside
    ref="sidebarRef"
    class="fixed top-0 left-0 z-50 h-[100dvh] bg-surface/80 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform safe-top"
    :class="sidebarClasses"
    @click.stop
    @keydown.tab="handleTabKey"
    role="navigation"
    aria-label="Main navigation"
  >
    <nav class="flex-1 px-3 py-4 lg:py-8 space-y-1 overflow-y-auto no-scrollbar overscroll-contain">
      <button
        ref="firstFocusableRef"
        @click="toggleExpand"
        class="flex items-center gap-3 w-full px-3 py-2.5 mb-6 rounded-xl text-text-light hover:bg-hover/50 hover:text-text-main transition-all duration-200 group touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50"
        :class="{ 'justify-center px-0': !isExpanded }"
        :aria-label="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
        :title="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
      >
        <div
          class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
        >
          <Icon
            :icon="isExpanded ? 'ph:caret-left-bold' : 'ph:caret-right-bold'"
            class="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <span
          class="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 origin-left"
          :class="[
            isExpanded
              ? 'opacity-100 scale-100 w-auto translate-x-0'
              : 'opacity-0 scale-95 w-0 -translate-x-4',
          ]"
        >
          Collapse
        </span>
      </button>

      <router-link
        v-for="item in navItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        custom
        v-slot="{ href, navigate, isActive }"
      >
        <a
          :href="href"
          @click="
            (e) => {
              navigate(e)
              closeMobileOnNavigate()
            }
          "
          @keydown.enter="
            (e) => {
              navigate(e)
              closeMobileOnNavigate()
            }
          "
          class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group select-none touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50"
          :class="[
            !isExpanded ? 'justify-center px-0' : '',
            isActive
              ? 'bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5'
              : 'text-text-light hover:bg-hover/50 hover:text-text-main font-normal',
          ]"
          :aria-label="item.name"
          :aria-current="isActive ? 'page' : undefined"
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
            :class="isActive ? 'bg-primary/10' : 'bg-transparent group-hover:bg-hover'"
          >
            <Icon
              :icon="item.icon"
              class="w-5 h-5 transition-all duration-200"
              :class="
                isActive
                  ? 'text-primary scale-110'
                  : 'text-text-light group-hover:text-text-main group-hover:scale-110'
              "
            />
          </div>

          <span
            class="text-sm whitespace-nowrap overflow-hidden transition-all duration-300 origin-left"
            :class="[
              isExpanded
                ? 'opacity-100 scale-100 w-auto translate-x-0'
                : 'opacity-0 scale-95 w-0 -translate-x-4',
            ]"
          >
            {{ item.name }}
          </span>

          <div
            v-if="isActive && isExpanded"
            class="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary"
          ></div>

          <div
            v-if="!isExpanded"
            class="absolute left-full ml-4 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border text-text-main text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[60] shadow-lg hidden lg:block"
          >
            {{ item.name }}
          </div>
        </a>
      </router-link>
    </nav>

    <div class="p-3 border-t border-border/50 safe-bottom">
      <div
        class="relative rounded-xl transition-all duration-300"
        :class="[isExpanded ? 'p-3 bg-hover/30' : 'p-0']"
      >
        <router-link :to="{ name: 'profile' }" custom v-slot="{ href, navigate }">
          <a
            :href="href"
            @click="
              (e) => {
                navigate(e)
                closeMobileOnNavigate()
              }
            "
            @keydown.enter="
              (e) => {
                navigate(e)
                closeMobileOnNavigate()
              }
            "
            class="flex items-center gap-3 group cursor-pointer rounded-lg p-2 -m-2 hover:bg-hover/50 transition-all touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50"
            :class="{ 'justify-center': !isExpanded }"
            aria-label="View profile"
          >
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20 shadow-sm group-hover:border-primary/40 group-hover:shadow-md group-hover:scale-105 transition-all"
            >
              <span class="text-sm font-bold text-primary">{{ userInitials }}</span>
            </div>

            <div
              class="flex flex-col overflow-hidden transition-all duration-300 min-w-0"
              :class="[isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden']"
            >
              <span class="text-sm font-semibold text-text-main truncate">{{
                userDisplayName
              }}</span>
              <span class="text-xs text-text-light truncate">{{ userEmail }}</span>
            </div>

            <div
              v-if="!isExpanded"
              class="absolute left-full ml-4 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border text-text-main text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[60] shadow-lg hidden lg:block"
            >
              Profile
            </div>
          </a>
        </router-link>

        <button
          ref="lastFocusableRef"
          @click="handleSignOut"
          :disabled="isSigningOut"
          class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-text-light hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500/50"
          :class="[
            isExpanded ? 'justify-center mt-2' : 'justify-center w-full mt-2 p-2.5 relative',
          ]"
          :aria-label="isSigningOut ? 'Signing out' : 'Sign out'"
          :title="!isExpanded ? 'Sign out' : undefined"
        >
          <Icon
            :icon="isSigningOut ? 'ph:spinner' : 'ph:sign-out-bold'"
            class="h-3.5 transition-all"
            :class="[isExpanded ? 'w-3.5' : 'w-5 h-5', { 'animate-spin': isSigningOut }]"
          />
          <span v-if="isExpanded">{{ isSigningOut ? 'Signing Out...' : 'Sign Out' }}</span>

          <div
            v-if="!isExpanded && !isSigningOut"
            class="absolute left-full ml-4 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border text-text-main text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[60] shadow-lg hidden lg:block"
          >
            Sign Out
          </div>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'

const emit = defineEmits(['update:expanded', 'sign-out-error'])
const router = useRouter()

// --- State ---
const isExpanded = ref(true)
const isMobileOpen = ref(false)
const isSigningOut = ref(false)
const currentUser = ref(null)

// --- Refs for focus management ---
const sidebarRef = ref(null)
const firstFocusableRef = ref(null)
const lastFocusableRef = ref(null)

// --- Get Current User ---
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
})

// --- Cleanup on unmount ---
onUnmounted(() => {
  document.body.style.overflow = ''
})

// --- User Display Info ---
const userDisplayName = computed(() => {
  if (currentUser.value?.displayName) {
    return currentUser.value.displayName
  }
  if (currentUser.value?.email) {
    return currentUser.value.email.split('@')[0]
  }
  return 'User'
})

const userEmail = computed(() => {
  return currentUser.value?.email || 'No email'
})

const userInitials = computed(() => {
  if (currentUser.value?.displayName) {
    const names = currentUser.value.displayName.split(' ')
    return names
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (currentUser.value?.email) {
    return currentUser.value.email[0].toUpperCase()
  }
  return 'U'
})

// --- Navigation Data ---
const navItems = [
  { name: 'Dashboard', routeName: 'dashboard', icon: 'ph:squares-four' },
  { name: 'Analytics', routeName: 'charts', icon: 'ph:chart-line-up' },
  { name: 'Reports', routeName: 'reports', icon: 'ph:files' },
  { name: 'Alerts', routeName: 'alerts', icon: 'ph:bell-ringing' },
  { name: 'Insights', routeName: 'recommendations', icon: 'ph:sparkle' },
]

// --- Focus Management with Focus Trap ---
watch(isMobileOpen, async (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    // Wait for DOM update, then focus first element
    await nextTick()
    firstFocusableRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

// --- Handle Tab Key for Focus Trap ---
const handleTabKey = (event) => {
  if (!isMobileOpen.value || window.innerWidth >= 1024) return

  const isTabPressed = event.key === 'Tab'
  if (!isTabPressed) return

  if (event.shiftKey) {
    // Shift + Tab: Moving backward
    if (document.activeElement === firstFocusableRef.value) {
      event.preventDefault()
      lastFocusableRef.value?.focus()
    }
  } else {
    // Tab: Moving forward
    if (document.activeElement === lastFocusableRef.value) {
      event.preventDefault()
      firstFocusableRef.value?.focus()
    }
  }
}

// --- Actions ---
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  emit('update:expanded', isExpanded.value)
}

const toggleMobile = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const closeMobile = () => {
  isMobileOpen.value = false
}

const closeMobileOnNavigate = () => {
  const isMobile = window.innerWidth < 1024
  if (isMobile && isMobileOpen.value) {
    closeMobile()
  }
}

const handleSignOut = async () => {
  if (isSigningOut.value) return

  try {
    isSigningOut.value = true
    await signOut(auth)
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Sign out failed:', error)
    emit('sign-out-error', error)
  } finally {
    isSigningOut.value = false
  }
}

// --- Dynamic Classes ---
const sidebarClasses = computed(() => {
  const commonWidth = isExpanded.value ? 'w-[260px]' : 'w-[80px]'

  if (isMobileOpen.value) {
    return `${commonWidth} translate-x-0 shadow-2xl`
  }

  return `${commonWidth} -translate-x-full lg:translate-x-0 lg:shadow-none`
})

defineExpose({ toggleMobile, isMobileOpen })
</script>

<style scoped>
/* Hide Scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Safe Area Support */
.safe-top {
  padding-top: max(1rem, env(safe-area-inset-top, 1rem));
}

.safe-bottom {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
}

/* Touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Optimize for small screens */
@media (max-width: 374px) {
  aside {
    font-size: 0.875rem;
  }
}
</style>
