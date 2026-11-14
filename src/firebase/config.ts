import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD6BJoS2OlqQ5rng0y1_KrVL_q1nt42WHQ",
  authDomain: "baumeister-app-91b28.firebaseapp.com",
  projectId: "baumeister-app-91b28",
  storageBucket: "baumeister-app-91b28.firebasestorage.app",
  messagingSenderId: "336433836349",
  appId: "1:336433836349:web:24c898343b253276739554",
  measurementId: "G-W6TJ7K4NED"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Ensure persistence so workers stay logged in
try {
  setPersistence(auth, browserLocalPersistence);
} catch (err) {
  console.warn('Could not set auth persistence:', err);
}

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
