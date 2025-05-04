import React from "react";
import ReactDOM from "react-dom/client";
// Remove this import if not used elsewhere
// import { initializeApp } from "firebase/app";
// Remove this import if not used elsewhere
// import firebaseConfig from "./config/firebaseConfig";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from './components/ErrorBoundary';
import "./styles.css";
// Import firebase to ensure it's initialized before rendering
import "./firebase";
// Import performance monitoring
import { initPerformanceMonitoring } from "./utils/performanceMonitoring";

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Initialize performance monitoring
initPerformanceMonitoring();

// Remove this block
// try {
//     initializeApp(firebaseConfig);
//     console.log("Firebase initialized successfully");
// } catch (error) {
//     console.error("Firebase initialization error:", error);
// }

// Only render the app once
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ErrorBoundary>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
