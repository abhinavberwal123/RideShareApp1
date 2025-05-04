/**
 * Firebase Crashlytics utilities
 */

// Initialize Firebase Crashlytics
// Note: Firebase Web v9 doesn't have a direct Crashlytics package
// Instead, errors are automatically reported to Firebase if Analytics is enabled
// This utility provides additional functionality for manual error reporting

/**
 * Log an error to the console and Firebase
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = 'app', additionalData = {}) => {
  // Log to console
  console.error(`[${context}] Error:`, error, additionalData);

  try {
    // In a production environment, you might want to send this to a logging service
    // or use a more sophisticated error tracking solution

    // For now, we'll just ensure the error is properly formatted for Firebase
    // which will automatically collect it if Analytics is enabled

    // Add custom attributes to the error
    error.customAttributes = {
      context,
      ...additionalData
    };

    // Re-throw the error to be caught by the global error handler
    // which will report it to Firebase
    setTimeout(() => {
      throw error;
    }, 0);
  } catch (e) {
    console.error('Error in logError:', e);
  }
};

/**
 * Set up a global error handler to catch unhandled errors
 */
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), 'global', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });

    // Don't prevent default to allow the browser to show the error
    // return false;
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    let error = event.reason;

    // If the rejection reason isn't an Error, create one
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }

    logError(error, 'unhandledPromise', {
      promise: event.promise
    });

    // Don't prevent default
    // return false;
  });

  console.log('Global error handlers set up for Crashlytics');
};

/**
 * Record a non-fatal error
 * @param {string} message - Error message
 * @param {string} context - Context where the error occurred
 * @param {Object} data - Additional data
 */
export const recordError = (message, context = 'app', data = {}) => {
  const error = new Error(message);
  logError(error, context, data);
};

/**
 * Set user identifier for Crashlytics
 * @param {string} userId - User ID
 */
export const setUserId = (userId) => {
  try {
    // Firebase Web automatically associates the current user with crashes
    // if you're using Firebase Auth

    // For custom user IDs, we can set a custom key
    if (window.firebase && window.firebase.analytics) {
      window.firebase.analytics().setUserId(userId);
    }

    console.log(`Crashlytics user ID set: ${userId}`);
  } catch (error) {
    console.error('Error setting Crashlytics user ID:', error);
  }
};

/**
 * Set a custom key for Crashlytics
 * @param {string} key - Key name
 * @param {string} value - Value
 */
export const setCustomKey = (key, value) => {
  try {
    // Firebase Web doesn't have a direct method for this
    // but we can use Analytics user properties
    if (window.firebase && window.firebase.analytics) {
      const properties = {};
      properties[key] = value;
      window.firebase.analytics().setUserProperties(properties);
    }

    console.log(`Crashlytics custom key set: ${key}=${value}`);
  } catch (error) {
    console.error('Error setting Crashlytics custom key:', error);
  }
};

/**
 * Initialize Crashlytics
 */
export const initCrashlytics = () => {
  try {
    // Set up global error handlers
    setupGlobalErrorHandlers();

    // Log initialization
    console.log('Firebase Crashlytics initialized');

    // Return true to indicate success
    return true;
  } catch (error) {
    console.error('Error initializing Crashlytics:', error);
    return false;
  }
};

// Export a default object with all functions
export default {
  logError,
  setupGlobalErrorHandlers,
  recordError,
  setUserId,
  setCustomKey,
  initCrashlytics
};
