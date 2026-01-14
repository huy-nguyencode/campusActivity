// config/firebase.ts
// Firebase configuration and initialization for Campus Pulse
//
// LEARNING POINT: We use the modular Firebase JS SDK (v9+) which supports
// "tree-shaking" - only the code you actually import gets bundled into your
// app. This keeps the bundle size smaller compared to the older namespaced API.
//
// Note: We're NOT using Firebase Analytics here because it requires native
// modules that don't work in Expo Go. For a production app, you'd use
// @react-native-firebase/analytics instead.

import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase project configuration
// LEARNING POINT: These keys are safe to expose in client code - Firebase
// security comes from Firestore Security Rules, not from hiding these keys.
// The apiKey just identifies your project; it doesn't grant access.
const firebaseConfig = {
  apiKey: "AIzaSyBFnIRIeYu5GrkfZCzvILcgudOF1BSlUa0",
  authDomain: "campusactivity-ec1f2.firebaseapp.com",
  projectId: "campusactivity-ec1f2",
  storageBucket: "campusactivity-ec1f2.firebasestorage.app",
  messagingSenderId: "134421685955",
  appId: "1:134421685955:web:c04518c66ae057de3ca476",
  measurementId: "G-MJ0HG94MDY"
};

// Initialize the Firebase app
// LEARNING POINT: This creates a Firebase "app instance" that all other
// Firebase services (Auth, Firestore, etc.) will use.
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native persistence
// LEARNING POINT: By default, Firebase Auth uses localStorage on web, but
// React Native doesn't have localStorage. We use AsyncStorage instead.
// This means the user stays logged in even after closing the app.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with offline persistence
// LEARNING POINT: persistentLocalCache enables "offline-first" behavior:
// 1. Reads come from local cache first (fast!)
// 2. Writes are queued locally and sync when online
// 3. The app works without network connectivity
//
// persistentSingleTabManager is used for React Native since we only have
// one "tab" (the app itself). On web, you'd use persistentMultipleTabManager.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(undefined)
  })
});

export default app;
