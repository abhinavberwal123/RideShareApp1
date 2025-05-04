/**
 * Utility functions for API calls with retry logic
 */

/**
 * Executes a function with retry logic
 * @param {Function} fn - The function to execute
 * @param {Object} options - Options for the retry logic
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @param {boolean} options.exponentialBackoff - Whether to use exponential backoff (default: true)
 * @param {Function} options.onRetry - Callback function called before each retry
 * @param {Array<string|RegExp>} options.retryableErrors - Error messages or patterns that should trigger a retry
 * @returns {Promise<any>} - The result of the function
 */
export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry = null,
    retryableErrors = [
      'network error',
      'timeout',
      'Network Error',
      'Failed to fetch',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'socket hang up',
      'network timeout',
      /5\d\d/, // 5xx status codes
    ]
  } = options;

  let retries = 0;
  
  const executeWithRetry = async () => {
    try {
      return await fn();
    } catch (error) {
      // Check if we've reached the maximum number of retries
      if (retries >= maxRetries) {
        console.error(`Maximum retries (${maxRetries}) reached. Giving up.`, error);
        throw error;
      }
      
      // Check if the error is retryable
      const errorMessage = error.message || String(error);
      const shouldRetry = retryableErrors.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(errorMessage);
        }
        return errorMessage.includes(pattern);
      });
      
      if (!shouldRetry) {
        console.error('Error is not retryable. Giving up.', error);
        throw error;
      }
      
      // Calculate delay with exponential backoff if enabled
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, retries)
        : retryDelay;
      
      retries++;
      
      console.warn(`Retrying operation (${retries}/${maxRetries}) after ${delay}ms...`, error);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(retries, error);
      }
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation
      return executeWithRetry();
    }
  };
  
  return executeWithRetry();
};

/**
 * Fetches data from an API with retry logic
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Options for the retry logic
 * @returns {Promise<any>} - The parsed response
 */
export const fetchWithRetry = async (url, options = {}, retryOptions = {}) => {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = new Error(`HTTP error! Status: ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response.json();
  }, retryOptions);
};

/**
 * Makes a Firestore operation with retry logic
 * @param {Function} firestoreOperation - The Firestore operation to execute
 * @param {Object} retryOptions - Options for the retry logic
 * @returns {Promise<any>} - The result of the Firestore operation
 */
export const firestoreWithRetry = async (firestoreOperation, retryOptions = {}) => {
  return withRetry(firestoreOperation, {
    maxRetries: 5,
    retryDelay: 500,
    ...retryOptions
  });
};