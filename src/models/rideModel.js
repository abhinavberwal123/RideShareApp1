import { db } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';

const ridesCollection = collection(db, 'rides');

export const createRide = async (rideData) => {
    const rideRef = await addDoc(ridesCollection, {
        ...rideData,
        requestTime: new Date(),
        status: 'requested'
    });
    return rideRef.id;
};

export const getRideById = async (rideId) => {
    const rideRef = doc(db, 'rides', rideId);
    const rideSnap = await getDoc(rideRef);

    if (rideSnap.exists()) {
        return { id: rideSnap.id, ...rideSnap.data() };
    } else {
        return null;
    }
};

export const updateRideStatus = async (rideId, status, additionalData = {}) => {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, {
        status,
        ...additionalData,
        updatedAt: new Date()
    });
    return rideId;
};

export const getRidesByPassenger = async (passengerId) => {
    const q = query(
        ridesCollection,
        where("passengerId", "==", passengerId),
        orderBy("requestTime", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const getRidesByDriver = async (driverId) => {
    const q = query(
        ridesCollection,
        where("driverId", "==", driverId),
        orderBy("requestTime", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const getActiveRideRequests = async () => {
    const q = query(
        ridesCollection,
        where("status", "==", "requested"),
        orderBy("requestTime", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};