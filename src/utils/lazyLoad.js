import { lazy, Suspense } from 'react';
import LoadingIndicator from '../components/LoadingIndicator';

/**
 * Lazy loads a component with a loading fallback
 * @param {Function} importFunc - The import function for the component
 * @param {Object} options - Options for lazy loading
 * @param {string} options.loadingText - Text to display while loading
 * @param {string} options.size - Size of the loading indicator
 * @param {number} options.timeout - Timeout for loading in milliseconds
 * @returns {React.LazyExoticComponent} - The lazy-loaded component
 */
export const lazyLoad = (importFunc, options = {}) => {
  const {
    loadingText = 'Loading component...',
    size = 'medium',
    timeout = 10000,
    componentName = 'LazyComponent'
  } = options;

  const LazyComponent = lazy(importFunc);

  // Create wrapper component with display name
  const LazyLoadWrapper = (props) => (
    <Suspense fallback={
      <LoadingIndicator 
        isLoading={true} 
        text={loadingText} 
        size={size} 
        timeout={timeout}
      />
    }>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Set display name for the component
  LazyLoadWrapper.displayName = `LazyLoad(${componentName})`;

  return LazyLoadWrapper;
};

/**
 * Lazy loads a page component with a loading fallback
 * @param {Function} importFunc - The import function for the page component
 * @returns {React.LazyExoticComponent} - The lazy-loaded page component
 */
export const lazyLoadPage = (importFunc) => {
  return lazyLoad(importFunc, {
    loadingText: 'Loading page...',
    size: 'large',
    timeout: 15000
  });
};

/**
 * Creates lazy-loaded routes for React Router
 * @param {Array} routes - Array of route objects
 * @returns {Array} - Array of route objects with lazy-loaded components
 */
export const createLazyRoutes = (routes) => {
  return routes.map(route => {
    if (route.component) {
      return {
        ...route,
        element: lazyLoadPage(() => import(`../pages/${route.component}`))
      };
    }

    if (route.children) {
      return {
        ...route,
        children: createLazyRoutes(route.children)
      };
    }

    return route;
  });
};
