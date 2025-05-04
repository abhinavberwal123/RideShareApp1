/**
 * Test utilities for Firebase
 */
import { vi } from 'vitest';

/**
 * Creates a mock Firestore document
 * @param {string} id - The document ID
 * @param {Object} data - The document data
 * @returns {Object} - A mock Firestore document
 */
export const mockFirestoreDoc = (id, data = {}) => ({
  id,
  data: () => ({ ...data }),
  exists: true,
  ref: {
    id,
    path: `mock/path/${id}`
  }
});

/**
 * Creates a mock Firestore collection
 * @param {Array} docs - Array of document data objects with IDs
 * @returns {Object} - A mock Firestore collection
 */
export const mockFirestoreCollection = (docs = []) => {
  const mockDocs = docs.map(doc => mockFirestoreDoc(doc.id, doc));
  
  return {
    docs: mockDocs,
    empty: mockDocs.length === 0,
    size: mockDocs.length,
    forEach: callback => mockDocs.forEach(callback)
  };
};

/**
 * Creates a mock Firebase Auth user
 * @param {Object} userData - User data to include in the mock
 * @returns {Object} - A mock Firebase Auth user
 */
export const mockFirebaseUser = (userData = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  ...userData
});

/**
 * Creates mock Firebase Auth
 * @param {Object} user - The mock user (or null for signed out)
 * @returns {Object} - Mock Firebase Auth object
 */
export const mockFirebaseAuth = (user = null) => {
  const authState = user;
  
  return {
    currentUser: authState,
    onAuthStateChanged: vi.fn(callback => {
      callback(authState);
      return () => {}; // Unsubscribe function
    }),
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: authState })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: authState })),
    signOut: vi.fn(() => Promise.resolve()),
    sendPasswordResetEmail: vi.fn(() => Promise.resolve())
  };
};

/**
 * Creates a mock Firestore instance
 * @param {Object} collections - Map of collection names to document arrays
 * @returns {Object} - Mock Firestore instance
 */
export const mockFirestore = (collections = {}) => {
  const db = {
    collection: vi.fn(collectionName => {
      const collectionData = collections[collectionName] || [];
      
      return {
        doc: vi.fn(docId => {
          const docData = collectionData.find(doc => doc.id === docId);
          
          return {
            id: docId,
            get: vi.fn(() => Promise.resolve(
              docData 
                ? mockFirestoreDoc(docId, docData) 
                : { exists: false, id: docId }
            )),
            set: vi.fn(() => Promise.resolve()),
            update: vi.fn(() => Promise.resolve()),
            delete: vi.fn(() => Promise.resolve()),
            onSnapshot: vi.fn(callback => {
              callback(docData 
                ? mockFirestoreDoc(docId, docData) 
                : { exists: false, id: docId }
              );
              return () => {}; // Unsubscribe function
            })
          };
        }),
        where: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(mockFirestoreCollection(collectionData))),
          onSnapshot: vi.fn(callback => {
            callback(mockFirestoreCollection(collectionData));
            return () => {}; // Unsubscribe function
          })
        })),
        orderBy: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(mockFirestoreCollection(collectionData))),
          onSnapshot: vi.fn(callback => {
            callback(mockFirestoreCollection(collectionData));
            return () => {}; // Unsubscribe function
          })
        })),
        limit: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(mockFirestoreCollection(collectionData))),
          onSnapshot: vi.fn(callback => {
            callback(mockFirestoreCollection(collectionData));
            return () => {}; // Unsubscribe function
          })
        })),
        add: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
        get: vi.fn(() => Promise.resolve(mockFirestoreCollection(collectionData))),
        onSnapshot: vi.fn(callback => {
          callback(mockFirestoreCollection(collectionData));
          return () => {}; // Unsubscribe function
        })
      };
    })
  };
  
  return db;
};

/**
 * Creates a mock Firebase Storage instance
 * @returns {Object} - Mock Firebase Storage instance
 */
export const mockStorage = () => ({
  ref: vi.fn(path => ({
    put: vi.fn(() => Promise.resolve({
      ref: {
        getDownloadURL: vi.fn(() => Promise.resolve(`https://example.com/storage/${path}`))
      }
    })),
    delete: vi.fn(() => Promise.resolve()),
    getDownloadURL: vi.fn(() => Promise.resolve(`https://example.com/storage/${path}`))
  }))
});

/**
 * Creates a mock Firebase instance with Auth, Firestore, and Storage
 * @param {Object} options - Configuration options
 * @param {Object} options.auth - Auth configuration
 * @param {Object} options.firestore - Firestore configuration
 * @returns {Object} - Mock Firebase instance
 */
export const mockFirebase = ({ auth = {}, firestore = {} } = {}) => {
  const user = auth.user || null;
  const collections = firestore.collections || {};
  
  return {
    auth: mockFirebaseAuth(user),
    firestore: mockFirestore(collections),
    storage: mockStorage()
  };
};

/**
 * Renders a component with Firebase context providers
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Configuration options
 * @returns {Object} - The rendered component
 */
export const renderWithFirebase = (ui, options = {}) => {
  // This function would typically use React Testing Library
  // and wrap the component with Firebase context providers
  // For now, we'll just return a placeholder
  return {
    ui,
    options,
    // Additional methods would be provided by the testing library
  };
};