// src/firebase.js
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./config/firebaseConfig";

// Add console logs for debugging
console.log("Firebase initialization starting...");

// Initialize Firebase app outside try/catch
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log("Firebase app initialized:", app.name);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase services initialized");

// Try to enable persistence
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log("Firestore persistence enabled successfully");
        })
        .catch((err) => {
            console.error("Firestore persistence error:", err.code);
        });
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Export app as default
export default app;