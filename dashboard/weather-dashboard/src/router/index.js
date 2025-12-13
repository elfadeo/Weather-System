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

/**
 * A helper function to wait for Firebase auth to initialize.
 */
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
    // Public landing page
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
          path: 'privacy-policy',
          name: 'privacy-policy',
          component: PrivacyPolicyView,
        },
        {
          path: 'terms-of-service',
          name: 'terms-of-service',
          component: TermsOfServiceView,
        },
      ],
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isAuthenticated = await getCurrentUser()

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if route requires auth and user is not authenticated
    next({ name: 'login' })
  } else if (
    isAuthenticated &&
    (to.name === 'login' ||
      to.name === 'signup' ||
      to.name === 'phone-login' ||
      to.name === 'landing')
  ) {
    // Redirect authenticated users away from public pages to dashboard
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
