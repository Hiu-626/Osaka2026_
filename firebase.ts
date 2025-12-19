
/**
 * Note: Real Firebase keys should be handled via environment variables.
 * For this implementation, we simulate the storage with a LocalStorage-based fallback 
 * if process.env.API_KEY or Firebase initialization fails, ensuring the app 
 * is "Offline-first" as requested.
 */
// Fix: Use the properly exported modular initializeApp from firebase/app
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Fix: Per instructions, all API keys must be obtained exclusively from process.env.API_KEY
  apiKey: process.env.API_KEY,
  authDomain: "travel-planner-d59ab.firebaseapp.com",
  projectId: "travel-planner-d59ab",
  storageBucket: "travel-planner-d59ab.firebasestorage.app",
  messagingSenderId: "845991687518",
  appId: "1:84