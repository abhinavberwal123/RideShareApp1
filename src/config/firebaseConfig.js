/**
 * Firebase configuration for different environments
 */

// Default configuration (development)
const devConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_DEV_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rickshaw-dev.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rickshaw-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rickshaw-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_DEV_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_DEV_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_DEV_MEASUREMENT_ID"
};

// Production configuration
const prodConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Test configuration
const testConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "test-messaging-sender-id",
  appId: "test-app-id",
  measurementId: "test-measurement-id"
};

// Determine which configuration to use based on environment
const getFirebaseConfig = () => {
  if (import.meta.env.MODE === 'test') {
    console.log('Using test Firebase configuration');
    return testConfig;
  }

  if (import.meta.env.PROD) {
    console.log('Using production Firebase configuration');
    return prodConfig;
  }

  console.log('Using development Firebase configuration');
  return devConfig;
};

const firebaseConfig = getFirebaseConfig();

export default firebaseConfig;
