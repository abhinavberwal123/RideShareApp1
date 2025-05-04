/**
 * Custom logging utilities for the application
 */
import { logAnalyticsEvent } from './analytics';
import { recordError } from './crashlytics';

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Default configuration
const defaultConfig = {
  logToConsole: true,
  logToAnalytics: true,
  minLevel: LOG_LEVELS.DEBUG,
  includeTimestamp: true
};

// Current configuration
let config = { ...defaultConfig };

/**
 * Configure the logger
 * @param {Object} newConfig - New configuration options
 */
export const configureLogger = (newConfig = {}) => {
  config = { ...config, ...newConfig };
};

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
const formatLogMessage = (level, message) => {
  const timestamp = config.includeTimestamp ? new Date().toISOString() : '';
  const prefix = timestamp ? `[${timestamp}] [${level.toUpperCase()}]` : `[${level.toUpperCase()}]`;

  return `${prefix} ${message}`;
};

/**
 * Log a message to the console
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
const logToConsole = (level, message, data = {}) => {
  if (!config.logToConsole) return;

  const formattedMessage = formatLogMessage(level, message);

  switch (level) {
    case LOG_LEVELS.DEBUG:
      console.debug(formattedMessage, data);
      break;
    case LOG_LEVELS.INFO:
      console.info(formattedMessage, data);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage, data);
      break;
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage, data);
      break;
    default:
      console.log(formattedMessage, data);
  }
};

/**
 * Log a message to Firebase Analytics
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
const logToAnalytics = (level, message, data = {}) => {
  if (!config.logToAnalytics) return;

  // Only log warnings and errors to Analytics
  if (level === LOG_LEVELS.WARN || level === LOG_LEVELS.ERROR) {
    logAnalyticsEvent('app_log', {
      log_level: level,
      log_message: message,
      ...data
    });

    // For errors, also record them in Crashlytics
    if (level === LOG_LEVELS.ERROR) {
      recordError(message, 'logger', data);
    }
  }
};

/**
 * Log a message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
const log = (level, message, data = {}) => {
  // Check if we should log this level
  const levels = Object.values(LOG_LEVELS);
  const configLevelIndex = levels.indexOf(config.minLevel);
  const messageLevelIndex = levels.indexOf(level);

  if (messageLevelIndex < configLevelIndex) return;

  // Log to console
  logToConsole(level, message, data);

  // Log to Analytics
  logToAnalytics(level, message, data);
};

/**
 * Log a debug message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
export const debug = (message, data = {}) => {
  log(LOG_LEVELS.DEBUG, message, data);
};

/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
export const info = (message, data = {}) => {
  log(LOG_LEVELS.INFO, message, data);
};

/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
export const warn = (message, data = {}) => {
  log(LOG_LEVELS.WARN, message, data);
};

/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
export const error = (message, data = {}) => {
  log(LOG_LEVELS.ERROR, message, data);
};

/**
 * Log an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {Object} options - Additional options
 */
export const logApiRequest = (endpoint, params = {}, options = {}) => {
  info(`API Request: ${endpoint}`, {
    endpoint,
    params,
    ...options
  });
};

/**
 * Log an API response
 * @param {string} endpoint - API endpoint
 * @param {Object} response - Response data
 * @param {number} status - HTTP status code
 * @param {Object} options - Additional options
 */
export const logApiResponse = (endpoint, response, status, options = {}) => {
  if (status >= 400) {
    error(`API Error (${status}): ${endpoint}`, {
      endpoint,
      status,
      response,
      ...options
    });
  } else {
    debug(`API Response (${status}): ${endpoint}`, {
      endpoint,
      status,
      ...options
    });
  }
};

/**
 * Log a user action
 * @param {string} action - Action name
 * @param {Object} data - Additional data
 */
export const logUserAction = (action, data = {}) => {
  info(`User Action: ${action}`, {
    action,
    ...data
  });

  // Also log to Analytics
  logAnalyticsEvent('user_action', {
    action_name: action,
    ...data
  });
};

/**
 * Log application initialization
 * @param {string} version - Application version
 * @param {Object} data - Additional data
 */
export const logAppInit = (version, data = {}) => {
  info(`Application initialized (v${version})`, {
    version,
    ...data
  });

  // Also log to Analytics
  logAnalyticsEvent('app_initialized', {
    app_version: version,
    ...data
  });
};

// Export a default object with all functions
export default {
  LOG_LEVELS,
  configureLogger,
  debug,
  info,
  warn,
  error,
  logApiRequest,
  logApiResponse,
  logUserAction,
  logAppInit
};
