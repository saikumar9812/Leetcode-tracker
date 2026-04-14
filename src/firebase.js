// Firebase Configuration
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, get } from 'firebase/database'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId
)

// Database helpers
export const getUserDataRef = (username) => ref(database, `users/${username}/problems`)

export const saveUserDataToFirebase = async (username, data) => {
    if (!isFirebaseConfigured) return false
    try {
        await set(ref(database, `users/${username}/problems`), data)
        return true
    } catch (error) {
        console.error('Firebase save error:', error)
        return false
    }
}

export const subscribeToUserData = (username, callback) => {
    if (!isFirebaseConfigured) return () => { }

    const userRef = ref(database, `users/${username}/problems`)
    const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val()
        callback(data || {})
    }, (error) => {
        console.error('Firebase subscription error:', error)
    })

    return unsubscribe
}

export const loadUserDataOnce = async (username) => {
    if (!isFirebaseConfigured) return {}
    try {
        const snapshot = await get(ref(database, `users/${username}/problems`))
        return snapshot.val() || {}
    } catch (error) {
        console.error('Firebase load error:', error)
        return {}
    }
}

export const savePriorityCategories = async (username, categories) => {
    if (!isFirebaseConfigured) return false
    try {
        await set(ref(database, `users/${username}/priorityCategories`), categories)
        return true
    } catch (error) {
        console.error('Firebase save priority error:', error)
        return false
    }
}

export const loadPriorityCategories = async (username) => {
    if (!isFirebaseConfigured) return null
    try {
        const snapshot = await get(ref(database, `users/${username}/priorityCategories`))
        return snapshot.exists() ? snapshot.val() : null
    } catch (error) {
        console.error('Firebase load priority error:', error)
        return null
    }
}

export { database }
