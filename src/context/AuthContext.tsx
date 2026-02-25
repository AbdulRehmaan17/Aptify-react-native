/**
 * Auth Context - Refactored
 * 
 * Rules:
 * - App must NOT block unauthenticated users
 * - Persist login correctly across app restarts
 * - Firestore user document must be created once
 * - Graceful loading states (no blank screens)
 * - Fix all auth-related race conditions
 */

import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { authService } from '../services/auth.service';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (updates: { displayName?: string; phoneNumber?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Initialize auth state - FIXED VERSION
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth as any, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setFirebaseUser(null);
          setIsGuest(true);
          setLoading(false);
          return;
        }

        setFirebaseUser(firebaseUser);

        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log('[AuthContext] ⚠️ User document does not exist in Firestore for uid:', firebaseUser.uid);
          try {

            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName ?? '',
              role: 'Owner', // TEMPORARY DEFAULT for testing: Set to Owner so they can create properties
              provider: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
              photoURL: firebaseUser.photoURL || null,
              createdAt: serverTimestamp(),
            });
            console.log('[AuthContext] ✅ Created Firestore user document:', firebaseUser.uid);
            // Re-fetch after creating document
            userSnap = await getDoc(userRef);
          } catch (error: any) {
            console.error('🔥 FIRESTORE ERROR: Failed to create user document:', error);
            throw error;
          }
        }

        const userData = userSnap.data() || {};
        const mappedUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData.email || '',
          displayName: userData.name || firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || userData.photoURL || null,
          phoneNumber: userData.phoneNumber,
          role: userData.role || 'user',
          provider: userData.provider || (firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email'),
          createdAt: userData.createdAt?.toDate(),
          updatedAt: userData.updatedAt?.toDate(),
        };

        setUser(mappedUser);
        setIsGuest(false);
        setLoading(false);
      } catch (error: any) {
        console.error('🔥 FIRESTORE ERROR: Auth state change failed:', error);
        setLoading(false);
        setIsGuest(true);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] 🔐 Login called');
      await authService.login({ email, password });
      // DO NOT set user here - onAuthStateChanged will handle it
      // This ensures Firestore document is created consistently
      console.log('[AuthContext] ✅ Login initiated - waiting for auth state change');
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: Login failed:', error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ) => {
    try {
      console.log('[AuthContext] 📝 Register called');
      await authService.register({
        email,
        password,
        confirmPassword: password,
        displayName,
        phoneNumber,
      });
      // DO NOT set user here - onAuthStateChanged will handle it
      // This ensures Firestore document is created consistently
      console.log('[AuthContext] ✅ Registration initiated - waiting for auth state change');
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (__DEV__) {
      console.log('[AuthContext] 🚪 Logout called');
    }
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
      if (__DEV__) {
        console.log('[AuthContext] ✅ Logout successful');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[AuthContext] ❌ Logout error:', error);
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const updateUser = async (updates: { displayName?: string; phoneNumber?: string; photoURL?: string }) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    const updatedUser = await authService.updateUserProfile(user.uid, updates);
    setUser(updatedUser);
  };

  const isAuthenticated = user !== null;

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAuthenticated,
    isGuest,
    login,
    register,
    logout,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
