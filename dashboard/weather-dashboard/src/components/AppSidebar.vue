<template>
  <!-- Mobile Backdrop -->
  <transition
    enter-active-class="duration-300 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="duration-300 ease-in"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
      @click="closeMobile"
      role="presentation"
      aria-hidden="true"
    ></div>
  </transition>

  <!-- Sidebar -->
  <aside
    @click.stop
    class="fixed lg:static top-0 left-0 z-40 h-screen bg-surface text-text-main border-r border-hover flex flex-col transition-all duration-300 ease-in-out will-change-transform"
    :class="{
      'w-64': isExpanded,
      'w-20': !isExpanded,
      'translate-x-0': isMobileOpen,
      '-translate-x-full lg:translate-x-0': !isMobileOpen,
    }"
    :aria-hidden="!isMobileOpen && 'true'"
  >
    <nav
      class="flex-1 px-4 space-y-3 mt-4 overflow-y-auto no-scrollbar"
      role="navigation"
      aria-label="Main navigation"
    >
      <!-- Mobile Close Button -->
      <div class="flex lg:hidden justify-end mb-4">
        <button
          @click="closeMobile"
          class="p-3 text-text-light hover:text-primary active:scale-95 transition"
          aria-label="Close sidebar"
        >
          <Icon icon="ph:x-bold" class="h-7 w-7" />
        </button>
      </div>

      <!-- Desktop Expand Button -->
      <button
        @click="toggleExpand"
        class="hidden lg:flex items-center w-full p-3 rounded-xl bg-surface shadow-sm hover:bg-primary/5 transition-all duration-300"
        :class="{ 'justify-center': !isExpanded }"
        :aria-label="isExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
        :aria-expanded="isExpanded"
      >
        <Icon
          :icon="isExpanded ? 'ph:caret-left-bold' : 'ph:list-bold'"
          class="h-5 w-5 text-text-light"
        />
        <span v-if="isExpanded" class="ml-3 font-medium">Menu</span>
      </button>

      <!-- Navigation Items -->
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
          class="relative flex items-center p-3 rounded-xl transition-all duration-300 group"
          :class="[
            isExpanded ? '' : 'justify-center',
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-text-light opacity-80 hover:bg-primary/5 hover:text-primary',
          ]"
          :aria-current="isActive ? 'page' : undefined"
        >
          <Icon :icon="item.icon" class="h-6 w-6" aria-hidden="true" />

          <span v-if="isExpanded" class="ml-4 whitespace-nowrap">{{ item.name }}</span>

          <!-- Tooltip -->
          <div
            v-if="!isExpanded"
            class="absolute left-full ml-2 hidden lg:block px-2 py-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
            role="tooltip"
          >
            {{ item.name }}
          </div>
        </a>
      </router-link>
    </nav>

    <!-- Profile + Logout -->
    <div class="px-4 py-5 space-y-2 border-t border-hover">
      <!-- Profile -->
      <router-link to="/profile" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="
            (e) => {
              navigate(e)
              closeMobileOnNavigate()
            }
          "
          class="relative flex items-center p-3 rounded-xl group transition-all duration-300"
          :class="[
            isExpanded ? '' : 'justify-center',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-light opacity-80 hover:bg-primary/5 hover:text-primary',
          ]"
          :aria-current="isActive ? 'page' : undefined"
        >
          <Icon icon="ph:user-circle-bold" class="h-6 w-6" aria-hidden="true" />
          <span v-if="isExpanded" class="ml-4">Profile</span>

          <!-- Tooltip -->
          <div
            v-if="!isExpanded"
            class="absolute left-full ml-2 hidden lg:block px-2 py-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            role="tooltip"
          >
            Profile
          </div>
        </a>
      </router-link>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="relative flex w-full items-center p-3 rounded-xl group text-text-light opacity-80 hover:bg-primary/5 hover:text-red-500 transition-all duration-300"
        :class="{ 'justify-center': !isExpanded }"
        aria-label="Logout"
      >
        <Icon icon="ph:sign-out-bold" class="h-6 w-6" aria-hidden="true" />
        <span v-if="isExpanded" class="ml-4">Logout</span>

        <!-- Tooltip -->
        <div
          v-if="!isExpanded"
          class="absolute left-full ml-2 hidden lg:block px-2 py-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          role="tooltip"
        >
          Logout
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const isExpanded = ref(true)
const isMobileOpen = ref(false)

const router = useRouter()

const emit = defineEmits(['update:expanded'])

const navItems = [
  { name: 'Dashboard', routeName: 'dashboard', icon: 'ph:layout-bold' },
  { name: 'Charts', routeName: 'charts', icon: 'ph:chart-line-up-bold' },
  { name: 'Reports', routeName: 'reports', icon: 'ph:file-text-bold' },
  { name: 'Alerts', routeName: 'alerts', icon: 'ph:bell-ringing-bold' },
  { name: 'Recommendations', routeName: 'recommendations', icon: 'ph:plant-bold' },
]

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
  // Close mobile sidebar on navigation (mobile only)
  if (window.innerWidth < 1024) {
    closeMobile()
  }
}

defineExpose({ toggleMobile, isMobileOpen })

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  scrollbar-width: none;
}
</style>
