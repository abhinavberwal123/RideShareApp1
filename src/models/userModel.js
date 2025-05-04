import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';

const usersCollection = collection(db, 'users');

export const createUser = async (userId, userData) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        ...userData,
        createdAt: new Date()
    });
    return userId;
};

export const getUserById = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
    } else {
        return null;
    }
};

export const updateUser = async (userId, userData) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return userId;
};

export const getUsersByType = async (userType) => {
    const q = query(usersCollection, where("userType", "==", userType));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};