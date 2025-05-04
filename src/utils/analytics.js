/**
 * Firebase Analytics utilities
 */
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getApp } from 'firebase/app';

// Initialize Firebase Analytics
let analytics;
try {
  analytics = getAnalytics(getApp());
  console.log('Firebase Analytics initialized');
} catch (error) {
  console.error('Error initializing Firebase Analytics:', error);
}

/**
 * Log an event to Firebase Analytics
 * @param {string} eventName - Name of the event
 * @param {Object} eventParams - Parameters for the event
 */
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (!analytics) {
    console.warn('Firebase Analytics not available, skipping event logging');
    return;
  }

  try {
    logEvent(analytics, eventName, eventParams);
    console.log(`Analytics event logged: ${eventName}`, eventParams);
  } catch (error) {
    console.error(`Error logging analytics event ${eventName}:`, error);
  }
};

/**
 * Set the user ID for Firebase Analytics
 * @param {string} uid - User ID
 */
export const setAnalyticsUserId = (uid) => {
  if (!analytics) {
    console.warn('Firebase Analytics not available, skipping user ID setting');
    return;
  }

  try {
    setUserId(analytics, uid);
    console.log(`Analytics user ID set: ${uid}`);
  } catch (error) {
    console.error('Error setting analytics user ID:', error);
  }
};

/**
 * Set user properties for Firebase Analytics
 * @param {Object} properties - User properties
 */
export const setAnalyticsUserProperties = (properties) => {
  if (!analytics) {
    console.warn('Firebase Analytics not available, skipping user properties setting');
    return;
  }

  try {
    setUserProperties(analytics, properties);
    console.log('Analytics user properties set:', properties);
  } catch (error) {
    console.error('Error setting analytics user properties:', error);
  }
};

/**
 * Track a page view
 * @param {string} pageName - Name of the page
 * @param {Object} pageParams - Additional parameters
 */
export const trackPageView = (pageName, pageParams = {}) => {
  logAnalyticsEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...pageParams
  });
};

/**
 * Track a user action
 * @param {string} actionName - Name of the action
 * @param {Object} actionParams - Additional parameters
 */
export const trackUserAction = (actionName, actionParams = {}) => {
  logAnalyticsEvent('user_action', {
    action_name: actionName,
    ...actionParams
  });
};

/**
 * Track a ride request
 * @param {Object} rideDetails - Details of the ride
 */
export const trackRideRequest = (rideDetails) => {
  logAnalyticsEvent('ride_requested', {
    pickup_location: rideDetails.pickup,
    destination: rideDetails.destination,
    estimated_fare: rideDetails.estimatedFare,
    ...rideDetails
  });
};

/**
 * Track a ride completion
 * @param {Object} rideDetails - Details of the ride
 */
export const trackRideCompletion = (rideDetails) => {
  logAnalyticsEvent('ride_completed', {
    ride_id: rideDetails.id,
    pickup_location: rideDetails.pickup,
    destination: rideDetails.destination,
    actual_fare: rideDetails.fare,
    duration: rideDetails.duration,
    distance: rideDetails.distance,
    ...rideDetails
  });
};

/**
 * Track a payment
 * @param {Object} paymentDetails - Details of the payment
 */
export const trackPayment = (paymentDetails) => {
  logAnalyticsEvent('payment_processed', {
    payment_id: paymentDetails.id,
    amount: paymentDetails.amount,
    currency: paymentDetails.currency,
    payment_method: paymentDetails.method,
    status: paymentDetails.status,
    ...paymentDetails
  });
};

/**
 * Track an error
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 * @param {Object} errorDetails - Additional error details
 */
export const trackError = (errorType, errorMessage, errorDetails = {}) => {
  logAnalyticsEvent('app_error', {
    error_type: errorType,
    error_message: errorMessage,
    ...errorDetails
  });
};

/**
 * Initialize analytics tracking for the current user
 * @param {Object} user - User object
 */
export const initializeUserAnalytics = (user) => {
  if (!user) return;

  // Set user ID
  setAnalyticsUserId(user.uid);

  // Set user properties
  setAnalyticsUserProperties({
    user_type: user.isDriver ? 'driver' : 'passenger',
    account_created: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    display_name: user.displayName,
    email_verified: user.emailVerified
  });

  // Log user login event
  logAnalyticsEvent('login', {
    method: 'Firebase Auth'
  });
};