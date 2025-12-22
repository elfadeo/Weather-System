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
      @keydown.esc="closeMobile"
      @touchmove.prevent
      tabindex="-1"
      aria-hidden="true"
    ></div>
  </transition>

  <aside
    class="fixed top-0 left-0 z-50 h-[100dvh] bg-surface border-r border-border flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
    :class="sidebarClasses"
    @click.stop
    role="navigation"
    aria-label="Main navigation"
  >
    <!-- Mobile Close Button Header -->
    <div
      class="h-14 xs:h-16 lg:hidden flex items-center justify-end px-3 xs:px-4 shrink-0 safe-top"
    >
      <button
        @click="closeMobile"
        class="p-1.5 xs:p-2 -mr-1 xs:-mr-2 text-text-light hover:text-text-main transition-colors active:scale-90 touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
        aria-label="Close navigation menu"
      >
        <Icon icon="ph:x-bold" class="w-5 h-5 xs:w-6 xs:h-6" />
      </button>
    </div>

    <!-- Navigation -->
    <nav
      class="flex-1 px-2 xs:px-3 py-3 xs:py-4 lg:py-6 space-y-0.5 xs:space-y-1 overflow-y-auto no-scrollbar overscroll-contain lg:pt-8"
    >
      <!-- Collapse/Expand Button -->
      <button
        @click="toggleExpand"
        class="hidden lg:flex items-center w-full p-2.5 xs:p-3 mb-3 xs:mb-4 rounded-lg xs:rounded-xl text-text-light hover:bg-hover hover:text-text-main transition-all duration-200 group touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50"
        :class="{ 'justify-center': !isExpanded }"
        :aria-label="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
        :title="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
      >
        <Icon
          :icon="isExpanded ? 'ph:caret-left-bold' : 'ph:list-bold'"
          class="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300 group-hover:scale-110 shrink-0"
        />
        <span
          class="ml-2.5 xs:ml-3 text-xs xs:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 origin-left"
          :class="[
            isExpanded
              ? 'opacity-100 scale-100 w-auto translate-x-0'
              : 'opacity-0 scale-95 w-0 -translate-x-4',
          ]"
        >
          Menu
        </span>
      </button>

      <!-- Navigation Links -->
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
          class="relative flex items-center p-2.5 xs:p-3 rounded-lg xs:rounded-xl transition-all duration-300 group select-none overflow-hidden touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50"
          :class="[
            !isExpanded ? 'justify-center' : '',
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-text-light hover:bg-hover hover:text-text-main font-medium',
          ]"
          :aria-label="item.name"
          :aria-current="isActive ? 'page' : undefined"
        >
          <!-- Active Indicator -->
          <div
            v-if="isActive && isExpanded"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 xs:h-6 bg-primary rounded-r-full"
          ></div>

          <!-- Icon -->
          <Icon
            :icon="item.icon"
            class="w-4 h-4 xs:w-5 xs:h-5 shrink-0 transition-colors duration-300"
            :class="{ 'text-primary': isActive }"
          />

          <!-- Label -->
          <span
            class="ml-2.5 xs:ml-3 text-xs xs:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 origin-left"
            :class="[
              isExpanded
                ? 'opacity-100 scale-100 w-auto translate-x-0'
                : 'opacity-0 scale-95 w-0 -translate-x-4',
            ]"
          >
            {{ item.name }}
          </span>

          <!-- Tooltip (Desktop only when collapsed) -->
          <div
            v-if="!isExpanded"
            class="absolute left-full ml-2 xs:ml-3 px-2.5 xs:px-3 py-1 xs:py-1.5 bg-text-main text-surface text-xs font-semibold rounded-md xs:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[60] shadow-xl hidden lg:block"
          >
            {{ item.name }}
          </div>
        </a>
      </router-link>
    </nav>

    <!-- User Profile Section -->
    <div class="p-2 xs:p-3 border-t border-border safe-bottom">
      <div
        class="relative rounded-xl xs:rounded-2xl bg-surface transition-all duration-300 overflow-hidden"
        :class="[isExpanded ? 'p-2.5 xs:p-3 bg-hover/30' : 'p-0 bg-transparent']"
      >
        <!-- Profile Link -->
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
            class="flex items-center gap-2.5 xs:gap-3 group cursor-pointer rounded-lg p-1.5 xs:p-2 -m-1.5 xs:-m-2 hover:bg-hover/50 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/50"
            :class="{ 'justify-center': !isExpanded }"
            aria-label="View profile"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm group-hover:ring-2 ring-primary/20 transition-all"
            >
              <span class="text-xs xs:text-sm font-bold text-primary">{{ userInitials }}</span>
            </div>

            <!-- User Info -->
            <div
              class="flex flex-col overflow-hidden transition-all duration-300"
              :class="[isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden']"
            >
              <span class="text-xs xs:text-sm font-semibold text-text-main truncate">{{
                userDisplayName
              }}</span>
              <span class="text-[10px] xs:text-xs text-text-light truncate">{{ userEmail }}</span>
            </div>

            <!-- Tooltip (Desktop only when collapsed) -->
            <div
              v-if="!isExpanded"
              class="absolute left-full ml-2 xs:ml-3 px-2.5 xs:px-3 py-1 xs:py-1.5 bg-text-main text-surface text-xs font-semibold rounded-md xs:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[60] shadow-xl hidden lg:block"
            >
              Profile
            </div>
          </a>
        </router-link>

        <!-- Sign Out Button (Expanded) -->
        <button
          v-if="isExpanded"
          @click="handleSignOut"
          :disabled="isSigningOut"
          class="mt-1.5 xs:mt-2 flex items-center justify-center gap-1.5 xs:gap-2 w-full p-1 xs:p-1.5 rounded-md xs:rounded-lg text-[10px] xs:text-xs font-medium text-text-light hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500/50"
          aria-label="Sign out"
        >
          <Icon v-if="isSigningOut" icon="ph:spinner" class="w-3 h-3 animate-spin" />
          <span>{{ isSigningOut ? 'Signing Out...' : 'Sign Out' }}</span>
        </button>

        <!-- Sign Out Button (Collapsed) -->
        <button
          v-else
          @click="handleSignOut"
          :disabled="isSigningOut"
          class="w-full p-2.5 xs:p-3 rounded-lg xs:rounded-xl hover:bg-red-500/10 text-text-light hover:text-red-500 group relative transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500/50"
          aria-label="Sign out"
          title="Sign out"
        >
          <Icon
            :icon="isSigningOut ? 'ph:spinner' : 'ph:sign-out-bold'"
            class="w-4 h-4 xs:w-5 xs:h-5"
            :class="{ 'animate-spin': isSigningOut }"
          />

          <!-- Tooltip (Desktop only) -->
          <div
            v-if="!isSigningOut"
            class="absolute left-full ml-2 xs:ml-3 px-2.5 xs:px-3 py-1 xs:py-1.5 bg-text-main text-surface text-xs font-semibold rounded-md xs:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[60] shadow-xl hidden lg:block"
          >
            Sign Out
          </div>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
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

// --- Get Current User ---
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
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

// --- Focus Management ---
watch(isMobileOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

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
  if (window.innerWidth < 1024) closeMobile()
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
  const desktopWidth = isExpanded.value ? 'lg:w-[260px]' : 'lg:w-[80px]'
  const mobileWidth = 'w-[260px] xs:w-[280px] max-w-[85vw]'

  if (isMobileOpen.value) {
    return `${desktopWidth} ${mobileWidth} translate-x-0 shadow-2xl`
  }
  return `${desktopWidth} ${mobileWidth} -translate-x-full lg:translate-x-0 lg:shadow-none`
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
  padding-top: env(safe-area-inset-top, 0);
}

.safe-bottom {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0.5rem));
}

@media (min-width: 475px) {
  .safe-bottom {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
  }
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
