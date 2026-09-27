import { initializeApp } from 'firebase/app';
// Firebase 12's generic TypeScript declarations omit this React Native export,
// but Metro resolves `firebase/auth` to Firebase's public RN entry point.
// @ts-expect-error getReactNativePersistence exists in the React Native bundle.
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBFnIRIeYu5GrkfZCzvILcgudOF1BSlUa0",
  authDomain: "campusactivity-ec1f2.firebaseapp.com",
  projectId: "campusactivity-ec1f2",
  storageBucket: "campusactivity-ec1f2.firebasestorage.app",
  messagingSenderId: "134421685955",
  appId: "1:134421685955:web:c04518c66ae057de3ca476",
  measurementId: "G-MJ0HG94MDY"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

export default app;
