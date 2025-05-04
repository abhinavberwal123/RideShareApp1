import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    doc,
    onSnapshot,
    query,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    where,
    orderBy,
    limit,
    getDoc,
    getDocs,
    startAfter
} from 'firebase/firestore';

// Hook for Firestore CRUD operations
export const useFirestoreOperations = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Add a document to a collection
    const addDocument = async (collectionName, data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp()
            });
            setSuccess(true);
            setLoading(false);
            return docRef.id;
        } catch (err) {
            console.error('Error adding document:', err);
            setError('Failed to add document: ' + err.message);
            setLoading(false);
            return null;
        }
    };

    // Update a document in a collection
    const updateDocument = async (collectionName, docId, data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            setSuccess(true);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Error updating document:', err);
            setError('Failed to update document: ' + err.message);
            setLoading(false);
            return false;
        }
    };

    // Delete a document from a collection
    const deleteDocument = async (collectionName, docId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const docRef = doc(db, collectionName, docId);
            await deleteDoc(docRef);
            setSuccess(true);
            setLoading(false);
            return true;
        } catch (err) {
            console.error('Error deleting document:', err);
            setError('Failed to delete document: ' + err.message);
            setLoading(false);
            return false;
        }
    };

    // Get a document once (not real-time)
    const getDocument = async (collectionName, docId) => {
        setLoading(true);
        setError(null);

        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);

            setLoading(false);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                setError('Document does not exist');
                return null;
            }
        } catch (err) {
            console.error('Error getting document:', err);
            setError('Failed to get document: ' + err.message);
            setLoading(false);
            return null;
        }
    };

    return { 
        addDocument, 
        updateDocument, 
        deleteDocument, 
        getDocument,
        error, 
        loading, 
        success 
    };
};

export const useDocument = (collectionName, docId) => {
    const [document, setDocument] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, collectionName, docId);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setDocument({ id: snapshot.id, ...snapshot.data() });
                    setError(null);
                } else {
                    setError('Document does not exist');
                    setDocument(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching document:', err);
                setError('Failed to fetch document');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, docId]);

    return { document, error, loading };
};

// Enhanced collection hook with filtering, sorting, and pagination
export const useCollection = (collectionName, options = {}) => {
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // Destructure options with defaults
    const { 
        filters = [], 
        sort = null, 
        limitCount = 50,
        queryConstraints = []
    } = options;

    useEffect(() => {
        console.log(`Fetching collection: ${collectionName}`);
        let collectionRef = collection(db, collectionName);
        let constraints = [...queryConstraints];

        // Add filters if provided
        if (filters.length > 0) {
            filters.forEach(filter => {
                if (filter.field && filter.operator && filter.value !== undefined) {
                    constraints.push(where(filter.field, filter.operator, filter.value));
                }
            });
        }

        // Add sorting if provided
        if (sort && sort.field) {
            constraints.push(orderBy(sort.field, sort.direction || 'asc'));
        }

        // Add limit if provided
        if (limitCount > 0) {
            constraints.push(limit(limitCount));
        }

        // Create query with all constraints
        let queryRef = constraints.length > 0 
            ? query(collectionRef, ...constraints)
            : collectionRef;

        console.log(`With constraints: ${constraints.length} constraints applied`);

        const unsubscribe = onSnapshot(
            queryRef,
            (snapshot) => {
                console.log(`Got ${snapshot.docs.length} documents from ${collectionName}`);

                // Check if we have more documents
                setHasMore(snapshot.docs.length === limitCount);

                // Save the last document for pagination
                if (snapshot.docs.length > 0) {
                    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                } else {
                    setLastDoc(null);
                }

                const results = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setDocuments(results);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error(`Error fetching collection ${collectionName}:`, err);
                setError(`Failed to fetch collection: ${err.message}`);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, JSON.stringify(options)]);

    // Function to load more documents (pagination)
    const loadMore = async () => {
        if (!hasMore || !lastDoc) return;

        setLoading(true);

        try {
            const { 
                filters = [], 
                sort = null, 
                limitCount = 50,
                queryConstraints = []
            } = options;

            let collectionRef = collection(db, collectionName);
            let constraints = [...queryConstraints];

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

            // Start after the last document
            constraints.push(startAfter(lastDoc));

            // Add limit
            if (limitCount > 0) {
                constraints.push(limit(limitCount));
            }

            // Create query
            let queryRef = query(collectionRef, ...constraints);

            // Execute query
            const snapshot = await getDocs(queryRef);

            // Check if we have more documents
            setHasMore(snapshot.docs.length === limitCount);

            // Save the last document for pagination
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

                // Add new documents to the existing ones
                const newDocs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setDocuments(prevDocs => [...prevDocs, ...newDocs]);
            }

            setError(null);
        } catch (err) {
            console.error(`Error loading more documents from ${collectionName}:`, err);
            setError(`Failed to load more documents: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return { documents, error, loading, hasMore, loadMore };
};
