/**
 * Firebase Performance Monitoring utilities
 */
import { getPerformance, trace } from 'firebase/performance';
import { useEffect, useState } from 'react';

// Initialize Firebase Performance
let performance;
try {
  performance = getPerformance();
  console.log('Firebase Performance Monitoring initialized');
} catch (error) {
  console.error('Error initializing Firebase Performance:', error);
}

/**
 * Creates a performance trace
 * @param {string} traceName - Name of the trace
 * @returns {Object} - Trace object with start and stop methods
 */
export const createTrace = (traceName) => {
  if (!performance) {
    console.warn('Firebase Performance not available');
    return {
      start: () => {},
      stop: () => {},
      putAttribute: () => {},
      putMetric: () => {}
    };
  }

  try {
    const performanceTrace = trace(performance, traceName);
    
    return {
      start: () => {
        try {
          performanceTrace.start();
        } catch (error) {
          console.error(`Error starting trace ${traceName}:`, error);
        }
      },
      stop: () => {
        try {
          performanceTrace.stop();
        } catch (error) {
          console.error(`Error stopping trace ${traceName}:`, error);
        }
      },
      putAttribute: (name, value) => {
        try {
          performanceTrace.putAttribute(name, value);
        } catch (error) {
          console.error(`Error adding attribute to trace ${traceName}:`, error);
        }
      },
      putMetric: (name, value) => {
        try {
          performanceTrace.putMetric(name, value);
        } catch (error) {
          console.error(`Error adding metric to trace ${traceName}:`, error);
        }
      }
    };
  } catch (error) {
    console.error(`Error creating trace ${traceName}:`, error);
    return {
      start: () => {},
      stop: () => {},
      putAttribute: () => {},
      putMetric: () => {}
    };
  }
};

/**
 * Measures the performance of a function
 * @param {Function} fn - Function to measure
 * @param {string} traceName - Name of the trace
 * @returns {Function} - Wrapped function that measures performance
 */
export const measureFunction = (fn, traceName) => {
  return async (...args) => {
    const perfTrace = createTrace(`function_${traceName}`);
    perfTrace.start();
    
    try {
      const result = await fn(...args);
      perfTrace.stop();
      return result;
    } catch (error) {
      perfTrace.putAttribute('error', 'true');
      perfTrace.putAttribute('error_message', error.message);
      perfTrace.stop();
      throw error;
    }
  };
};

/**
 * React hook to measure component render time
 * @param {string} componentName - Name of the component
 * @returns {Object} - Object with trace and metrics
 */
export const usePerformanceMonitoring = (componentName) => {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTime, setRenderTime] = useState(null);
  
  useEffect(() => {
    const startTime = performance ? performance.now() : Date.now();
    const perfTrace = createTrace(`component_${componentName}`);
    perfTrace.start();
    
    return () => {
      const endTime = performance ? performance.now() : Date.now();
      const duration = endTime - startTime;
      
      perfTrace.putMetric('render_time', duration);
      perfTrace.putMetric('render_count', renderCount + 1);
      perfTrace.stop();
      
      setRenderTime(duration);
      setRenderCount(prev => prev + 1);
    };
  }, [componentName, renderCount]);
  
  return { renderCount, renderTime };
};

/**
 * Measures page load performance
 * @param {string} pageName - Name of the page
 */
export const measurePageLoad = (pageName) => {
  if (!performance) return;
  
  const perfTrace = createTrace(`page_${pageName}`);
  perfTrace.start();
  
  // Measure time to first paint
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-paint') {
        perfTrace.putMetric('first_paint', entry.startTime);
      }
      if (entry.name === 'first-contentful-paint') {
        perfTrace.putMetric('first_contentful_paint', entry.startTime);
      }
    }
  });
  
  try {
    paintObserver.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.error('Error observing paint metrics:', error);
  }
  
  // Stop the trace when the page is fully loaded
  window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;
      
      perfTrace.putMetric('dom_interactive', timing.domInteractive - navigationStart);
      perfTrace.putMetric('dom_complete', timing.domComplete - navigationStart);
      perfTrace.putMetric('load_event_end', timing.loadEventEnd - navigationStart);
    }
    
    perfTrace.stop();
    try {
      paintObserver.disconnect();
    } catch (error) {
      console.error('Error disconnecting paint observer:', error);
    }
  });
};

/**
 * Measures network request performance
 */
export const measureNetworkRequests = () => {
  if (!performance) return;
  
  const networkObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Filter out non-HTTP requests
      if (!entry.name.startsWith('http')) continue;
      
      const perfTrace = createTrace(`network_${new URL(entry.name).hostname}`);
      perfTrace.start();
      
      perfTrace.putAttribute('url', entry.name);
      perfTrace.putAttribute('method', entry.initiatorType);
      
      perfTrace.putMetric('duration', entry.duration);
      perfTrace.putMetric('fetch_start', entry.fetchStart);
      perfTrace.putMetric('response_end', entry.responseEnd);
      
      if (entry.transferSize) {
        perfTrace.putMetric('transfer_size', entry.transferSize);
      }
      
      perfTrace.stop();
    }
  });
  
  try {
    networkObserver.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.error('Error observing network metrics:', error);
  }
};

/**
 * Initializes all performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (!performance) {
    console.warn('Firebase Performance not available, skipping performance monitoring');
    return;
  }
  
  console.log('Initializing performance monitoring');
  
  // Measure network requests
  measureNetworkRequests();
  
  // Measure page load
  measurePageLoad('initial_load');
  
  // Measure long tasks
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const perfTrace = createTrace('long_task');
        perfTrace.putMetric('duration', entry.duration);
        perfTrace.putAttribute('task_location', JSON.stringify(entry.attribution[0].containerSrc));
        perfTrace.start();
        perfTrace.stop();
      }
    });
    
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.error('Error observing long tasks:', error);
  }
};