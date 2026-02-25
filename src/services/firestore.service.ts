import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Query Options for Firestore queries
 */
export interface QueryOptions {
  where?: Array<{ field: string; operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in'; value: any }>;
  orderBy?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

/**
 * Firestore Service
 * Centralized CRUD operations for Firestore
 * Handles all Firestore operations with consistent error handling
 */
export const firestoreService = {
  /**
   * Create a new document in a collection
   * 
   * @param collectionName - Name of the Firestore collection
   * @param data - Document data (without id, createdAt, updatedAt)
   * @param options - Optional: include timestamps, custom document ID
   * @returns Document ID
   * 
   * @example
   * const id = await firestoreService.createDoc('properties', {
   *   title: 'My Property',
   *   price: 100000
   * });
   */
  async createDoc(
    collectionName: string,
    data: Record<string, any>,
    options?: {
      includeTimestamps?: boolean;
      customId?: string;
    }
  ): Promise<string> {
    try {
      if (__DEV__) {
        console.log(`[FirestoreService] Creating document in collection: ${collectionName}`);
      }

      // Prepare document data
      const docData: Record<string, any> = { ...data };

      // Add timestamps if requested
      if (options?.includeTimestamps !== false) {
        docData.createdAt = serverTimestamp();
        docData.updatedAt = serverTimestamp();
      }

      let docRef;

      if (options?.customId) {
        // Use custom document ID
        docRef = doc(db, collectionName, options.customId);
        await setDoc(docRef, docData);
      } else {
        // Auto-generate document ID
        docRef = await addDoc(collection(db, collectionName), docData);
      }

      if (__DEV__) {
        console.log(`[FirestoreService] ✅ Document created with ID: ${docRef.id}`);
      }

      return docRef.id;
    } catch (error: any) {
      // Enhanced error logging for security rule violations
      const errorMessage = error.message || `Failed to create document in ${collectionName}`;

      if (__DEV__) {
        console.error(`[FirestoreService] ❌ Error creating document in ${collectionName}:`, {
          error,
          code: error.code,
          message: errorMessage,
          collectionName,
          dataKeys: Object.keys(data || {}),
          hint: error.code === 'permission-denied'
            ? 'Check Firestore security rules match the query structure'
            : error.code === 'failed-precondition'
              ? 'Missing composite index - check Firebase Console'
              : 'Unknown error',
        });
      }

      // Provide user-friendly error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your access rights.');
      } else if (error.code === 'failed-precondition') {
        throw new Error('Database index missing. Please contact support.');
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Get multiple documents from a collection
   * 
   * @param collectionName - Name of the Firestore collection
   * @param queryOptions - Optional query constraints (where, orderBy, limit)
   * @returns Array of documents with id field
   * 
   * @example
   * const properties = await firestoreService.getDocs('properties', {
   *   where: [{ field: 'approved', operator: '==', value: true }],
   *   orderBy: [{ field: 'createdAt', direction: 'desc' }],
   *   limit: 10
   * });
   */
  async getDocs<T = DocumentData>(
    collectionName: string,
    queryOptions?: QueryOptions
  ): Promise<Array<T & { id: string }>> {
    try {
      if (__DEV__) {
        console.log(`[FirestoreService] Getting documents from collection: ${collectionName}`, {
          filters: queryOptions?.where,
          orderBy: queryOptions?.orderBy,
          limit: queryOptions?.limit
        });
      }

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Add where clauses
      if (queryOptions?.where) {
        for (const whereClause of queryOptions.where) {
          constraints.push(
            where(
              whereClause.field,
              whereClause.operator,
              whereClause.value
            )
          );
        }
      }

      // Add orderBy clauses
      if (queryOptions?.orderBy) {
        for (const orderByClause of queryOptions.orderBy) {
          constraints.push(
            orderBy(
              orderByClause.field,
              orderByClause.direction || 'asc'
            )
          );
        }
      }

      // Add limit
      if (queryOptions?.limit) {
        constraints.push(limit(queryOptions.limit));
      }

      // Add startAfter for pagination
      if (queryOptions?.startAfter) {
        constraints.push(startAfter(queryOptions.startAfter));
      }

      // Build and execute query
      const q = constraints.length > 0
        ? query(collection(db, collectionName), ...constraints)
        : collection(db, collectionName);

      const snapshot = await getDocs(q);
      const documents: Array<T & { id: string }> = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        documents.push({
          id: docSnap.id,
          ...data,
          // Convert Firestore Timestamps to Date objects
          ...Object.keys(data).reduce((acc, key) => {
            if (data[key] instanceof Timestamp) {
              acc[key] = data[key].toDate();
            }
            return acc;
          }, {} as Record<string, any>),
        } as T & { id: string });
      });

      if (__DEV__) {
        console.log(`[FirestoreService] ✅ Retrieved ${documents.length} documents from ${collectionName}`);
      }

      return documents;
    } catch (error: any) {
      // Enhanced error logging for security rule violations
      const errorMessage = error.message || `Failed to get documents from ${collectionName}`;

      if (__DEV__) {
        console.error(`[FirestoreService] ❌ Error getting documents from ${collectionName}:`, {
          error,
          code: error.code,
          message: errorMessage,
          collectionName,
          queryOptions,
          hint: error.code === 'permission-denied'
            ? 'Check Firestore security rules match the query structure'
            : error.code === 'failed-precondition'
              ? 'Missing composite index - check Firebase Console'
              : 'Unknown error',
        });
      }

      // Provide user-friendly error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your access rights.');
      } else if (error.code === 'failed-precondition') {
        throw new Error('Database index missing. Please contact support.');
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Get a single document by ID
   * 
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Document data with id field, or null if not found
   * 
   * @example
   * const property = await firestoreService.getDoc('properties', 'property-id');
   */
  async getDoc<T = DocumentData>(
    collectionName: string,
    id: string
  ): Promise<(T & { id: string }) | null> {
    try {
      if (__DEV__) {
        console.log(`[FirestoreService] Getting document ${id} from collection: ${collectionName}`);
      }

      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        if (__DEV__) {
          console.log(`[FirestoreService] ⚠️ Document ${id} does not exist in ${collectionName}`);
        }
        return null;
      }

      const data = docSnap.data();
      const document = {
        id: docSnap.id,
        ...data,
        // Convert Firestore Timestamps to Date objects
        ...Object.keys(data).reduce((acc, key) => {
          if (data[key] instanceof Timestamp) {
            acc[key] = data[key].toDate();
          }
          return acc;
        }, {} as Record<string, any>),
      } as T & { id: string };

      if (__DEV__) {
        console.log(`[FirestoreService] ✅ Retrieved document ${id} from ${collectionName}`);
      }

      return document;
    } catch (error: any) {
      if (__DEV__) {
        console.error(`[FirestoreService] ❌ Error getting document ${id} from ${collectionName}:`, error);
      }
      throw new Error(error.message || `Failed to get document ${id} from ${collectionName}`);
    }
  },

  /**
   * Update a document in a collection
   * 
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @param data - Partial document data to update
   * @param options - Optional: include updatedAt timestamp
   * @returns void
   * 
   * @example
   * await firestoreService.updateDoc('properties', 'property-id', {
   *   title: 'Updated Title',
   *   price: 150000
   * });
   */
  async updateDoc(
    collectionName: string,
    id: string,
    data: Record<string, any>,
    options?: {
      includeTimestamps?: boolean;
    }
  ): Promise<void> {
    try {
      if (__DEV__) {
        console.log(`[FirestoreService] Updating document ${id} in collection: ${collectionName}`);
      }

      // Prepare update data
      const updateData: Record<string, any> = { ...data };

      // Add updatedAt timestamp if requested
      if (options?.includeTimestamps !== false) {
        updateData.updatedAt = serverTimestamp();
      }

      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updateData);

      if (__DEV__) {
        console.log(`[FirestoreService] ✅ Document ${id} updated in ${collectionName}`);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error(`[FirestoreService] ❌ Error updating document ${id} in ${collectionName}:`, error);
      }
      throw new Error(error.message || `Failed to update document ${id} in ${collectionName}`);
    }
  },

  /**
   * Delete a document from a collection
   * 
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns void
   * 
   * @example
   * await firestoreService.deleteDoc('properties', 'property-id');
   */
  async deleteDoc(collectionName: string, id: string): Promise<void> {
    try {
      if (__DEV__) {
        console.log(`[FirestoreService] Deleting document ${id} from collection: ${collectionName}`);
      }

      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      if (__DEV__) {
        console.log(`[FirestoreService] ✅ Document ${id} deleted from ${collectionName}`);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error(`[FirestoreService] ❌ Error deleting document ${id} from ${collectionName}:`, error);
      }
      throw new Error(error.message || `Failed to delete document ${id} from ${collectionName}`);
    }
  },

  /**
   * Set a document (create or update)
   * Useful when you want to ensure a document exists with specific data
   * 
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @param data - Document data
   * @param options - Optional: merge mode, include timestamps
   * @returns void
   * 
   * @example
   * await firestoreService.setDoc('users', 'user-id', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * }, { merge: true });
   */
  async setDoc(
    collectionName: string,
    id: string,
    data: Record<string, any>,
    options?: {
      merge?: boolean;
      includeTimestamps?: boolean;
    }
  ): Promise<void> {
    try {
      if (__DEV__) {
        console.log(`[FirestoreService] Setting document ${id} in collection: ${collectionName}`);
      }

      // Prepare document data
      const docData: Record<string, any> = { ...data };

      // Add timestamps if requested
      if (options?.includeTimestamps !== false) {
        if (!options?.merge) {
          // Only add createdAt if not merging (new document)
          docData.createdAt = serverTimestamp();
        }
        docData.updatedAt = serverTimestamp();
      }

      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, docData, { merge: options?.merge || false });

      if (__DEV__) {
        console.log(`[FirestoreService] ✅ Document ${id} set in ${collectionName}`);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error(`[FirestoreService] ❌ Error setting document ${id} in ${collectionName}:`, error);
      }
      throw new Error(error.message || `Failed to set document ${id} in ${collectionName}`);
    }
  },
};
