// This file defines the AppContext for managing user authentication and settings in a React application.
import React, { createContext, useContext, useState, useEffect } from "react";

// Importing utility functions
import { storage } from "../utils/storage";
import { voiceService } from "../utils/voice";

// Firebase and Firestore imports
import {
  loginWithEmailPassword,
  loginWithGoogle,
  signUpWithEmailPassword,
  logout as firebaseLogout,
} from "../firebase/auth.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState(
    storage.get("SilverCare_language") || "en",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now()); // Track when loading started
  
  useEffect(() => {
    const auth = getAuth();
    
    // First, check if we have a stored user to set initial state
    const storedUser = storage.get("SilverCare_user");
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }

    // Fallback timeout to prevent infinite loading (10 seconds max)
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallbackTimeout); // Clear fallback since Firebase responded
      
      try {
        if (firebaseUser) {
          let userData = {
            id: firebaseUser.uid,
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            email: firebaseUser.email,
          };
          // Fetch extra user details from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            userData = { ...userData, ...userDoc.data() };
          }
          
          setUser(userData);
          setIsAuthenticated(true);
          storage.set("SilverCare_user", userData);
        } else {
          // Firebase says no user, clear everything
          setUser(null);
          setIsAuthenticated(false);
          storage.remove("SilverCare_user");
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        // On error, fall back to stored user if available
        const storedUser = storage.get("SilverCare_user");
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          storage.remove("SilverCare_user");
        }
      }
      
      // Ensure minimum 2 seconds loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    });

    return () => {
      try {
        clearTimeout(fallbackTimeout);
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from auth state:", error);
      }
    };
  }, [startTime]);

  const login = async (email, password) => {
    try {
      const user = await loginWithEmailPassword(email, password);
      let userData = {
        id: user.uid,
        name: user.displayName || email.split("@")[0],
        email: user.email,
        lastLoginAt: new Date().toISOString(),
      };

      // Fetch and update user data in Firestore
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // Merge existing Firestore data with current login data
          userData = { ...userDoc.data(), ...userData };
        } else {
          // Create user document if it doesn't exist (for legacy users)
          userData.createdAt = new Date().toISOString();
        }
        
        // Update/create user document in Firestore
        await setDoc(userDocRef, userData, { merge: true });
        
      } catch (firestoreError) {
        console.error("Error handling Firestore user document:", firestoreError);
        // Continue with login even if Firestore fails
      }

      setUser(userData);
      setIsAuthenticated(true);
      storage.set("SilverCare_user", userData);
      setTimeout(() => {
        voiceService.speak(`Welcome, ${userData.name}!`);
      }, 500);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      
      // Since auth.js already provides user-friendly error messages, 
      // just pass through the error message directly
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const user = await signUpWithEmailPassword(email, password, name);
      const userData = {
        id: user.uid,
        name: name,
        email: user.email,
        healthConditions: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Store user data in Firestore
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, userData, { merge: true });
      } catch (firestoreError) {
        console.error("Error storing user data in Firestore:", firestoreError);
        // Continue with signup even if Firestore fails
      }

      setUser(userData);
      setIsAuthenticated(true);
      storage.set("SilverCare_user", userData);
      setTimeout(() => {
        voiceService.speak(`Welcome to SilverCare AI, ${name}!`);
      }, 500);
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      
      // Since auth.js already provides user-friendly error messages, 
      // just pass through the error message directly
      throw error;
    }
  };

  const loginWithGoogleHandler = async () => {
    try {
      const user = await loginWithGoogle();
      const userData = {
        id: user.uid,
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Check if user already exists in Firestore, if not create them
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create new user document in Firestore for first-time Google users
          await setDoc(userDocRef, userData, { merge: true });
          
        } else {
          // Update last login time for existing users
          await setDoc(userDocRef, { 
            lastLoginAt: new Date().toISOString(),
            name: user.displayName || user.email.split("@")[0], // Update name in case it changed
            email: user.email // Update email in case it changed
          }, { merge: true });
          
          // Use existing user data from Firestore
          const existingUserData = userDoc.data();
          Object.assign(userData, existingUserData);
        }
      } catch (firestoreError) {
        console.error("Error handling Firestore user document:", firestoreError);
        // Continue with authentication even if Firestore fails
      }

      setUser(userData);
      setIsAuthenticated(true);
      storage.set("SilverCare_user", userData);
      setTimeout(() => {
        voiceService.speak(`Welcome, ${userData.name}!`);
      }, 500);
      return true;
    } catch (error) {
      console.error("Google login error:", error);
      
      // Re-throw the error with the user-friendly message from auth.js
      // This allows the UI components to display the specific error message
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    storage.remove("SilverCare_user");
    firebaseLogout();
    voiceService.speak("Goodbye! Take care.");
  };

  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    storage.set("SilverCare_language", newLanguage);
  };

  const updateUser = async (updatedUserData) => {
    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated");
      }

      // Merge with existing user data, preserving id and email
      const completeUserData = {
        ...user,
        ...updatedUserData,
        id: user.id, // Ensure ID is preserved
        email: user.email, // Ensure email is preserved
        updatedAt: new Date().toISOString(),
      };

      // Perform Firebase update without timeout - let it take as long as needed
      // This removes the artificial 10-second timeout to allow slow networks more time
      try {
        const docRef = doc(db, "users", user.id);
        await setDoc(docRef, completeUserData, { merge: true });
      } catch (firebaseError) {
        console.error("Firebase update error:", firebaseError);
        
        if (firebaseError.code === 'permission-denied') {
          throw new Error("Permission denied: You don't have access to update this user data");
        } else if (firebaseError.code === 'unavailable') {
          throw new Error("Network error: Firebase service is unavailable. Please try again.");
        } else if (firebaseError.code === 'deadline-exceeded') {
          throw new Error("Request timeout: The operation took too long. Please check your connection and try again.");
        } else if (firebaseError.code === 'unauthenticated') {
          throw new Error("Authentication error: Please log in again to update your profile.");
        } else {
          throw new Error(`Firebase error: ${firebaseError.message}`);
        }
      }
      
      // Update context state and localStorage after successful Firebase update
      setUser(completeUserData);
      storage.set("SilverCare_user", completeUserData);

      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error; // Re-throw the error so the calling function can handle it
    }
  };

  // Helper function to check if user has completed their details
  const hasCompletedUserDetails = () => {
    if (!user) return false;
    
    // Check if essential user details are present
    const requiredFields = ['age', 'gender', 'address', 'healthCondition', 'currentMedicalStatus'];
    return requiredFields.every(field => user[field] && user[field] !== '');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        language,
        setLanguage: updateLanguage,
        isAuthenticated,
        login,
        logout,
        signup,
        loginWithGoogle: loginWithGoogleHandler,
        loading,
        hasCompletedUserDetails,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
