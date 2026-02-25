import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LoginForm, RegisterForm, User } from '../types';

const USER_STORAGE_KEY = '@aptify_user';
const AUTH_TOKEN_KEY = '@aptify_auth_token';

/**
 * Authentication Service
 * Handles all authentication-related operations
 */
export const authService = {
  /**
   * Register a new user
   * 
   * EMAIL/PASSWORD AUTH READY:
   * - Uses Firebase createUserWithEmailAndPassword
   * - Creates Firestore user document
   * - Stores user in AsyncStorage for persistence
   * - Includes friendly error messages and validation
   */
  async register(formData: RegisterForm): Promise<User> {
    try {
      if (__DEV__) {
        console.log('[AuthService] 🔐 Starting registration for:', formData.email);
        console.log('[AuthService] ✅ Email/Password registration ready');
      }

      // Validate Firebase auth is available
      if (!auth) {
        throw new Error('Firebase authentication is not initialized. Please check your Firebase configuration.');
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const firebaseUser = userCredential.user;

      if (__DEV__) {
        console.log('[AuthService] ✅ User created in Firebase Auth:', firebaseUser.uid);
      }

      // Update display name
      if (formData.displayName) {
        await updateProfile(firebaseUser, {
          displayName: formData.displayName,
        });
      }

      // Ensure Firestore user document exists (idempotent - creates only if doesn't exist)
      const userRef = doc(db, 'users', firebaseUser.uid);
      const existingUserDoc = await getDoc(userRef);

      if (!existingUserDoc.exists()) {
        // Create user document in Firestore (only if doesn't exist)
        // Structure: uid, name, email, photoURL, provider, role="user", createdAt
        try {
          const userData = {
            uid: firebaseUser.uid,
            name: formData.displayName || '',
            email: formData.email,
            photoURL: null,
            provider: 'email' as const,
            role: 'user' as const,
            createdAt: serverTimestamp(),
          };

          await setDoc(userRef, userData);

          if (__DEV__) {
            console.log('[AuthService] ✅ User document created in Firestore');
          }
        } catch (firestoreError: any) {
          // If Firestore creation fails, log error but don't fail registration
          // Firebase Auth user is already created, document will be created on next login
          if (__DEV__) {
            console.error('[AuthService] ⚠️ Failed to create Firestore document:', firestoreError);
            console.log('[AuthService] ℹ️ Firebase Auth user created, Firestore document will be created on next login');
          }
        }
      } else {
        if (__DEV__) {
          console.log('[AuthService] ✅ User document already exists in Firestore');
        }
      }

      // Store user in AsyncStorage (map Firestore 'name' to User 'displayName')
      const user: User = {
        uid: firebaseUser.uid,
        email: formData.email,
        displayName: formData.displayName,
        photoURL: undefined,
        phoneNumber: formData.phoneNumber,
        role: 'user',
        provider: 'email',
        createdAt: new Date(),
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      if (__DEV__) {
        console.log('[AuthService] ✅ User stored in AsyncStorage');
        console.log('[AuthService] ✅ Registration completed successfully');
      }

      return user;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: Registration failed:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or sign in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Login user
   * 
   * EMAIL/PASSWORD AUTH READY:
   * - Uses Firebase signInWithEmailAndPassword
   * - Retrieves user data from Firestore
   * - Stores user in AsyncStorage for persistence
   * - Includes friendly error messages and validation
   */
  async login(formData: LoginForm): Promise<User> {
    try {
      if (__DEV__) {
        console.log('[AuthService] 🔐 Starting login for:', formData.email);
        console.log('[AuthService] ✅ Email/Password login ready');
      }

      // Validate Firebase auth is available
      if (!auth) {
        throw new Error('Firebase authentication is not initialized. Please check your Firebase configuration.');
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const firebaseUser = userCredential.user;

      if (__DEV__) {
        console.log('[AuthService] ✅ User signed in to Firebase Auth:', firebaseUser.uid);
      }

      // Ensure Firestore user document exists (idempotent)
      const userRef = doc(db, 'users', firebaseUser.uid);
      let userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create Firestore document if it doesn't exist (first login)
        if (__DEV__) {
          console.log('[AuthService] 📝 Creating Firestore document for existing Firebase Auth user');
        }
        const newUserData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || null,
          provider: 'email' as const,
          role: 'user' as const,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newUserData);
        // Re-fetch to get timestamp
        userDoc = await getDoc(userRef);
      } else {
        if (__DEV__) {
          console.log('[AuthService] ✅ Firestore user document already exists');
        }
      }

      const userData = userDoc.data();

      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || userData?.email || '',
        displayName: userData?.name || firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || userData?.photoURL,
        phoneNumber: userData?.phoneNumber,
        role: userData?.role || 'user',
        provider: userData?.provider || 'email',
        createdAt: userData?.createdAt?.toDate(),
        updatedAt: userData?.updatedAt?.toDate(),
      };

      // DO NOT store user here - AuthContext will handle it via onAuthStateChanged
      // This ensures consistent user document creation for both email and Google auth
      console.log('[AuthService] ✅ Login completed - AuthContext will handle Firestore doc');

      // Return minimal user for immediate UI feedback
      return user;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: Login failed:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase configuration error. Please check your environment variables and restart the app.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (__DEV__) {
        console.error('[AuthService] ❌ Login error code:', error.code);
        console.error('[AuthService] ❌ Login error message:', error.message);
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('[AuthService] 🔐 Starting logout');
      }

      await signOut(auth);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);

      console.log('[AuthService] ✅ Logout completed successfully');
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: Logout failed:', error);
      throw new Error(error.message || 'Logout failed');
    }
  },

  /**
   * Get current user from AsyncStorage
   * Handles date parsing for createdAt and updatedAt fields
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        // Parse date strings back to Date objects
        if (user.createdAt) {
          user.createdAt = new Date(user.createdAt);
        }
        if (user.updatedAt) {
          user.updatedAt = new Date(user.updatedAt);
        }
        return user;
      }
      return null;
    } catch (error) {
      if (__DEV__) {
        console.error('[AuthService] ❌ Error parsing stored user:', error);
      }
      return null;
    }
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: resetPassword failed:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  },

  /**
   * Sign in with Google using OAuth id_token
   * 
   * This method:
   * Update user profile
   * Ownership: Users can only update their own profile
   */
  async updateUserProfile(
    userId: string,
    updates: {
      displayName?: string;
      phoneNumber?: string;
      photoURL?: string;
    }
  ): Promise<User> {
    try {
      const firebaseUser = auth.currentUser;

      // Verify user is authenticated and updating their own profile
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }

      if (firebaseUser.uid !== userId) {
        throw new Error('Access denied. You can only update your own profile.');
      }

      // Update Firebase Auth profile if displayName or photoURL changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(firebaseUser, {
          displayName: updates.displayName || firebaseUser.displayName || undefined,
          photoURL: updates.photoURL || firebaseUser.photoURL || undefined,
        });
      }

      // Update Firestore user document (map displayName to 'name' field for web app compatibility)
      // Use firebaseUser.uid to ensure we're updating the correct user (matches security rules)
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const currentData = userDoc.data();

      // Prepare Firestore update (map displayName to 'name')
      // Security rules require: uid, email cannot change, role restrictions
      const firestoreUpdates: any = {
        updatedAt: serverTimestamp(),
      };

      if (updates.displayName !== undefined) {
        firestoreUpdates.name = updates.displayName;
      }
      if (updates.photoURL !== undefined) {
        firestoreUpdates.photoURL = updates.photoURL;
      }
      if (updates.phoneNumber !== undefined) {
        firestoreUpdates.phoneNumber = updates.phoneNumber;
      }

      // Use merge: true to preserve existing fields (uid, email, role, etc.)
      await setDoc(userRef, firestoreUpdates, { merge: true });

      // Get updated user data
      const updatedDoc = await getDoc(userRef);
      const updatedData = updatedDoc.data();

      const updatedUser: User = {
        uid: firebaseUser.uid, // Always use firebaseUser.uid
        email: firebaseUser.email || currentData?.email || '',
        displayName: updates.displayName || updatedData?.name || firebaseUser.displayName || '',
        photoURL: updates.photoURL !== undefined ? updates.photoURL : (firebaseUser.photoURL || updatedData?.photoURL),
        phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber : updatedData?.phoneNumber,
        role: updatedData?.role || 'user',
        provider: updatedData?.provider || 'email',
        createdAt: updatedData?.createdAt?.toDate(),
        updatedAt: updatedData?.updatedAt?.toDate() || new Date(),
      };

      // Update AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: updateUserProfile failed:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Delete user account and all associated data
   * WARNING: This action is irreversible
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser || firebaseUser.uid !== userId) {
        throw new Error('User not authenticated or user ID mismatch');
      }

      if (__DEV__) {
        console.log('[AuthService] 🗑️ Starting account deletion for user:', userId);
      }

      // Delete user's Firestore data in batches
      const batch = writeBatch(db);

      try {
        // Delete user's properties
        const propertiesRef = collection(db, 'properties');
        const propertiesQuery = query(propertiesRef, where('ownerId', '==', userId));
        const propertiesSnapshot = await getDocs(propertiesQuery);

        propertiesSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // Delete user's service requests
        const requestsRef = collection(db, 'serviceRequests');
        const requesterQuery = query(requestsRef, where('requesterId', '==', userId));
        const requesterSnapshot = await getDocs(requesterQuery);

        requesterSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        const providerQuery = query(requestsRef, where('providerId', '==', userId));
        const providerSnapshot = await getDocs(providerQuery);

        providerSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // Delete user's notifications
        const notificationsRef = collection(db, 'notifications');
        const notificationsQuery = query(notificationsRef, where('userId', '==', userId));
        const notificationsSnapshot = await getDocs(notificationsQuery);

        notificationsSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // Delete user's chats and messages
        const chatsRef = collection(db, 'chats');
        const chatsQuery = query(chatsRef, where('participants', 'array-contains', userId));
        const chatsSnapshot = await getDocs(chatsQuery);

        for (const docSnap of chatsSnapshot.docs) {
          const chatData = docSnap.data();
          // Delete chat if user is the only participant, otherwise just remove user from participants
          if (chatData.participants?.length === 1) {
            batch.delete(docSnap.ref);

            // Delete associated messages
            const messagesRef = collection(db, 'messages');
            const messagesQuery = query(messagesRef, where('chatId', '==', docSnap.id));
            const messagesSnapshot = await getDocs(messagesQuery);
            for (const msgDoc of messagesSnapshot.docs) {
              batch.delete(msgDoc.ref);
            }
          }
        }

        // Delete user's push tokens subcollection
        const pushTokensRef = collection(db, 'users', userId, 'pushTokens');
        const pushTokensSnapshot = await getDocs(pushTokensRef);
        pushTokensSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // Commit all Firestore deletions
        await batch.commit();

        if (__DEV__) {
          console.log('[AuthService] ✅ Firestore data deleted');
        }
      } catch (firestoreError: any) {
        if (__DEV__) {
          console.error('[AuthService] ⚠️ Error deleting Firestore data:', firestoreError);
        }
        // Continue with Firebase Auth deletion even if Firestore deletion fails
        // Some data might still be deleted, but we should proceed
      }

      // Delete user document (this should be done separately after subcollections)
      try {
        await deleteDoc(doc(db, 'users', userId));
        if (__DEV__) {
          console.log('[AuthService] ✅ User document deleted');
        }
      } catch (docError: any) {
        if (__DEV__) {
          console.error('[AuthService] ⚠️ Error deleting user document:', docError);
        }
      }

      // Delete Firebase Auth user
      await firebaseDeleteUser(firebaseUser);

      // Clear AsyncStorage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);

      if (__DEV__) {
        console.log('[AuthService] ✅ Account deleted successfully');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AuthService] ❌ Account deletion error:', error);
      }

      let errorMessage = 'Failed to delete account. Please try again.';

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security, please log out and log back in before deleting your account.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },
};
