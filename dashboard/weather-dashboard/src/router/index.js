import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

// Eagerly load ONLY the critical layout that wraps all dashboard routes
import MainLayout from '@/layout/MainLayout.vue'

// Environment Variable for Admin
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'ponce.rn952@s.msumain.edu.ph'

// Robust Auth State Checker (Prevents race conditions)
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    // ALWAYS wait for onAuthStateChanged to fire at least once
    // This ensures Firebase Auth has fully initialized
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe() // Clean up listener
        resolve(user)
      },
      (error) => {
        unsubscribe() // Clean up on error too
        reject(error)
      },
    )
  })
}

// Helper function to check admin status
const isAdmin = (user) => user?.email === ADMIN_EMAIL

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingPageView.vue'),
      meta: { title: 'Welcome' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Login' },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { title: 'Sign Up' },
    },
    {
      path: '/phone-login',
      name: 'phone-login',
      component: () => import('@/views/UsernameLoginView.vue'),
      meta: { title: 'Phone Login' },
    },

    // Legal routes (public, lazy-loaded)
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
      meta: { title: 'Privacy Policy' },
    },
    {
      path: '/terms-of-service',
      name: 'terms-of-service',
      component: () => import('@/views/TermsOfServiceView.vue'),
      meta: { title: 'Terms of Service' },
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
          component: () => import('@/views/HomeView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'charts',
          name: 'charts',
          component: () => import('@/views/ChartsView.vue'),
          meta: { title: 'Charts' },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/ReportsView.vue'),
          meta: { title: 'Reports' },
        },
        {
          path: 'alerts',
          name: 'alerts',
          component: () => import('@/views/AlertsView.vue'),
          meta: { title: 'Alerts' },
        },
        {
          path: 'recommendations',
          name: 'recommendations',
          component: () => import('@/views/RecommendationsView.vue'),
          meta: { title: 'Recommendations' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { title: 'Profile' },
        },
        {
          path: 'admin/sms',
          name: 'admin-sms',
          component: () => import('@/views/AdminSMSView.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
            title: 'SMS Admin',
          },
        },
      ],
    },

    // 404 catch-all
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: { name: 'landing' },
    },
  ],
})

// Navigation Guard with improved error handling
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  // Set page title
  document.title = to.meta.title
    ? `${to.meta.title} | Weather Monitoring`
    : 'Weather Monitoring System'

  try {
    // Wait for Firebase Auth to initialize
    const user = await getCurrentUser()

    // 1. Require authentication
    if (requiresAuth && !user) {
      console.log('Authentication required, redirecting to login')
      next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
      return
    }

    // 2. Require admin privileges
    if (requiresAdmin && !isAdmin(user)) {
      console.warn('Unauthorized admin access attempt:', user?.email)
      next({
        name: 'dashboard',
        query: { error: 'unauthorized' },
      })
      return
    }

    // 3. Redirect authenticated users away from guest-only pages
    const guestOnlyRoutes = ['login', 'signup', 'phone-login', 'landing']
    if (user && guestOnlyRoutes.includes(to.name)) {
      console.log('Authenticated user redirected to dashboard')
      // Check if there's a redirect query param from a previous login redirect
      const redirectPath = from.query?.redirect || to.query?.redirect
      if (redirectPath && redirectPath !== '/' && redirectPath !== '/login') {
        next(redirectPath)
      } else {
        next({ name: 'dashboard' })
      }
      return
    }

    // 4. Allow navigation
    next()
  } catch (error) {
    console.error('Navigation guard error:', error)
    // On auth error, redirect to login unless already there
    if (to.name !== 'login') {
      next({ name: 'login', query: { error: 'auth_failed' } })
    } else {
      next()
    }
  }
})

// Optional: Handle route errors
router.onError((error) => {
  console.error('Router error:', error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Chunk load error, reloading page')
    window.location.reload()
  }
})

export { ADMIN_EMAIL, isAdmin }
export default router
