/**
 * Utilities for optimizing Firestore queries and reducing reads
 */
import { db } from '../firebase';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';

// Cache for storing query results
const queryCache = new Map();

// Cache expiration time (in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generates a cache key for a query
 * @param {string} collectionName - The collection name
 * @param {Array} filters - Array of filter objects
 * @param {Object} sort - Sort configuration
 * @param {number} limitCount - Number of documents to limit to
 * @returns {string} - Cache key
 */
const generateCacheKey = (collectionName, filters = [], sort = null, limitCount = 0) => {
  return JSON.stringify({
    collection: collectionName,
    filters,
    sort,
    limit: limitCount
  });
};

/**
 * Executes a Firestore query with caching
 * @param {string} collectionName - The collection name
 * @param {Object} options - Query options
 * @param {Array} options.filters - Array of filter objects
 * @param {Object} options.sort - Sort configuration
 * @param {number} options.limitCount - Number of documents to limit to
 * @param {boolean} options.bypassCache - Whether to bypass the cache
 * @returns {Promise<Array>} - Array of documents
 */
export const executeQueryWithCache = async (collectionName, options = {}) => {
  const {
    filters = [],
    sort = null,
    limitCount = 50,
    bypassCache = false
  } = options;

  // Generate cache key
  const cacheKey = generateCacheKey(collectionName, filters, sort, limitCount);

  // Check if we have a valid cached result
  if (!bypassCache && queryCache.has(cacheKey)) {
    const cachedResult = queryCache.get(cacheKey);
    const now = Date.now();

    // Return cached result if it's still valid
    if (now - cachedResult.timestamp < CACHE_EXPIRATION) {
      console.log(`Using cached result for ${collectionName}`);
      return cachedResult.data;
    }

    // Remove expired cache entry
    queryCache.delete(cacheKey);
  }

  // Build query
  let collectionRef = collection(db, collectionName);
  let constraints = [];

  // Add filters
  if (filters.length > 0) {
    filters.forEach(filter => {
      if (filter.field && filter.operator && filter.value !== undefined) {
        constraints.push(where(filter.field, filter.operator, filter.value));
      }
    });
  }

  // Add sorting
  if (sort && sort.field) {
    constraints.push(orderBy(sort.field, sort.direction || 'asc'));
  }

  // Add limit
  if (limitCount > 0) {
    constraints.push(limit(limitCount));
  }

  // Execute query
  const queryRef = constraints.length > 0
    ? query(collectionRef, ...constraints)
    : collectionRef;

  const snapshot = await getDocs(queryRef);

  // Process results
  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Cache the results
  queryCache.set(cacheKey, {
    data: results,
    timestamp: Date.now()
  });

  return results;
};

/**
 * Clears the query cache
 * @param {string} collectionName - Optional collection name to clear specific cache
 */
export const clearQueryCache = (collectionName = null) => {
  if (collectionName) {
    // Clear cache for specific collection
    const keysToDelete = [];

    for (const key of queryCache.keys()) {
      const parsedKey = JSON.parse(key);
      if (parsedKey.collection === collectionName) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => queryCache.delete(key));
    console.log(`Cleared cache for collection: ${collectionName}`);
  } else {
    // Clear entire cache
    queryCache.clear();
    console.log('Cleared entire query cache');
  }
};

/**
 * Optimizes a collection query by selecting only needed fields
 * @param {string} collectionName - The collection name
 * @param {Array} fields - Array of field names to select
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of documents with only selected fields
 */
export const selectFields = async (collectionName, fields = [], options = {}) => {
  const results = await executeQueryWithCache(collectionName, options);

  if (!fields || fields.length === 0) {
    return results;
  }

  // Return only selected fields for each document
  return results.map(doc => {
    const selectedData = { id: doc.id };

    fields.forEach(field => {
      if (doc[field] !== undefined) {
        selectedData[field] = doc[field];
      }
    });

    return selectedData;
  });
};

/**
 * Prefetches a collection to cache
 * @param {string} collectionName - The collection name
 * @param {Object} options - Query options
 */
export const prefetchCollection = async (collectionName, options = {}) => {
  console.log(`Prefetching collection: ${collectionName}`);
  await executeQueryWithCache(collectionName, { ...options, bypassCache: true });
  console.log(`Prefetched collection: ${collectionName}`);
};
