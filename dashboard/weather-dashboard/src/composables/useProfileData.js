import { ref, watch } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

export function useProfileData(user) {
  const profile = ref({
    displayName: '',
    location: '',
    emailNotifications: true,
    photoURL: '',
  })

  const originalProfile = ref({})

  // Watch user to set immediate defaults from Auth
  watch(
    user,
    (newUser) => {
      if (newUser && !profile.value.displayName) {
        profile.value.displayName = newUser.displayName || ''
        profile.value.photoURL = newUser.photoURL || ''
      }
    },
    { immediate: true },
  )

  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid)
      const docSnap = await getDoc(userDocRef)

      if (docSnap.exists()) {
        const firestoreData = docSnap.data()

        // Merge Firestore data
        profile.value = {
          ...profile.value,
          ...firestoreData,
          emailNotifications: firestoreData.emailNotifications ?? true,
        }

        // If Firestore has no photo, but Auth does, use Auth photo
        if (!profile.value.photoURL && user.value?.photoURL) {
          profile.value.photoURL = user.value.photoURL
        }
      }

      // Create original copy for change detection
      originalProfile.value = JSON.parse(JSON.stringify(profile.value))
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  return {
    profile,
    originalProfile,
    fetchUserProfile,
  }
}
