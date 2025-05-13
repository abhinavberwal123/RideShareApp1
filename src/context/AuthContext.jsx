import { createContext, useState, useEffect } from "react";
import PropTypes from 'prop-types';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { auth, db } from "../firebase"; // Import the pre-initialized auth instance and db
import { doc, getDoc, setDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Monitor auth state and fetch user role from Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserRole(userData.userType || "consumer"); // Default to consumer if not specified
                    } else {
                        setUserRole("consumer"); // Default role if user document doesn't exist
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUserRole("consumer"); // Default role on error
                }
            } else {
                setUserRole(null);
            }
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Sign in with email and password
    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Sign in with Google
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document exists in Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));

            // If user doesn't exist in Firestore, create a new document
            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    displayName: user.displayName,
                    email: user.email,
                    userType: "consumer", // Default role for Google sign-in
                    createdAt: new Date()
                });
            }

            return result;
        } catch (error) {
            console.error("Google sign-in error:", error);
            throw error;
        }
    };

    // Sign up
    const register = async (email, password, displayName, userType = "consumer") => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });

        // Create user document in Firestore with role
        await setDoc(doc(db, "users", result.user.uid), {
            displayName,
            email,
            userType,
            createdAt: new Date()
        });

        return result;
    };

    // Sign out
    const logout = () => signOut(auth);

    // Get dashboard URL based on user role
    const getDashboardUrl = () => {
        switch (userRole) {
            case "admin":
                return "/admin";
            case "driver":
                return "/driver-dashboard";
            case "consumer":
            default:
                return "/dashboard";
        }
    };

    const value = {
        user,
        userRole,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        getDashboardUrl
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Add PropTypes validation
AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};
