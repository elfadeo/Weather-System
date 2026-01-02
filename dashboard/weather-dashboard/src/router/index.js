import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

// Layout
import MainLayout from '@/layout/MainLayout.vue'

// Views
import LandingPageView from '@/views/LandingPageView.vue'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import UsernameLoginView from '@/views/UsernameLoginView.vue'
import HomeView from '@/views/HomeView.vue'
import ChartsView from '@/views/ChartsView.vue'
import ReportsView from '@/views/ReportsView.vue'
import AlertsView from '@/views/AlertsView.vue'
import RecommendationsView from '@/views/RecommendationsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import PrivacyPolicyView from '@/views/PrivacyPolicyView.vue'
import TermsOfServiceView from '@/views/TermsOfServiceView.vue'
import AdminSMSView from '@/views/AdminSMSView.vue'

// ⚠️ CHANGE THIS TO YOUR ADMIN EMAIL
const ADMIN_EMAIL = 'ponce.rn952@s.msumain.edu.ph'

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject,
    )
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPageView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/phone-login',
      name: 'phone-login',
      component: UsernameLoginView,
    },

    // --- LEGAL ROUTES (MOVED TO ROOT LEVEL) ---
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: PrivacyPolicyView,
    },
    {
      path: '/terms-of-service',
      name: 'terms-of-service',
      component: TermsOfServiceView,
    },

    // Protected dashboard routes
    {
      path: '/dashboard',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: HomeView,
        },
        {
          path: 'charts',
          name: 'charts',
          component: ChartsView,
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsView,
        },
        {
          path: 'alerts',
          name: 'alerts',
          component: AlertsView,
        },
        {
          path: 'recommendations',
          name: 'recommendations',
          component: RecommendationsView,
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
        },
        {
          path: 'admin/sms',
          name: 'admin-sms',
          component: AdminSMSView,
          meta: { requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
  const user = await getCurrentUser()

  if (requiresAuth && !user) {
    // Not logged in, redirect to login
    next({ name: 'login' })
  } else if (requiresAdmin && user?.email !== ADMIN_EMAIL) {
    // Not admin, redirect to dashboard with error
    alert('⚠️ Access Denied: Admin privileges required')
    next({ name: 'dashboard' })
  } else if (
    user &&
    (to.name === 'login' ||
      to.name === 'signup' ||
      to.name === 'phone-login' ||
      to.name === 'landing')
  ) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

// Export admin email for use in other components
export { ADMIN_EMAIL }
export default router
