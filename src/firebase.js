// src/firebase.js
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./config/firebaseConfig";

// Add console logs for debugging
console.log("Firebase initialization starting...");

// Initialize Firebase app outside try/catch
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log("Firebase app initialized:", app.name);

// Initialize services
export const auth = getAuth(app);
// Initialize Firestore with persistent cache and explicit database ID
export const db = initializeFirestore(app, {
    cache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }),
    databaseId: 'main' // Use a custom database ID instead of (default)
});
export const storage = getStorage(app);

console.log("Firebase services initialized with persistent cache and custom database ID 'main'");

// Export app as default
export default app;
