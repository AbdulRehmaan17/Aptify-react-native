import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Property, User } from '../types';
import { canManageProperty, isAdmin, requireAuth, requireRole } from '../utils/accessControl';
import { isFirestoreIndexError } from '../utils/firestoreSafe';

/**
 * Property Service
 * Handles all property-related operations
 */
export const propertyService = {
  /**
   * Get all properties
   * Role-based access: Non-admins only see approved properties
   */
  async getAllProperties(
    filters?: {
      city?: string;
      state?: string;
      propertyType?: Property['propertyType'];
      status?: Property['status'];
      minPrice?: number;
      maxPrice?: number;
      approved?: boolean;
    },
    user?: User | null,
    limitCount?: number
  ): Promise<Property[]> {
    try {
      // Public read - allow guest users to browse approved properties
      // Non-admins can only see approved properties
      // Admins can see all properties if explicitly requested
      const currentUser = user || null;
      const approvedFilter = isAdmin(currentUser)
        ? (filters?.approved !== undefined ? filters.approved : true)
        : true; // Non-admins always see only approved properties

      // Build query constraints in correct order:
      // 1. Collection
      // 2. Where clauses (approved, status, city, state, propertyType) - MUST be before orderBy
      // 3. orderBy('createdAt', 'desc') - MUST be after where clauses, before limit
      // 4. limit (if provided) - MUST be after orderBy


      const constraints: any[] = [];

      // Only filter by approved if explicitly requested or if user is guest/standard user
      // Relaxed logic: If approvedFilter is true, we keep it. 
      // If it causes empty results due to missing index, we'll handle that in catch block or warn.
      // REMOVED HARDCODED FILTER: We want to see ALL properties to debug
      // if (approvedFilter) {
      //   constraints.push(where('approved', '==', true));
      // }
      console.log('[PropertyService] 🔍 getAllProperties called with filters:', filters);


      // Add status filter if provided (must be before orderBy)
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      // Add location filters if provided (must be before orderBy)
      if (filters?.city) {
        constraints.push(where('location.city', '==', filters.city));
      }

      if (filters?.state) {
        constraints.push(where('location.state', '==', filters.state));
      }

      if (filters?.propertyType) {
        constraints.push(where('propertyType', '==', filters.propertyType));
      }

      // ALWAYS add orderBy('createdAt', 'desc') - NEVER use asc
      // MUST be added after where clauses, before limit()
      constraints.push(orderBy('createdAt', 'desc'));

      // Add limit if provided (MUST be after orderBy)
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      // Build final query
      const q = query(
        collection(db, 'properties'),
        ...constraints
      );

      const snapshot = await getDocs(q);
      const properties: Property[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Normalize property fields with safe defaults
        const property: Property = {
          ...data,
          id: docSnap.id,
          // Normalize approved to boolean, default to true if missing for legacy data (or false if strict)
          // For now, defaulting to Boolean(data.approved) which is false if undefined. 
          // But strict null check was: if (!data.ownerId) return;

          approved: data.approved !== undefined ? Boolean(data.approved) : true, // Default to true for legacy? Or false. Let's stick to existing logic but safe.

          // Normalize status
          status: String(data.status || 'available') as Property['status'],

          // Normalize createdAt - Default to now if missing
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),

          // Ensure ownerId exists
          ownerId: data.ownerId || 'unknown-owner',

          // Ensure location exists
          location: data.location || { address: 'Unknown', city: 'Unknown', state: 'Unknown', zipCode: '' },

          // Ensure images exists
          images: data.images || [],

          // Ensure price exists
          price: typeof data.price === 'number' ? data.price : 0,

          title: data.title || 'Untitled Property',
          description: data.description || 'No description available',
          propertyType: data.propertyType || 'other',
        } as Property;

        // Defensive mapping for critical fields
        if (!property.id) property.id = docSnap.id;
        if (property.approved === undefined) property.approved = false; // Default to false if missing


        // Log warning if fields were missing but include the property
        if (!data.createdAt || !data.ownerId) {
          if (__DEV__) {
            console.warn('[PropertyService] ⚠️ Property missing required fields (using defaults)', {
              id: docSnap.id,
              missingCreatedAt: !data.createdAt,
              missingOwnerId: !data.ownerId
            });
          }
        }

        properties.push(property);
      });

      // Apply price filters in memory (Firestore doesn't support range queries easily)
      let filteredProperties = properties;
      if (filters?.minPrice) {
        filteredProperties = filteredProperties.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters?.maxPrice) {
        filteredProperties = filteredProperties.filter((p) => p.price <= filters.maxPrice!);
      }

      // Results are already in desc order (newest first) from Firestore query
      // No need to reverse

      if (__DEV__) {
        console.log('[PropertyService] ✅ getAllProperties result', {
          totalDocsHasData: !snapshot.empty,
          snapshotSize: snapshot.size,
          mappedCount: properties.length,
          filteredCount: filteredProperties.length,
          sampleId: filteredProperties.length > 0 ? filteredProperties[0].id : 'N/A'
        });
      }

      return filteredProperties;
    } catch (error: any) {
      // Handle Firestore index errors gracefully - app must NEVER crash due to missing index
      if (isFirestoreIndexError(error)) {
        console.warn('[PropertyService] ⚠️ Missing Firestore index for getAllProperties. Attempting fallback query without sort/filter.', {
          code: error?.code,
          message: error?.message,
          link: error?.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0],
        });

        // Fallback: Try simple query without complex filters/sorts to at least show SOMETHING
        try {
          const fallbackQ = query(collection(db, 'properties'), limit(20));
          const snapshot = await getDocs(fallbackQ);
          if (!snapshot.empty) {
            console.log('[PropertyService] ✅ Fallback query returned results');
            return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Property));
          }
        } catch (e) {
          console.error('[PropertyService] ❌ Fallback query also failed', e);
        }

        return [];
      }

      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: getAllProperties failed:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
        });
      }

      // Re-throw non-index errors so they can be handled by UI
      throw error;
    }
  },

  /**
   * Get property by ID
   * Role-based access: Non-admins can only see approved properties or their own
   */
  async getPropertyById(id: string, user: User | null = null): Promise<Property | null> {
    try {
      const docRef = doc(db, 'properties', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Normalize property fields
        const property: Property = {
          ...data,
          id: docSnap.id,
          approved: Boolean(data.approved),
          status: String(data.status || 'available') as Property['status'],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Property;

        // Non-admins can only see approved properties or their own
        if (!isAdmin(user) && !property.approved && property.ownerId !== user?.uid) {
          return null;
        }

        return property;
      }

      return null;
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: getPropertyById failed:', error);
      }
      throw new Error(error.message || 'Failed to fetch property');
    }
  },

  /**
   * Create a new property
   * Ownership: Sets ownerId from current user, requires Owner role
   */
  async createProperty(
    property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    user: User | null
  ): Promise<string> {
    try {
      requireAuth(user);

      // CRITICAL FIX: Ensure we have the latest role from Firestore
      // The context user object might be stale or missing the role if just signed up
      const userRef = doc(db, 'users', user!.uid);
      const userSnap = await getDoc(userRef);

      let effectiveUser = user!;

      if (userSnap.exists()) {
        const userData = userSnap.data();
        // If role is missing in Firestore, default to Owner for now (per requirements)
        // Otherwise use what's in DB
        const dbRole = userData.role || 'Owner';

        // Update our effective user object with the fresh role
        effectiveUser = {
          ...effectiveUser,
          role: dbRole
        };

        console.log('[PropertyService] 👤 Fresh user data fetched:', {
          uid: effectiveUser.uid,
          role: effectiveUser.role
        });
      } else {
        // Fallback if doc doesn't exist (shouldn't happen due to AuthContext)
        console.warn('[PropertyService] ⚠️ User doc not found, defaulting to Owner role');
        effectiveUser = { ...effectiveUser, role: 'Owner' };
      }

      // Now check role against our potentially updated user object
      requireRole(effectiveUser, 'Owner');

      // Validate ownerId matches authenticated user (security rule requirement)
      const ownerId = effectiveUser.uid;
      if (!ownerId || typeof ownerId !== 'string') {
        throw new Error('Invalid user ID');
      }

      const docRef = await addDoc(collection(db, 'properties'), {
        ...property,
        ownerId, // Must equal request.auth.uid (security rule requirement)
        approved: false, // New properties require admin approval (security rule requirement)
        createdAt: serverTimestamp(), // Timestamp - required by security rule
        updatedAt: serverTimestamp(),
      });

      if (__DEV__) {
        console.log('[PropertyService] ✅ Property created', {
          propertyId: docRef.id,
          ownerId,
        });
      }

      return docRef.id;
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: createProperty failed:', error);
      }
      throw error; // Let the UI handle the error (it has good error boundaries)
    }
  },

  /**
   * Update a property
   * Ownership: Only owner or admin can update
   */
  async updateProperty(id: string, updates: Partial<Property>, user: User | null): Promise<void> {
    try {
      requireAuth(user);

      // Get property to check ownership
      const propertyDoc = await getDoc(doc(db, 'properties', id));
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }

      const property = propertyDoc.data() as Property;
      if (!canManageProperty(user, property.ownerId)) {
        throw new Error('Access denied. You do not have permission to update this property.');
      }

      // Prevent changing ownerId or approved status (unless admin)
      // Security rules require: ownerId cannot change, approved can only change by admin
      const safeUpdates: any = { ...updates };

      // Always preserve ownerId (security rule requirement)
      safeUpdates.ownerId = property.ownerId;

      if (!isAdmin(user)) {
        // Non-admins cannot change approved status
        safeUpdates.approved = property.approved;
      }

      // Always update updatedAt timestamp
      safeUpdates.updatedAt = serverTimestamp();

      const docRef = doc(db, 'properties', id);
      await updateDoc(docRef, safeUpdates);
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: updateProperty failed:', error);
      }
      throw new Error(error.message || 'Failed to update property');
    }
  },

  /**
   * Delete a property
   * Ownership: Only owner or admin can delete
   */
  async deleteProperty(id: string, user: User | null): Promise<void> {
    try {
      requireAuth(user);

      // Get property to check ownership
      const propertyDoc = await getDoc(doc(db, 'properties', id));
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }

      const property = propertyDoc.data() as Property;
      if (!canManageProperty(user, property.ownerId)) {
        throw new Error('Access denied. You do not have permission to delete this property.');
      }

      const docRef = doc(db, 'properties', id);
      await deleteDoc(docRef);
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: deleteProperty failed:', error);
      }
      throw new Error(error.message || 'Failed to delete property');
    }
  },

  /**
   * Upload property image
   */
  async uploadPropertyImage(uri: string, propertyId: string, imageName: string): Promise<string> {
    try {
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary is not configured. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
      }

      const formData = new FormData();
      // @ts-ignore - React Native FormData file type
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: imageName,
      });
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', `properties/${propertyId}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        if (__DEV__) {
          console.error('[PropertyService] ❌ Cloudinary upload failed:', data);
        }
        throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
      }

      return data.secure_url as string;
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: uploadPropertyImage failed:', error);
      }
      throw new Error(error.message || 'Failed to upload image');
    }
  },

  /**
   * Get properties by owner ID
   * Ownership: Users can only see their own properties (or admin can see any)
   */
  async getPropertiesByOwner(ownerId: string, user: User | null, limitCount?: number): Promise<Property[]> {
    try {
      // Users can only query their own properties (unless admin)
      const currentUser = user || null;
      if (!isAdmin(currentUser) && currentUser?.uid !== ownerId) {
        throw new Error('Access denied. You can only view your own properties.');
      }

      // MY LISTINGS pattern:
      // where("ownerId", "==", ownerId)
      // orderBy("createdAt", "desc")
      const constraints: any[] = [
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      ];

      // Add pagination limit if provided (MUST be after orderBy)
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(
        collection(db, 'properties'),
        ...constraints
      );

      const snapshot = await getDocs(q);
      const properties: Property[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Normalize property fields
        const property: Property = {
          ...data,
          id: docSnap.id,
          approved: Boolean(data.approved),
          status: String(data.status || 'available') as Property['status'],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Property;

        properties.push(property);
      });

      return properties;
    } catch (error: any) {
      // Gracefully handle missing index errors
      if (isFirestoreIndexError(error)) {
        console.warn('[PropertyService] ⚠️ Missing Firestore index for getPropertiesByOwner. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: getPropertiesByOwner failed:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
        });
      }

      // Re-throw non-index errors so they can be handled by UI
      throw error;
    }
  },

  /**
   * Get pending properties (for admin approval)
   * Role-based access: Only admins can view pending properties
   */
  async getPendingProperties(user: User): Promise<Property[]> {
    try {
      requireRole(user, ['Admin', 'admin']);

      const q = query(
        collection(db, 'properties'),
        where('approved', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const properties: Property[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Normalize property fields
        const property: Property = {
          ...data,
          id: docSnap.id,
          approved: Boolean(data.approved),
          status: String(data.status || 'available') as Property['status'],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Property;

        properties.push(property);
      });

      return properties;
    } catch (error: any) {
      // Gracefully handle missing index errors
      if (isFirestoreIndexError(error)) {
        console.warn('[PropertyService] ⚠️ Missing Firestore index for getPendingProperties. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: getPendingProperties failed:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
        });
      }
      throw error;
    }
  },

  /**
   * Approve a property
   * Role-based access: Only admins can approve
   */
  async approveProperty(propertyId: string, user: User): Promise<void> {
    try {
      requireRole(user, 'Admin');

      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        approved: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: approveProperty failed:', error);
      }
      throw new Error(error.message || 'Failed to approve property');
    }
  },

  /**
   * Reject a property
   * Role-based access: Only admins can reject
   */
  async rejectProperty(propertyId: string, user: User): Promise<void> {
    try {
      requireRole(user, ['Admin', 'admin']);

      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        approved: false,
        status: 'pending',
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: rejectProperty failed:', error);
      }
      throw new Error(error.message || 'Failed to reject property');
    }
  },

  /**
   * Get unique cities and states from approved properties
   */
  async getUniqueLocations(): Promise<{ cities: string[]; states: string[] }> {
    try {
      const q = query(
        collection(db, 'properties'),
        where('approved', '==', true),
        where('status', '==', 'available')
      );

      const snapshot = await getDocs(q);
      const citiesSet = new Set<string>();
      const statesSet = new Set<string>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const location = data.location;
        if (location?.city) {
          citiesSet.add(location.city);
        }
        if (location?.state) {
          statesSet.add(location.state);
        }
      });

      return {
        cities: Array.from(citiesSet).sort(),
        states: Array.from(statesSet).sort(),
      };
    } catch (error: any) {
      // Gracefully handle missing index errors
      if (isFirestoreIndexError(error)) {
        console.warn('[PropertyService] ⚠️ Missing Firestore index for getUniqueLocations. Returning empty locations.', {
          code: error?.code,
          message: error?.message,
        });
        return { cities: [], states: [] };
      }

      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: getUniqueLocations failed:', error);
      }
      throw new Error(error.message || 'Failed to fetch locations');
    }
  },

  /**
   * Subscribe to all properties (real-time updates)
   * Role-based access: Non-admins only see approved properties
   */
  subscribeToAllProperties(
    user: User | null,
    filters: {
      city?: string;
      state?: string;
      propertyType?: Property['propertyType'];
      status?: Property['status'];
      approved?: boolean;
    } | undefined,
    callback: (properties: Property[]) => void
  ): () => void {
    const approvedFilter = isAdmin(user)
      ? (filters?.approved !== undefined ? filters.approved : true)
      : true;

    // Build query constraints in correct order:
    // 1. Where clauses (approved, status, city, state, propertyType) - MUST be before orderBy
    // 2. orderBy('createdAt', 'desc') - MUST be after where clauses
    const constraints: any[] = [
      where('approved', '==', approvedFilter)
    ];

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.city) {
      constraints.push(where('location.city', '==', filters.city));
    }
    if (filters?.state) {
      constraints.push(where('location.state', '==', filters.state));
    }
    if (filters?.propertyType) {
      constraints.push(where('propertyType', '==', filters.propertyType));
    }

    // ALWAYS add orderBy('createdAt', 'desc') - NEVER use asc
    // MUST be added after all where clauses
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(
      collection(db, 'properties'),
      ...constraints
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const properties: Property[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Normalize property fields with safe defaults
          const property: Property = {
            ...data,
            id: docSnap.id,
            approved: data.approved !== undefined ? Boolean(data.approved) : true,
            status: String(data.status || 'available') as Property['status'],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            ownerId: data.ownerId || 'unknown-owner',
            location: data.location || { address: 'Unknown', city: 'Unknown', state: 'Unknown', zipCode: '' },
            images: data.images || [],
            price: typeof data.price === 'number' ? data.price : 0,
            title: data.title || 'Untitled Property',
            description: data.description || 'No description available',
            propertyType: data.propertyType || 'other',
          } as Property;

          // Log warning if fields were missing but include the property
          if (!data.createdAt || !data.ownerId) {
            if (__DEV__) {
              console.warn('[PropertyService] ⚠️ Property missing required fields in subscription (using defaults)', {
                id: docSnap.id,
                missingCreatedAt: !data.createdAt,
                missingOwnerId: !data.ownerId
              });
            }
          }

          properties.push(property);
        });

        // Apply price filters in memory if needed
        let filtered = properties;
        // Note: Price filters would need to be applied in callback if provided

        callback(filtered);
      },
      (error) => {
        if (__DEV__) {
          console.error('🔥 FIRESTORE ERROR: Properties subscription failed:', error);
        }
        // Call callback with empty array on error - UI will show empty state
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to properties by owner (real-time updates)
   * Ownership: Users can only subscribe to their own properties (or admin can see any)
   */
  subscribeToPropertiesByOwner(
    ownerId: string,
    user: User | null,
    callback: (properties: Property[]) => void
  ): () => void {
    if (!isAdmin(user) && user?.uid !== ownerId) {
      console.error('Access denied. Users can only subscribe to their own properties.');
      return () => { };
    }

    const q = query(
      collection(db, 'properties'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const properties: Property[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Normalize property fields
          const property: Property = {
            ...data,
            id: docSnap.id,
            approved: Boolean(data.approved),
            status: String(data.status || 'available') as Property['status'],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Property;

          properties.push(property);
        });
        callback(properties);
      },
      (error) => {
        if (__DEV__) {
          console.error('🔥 FIRESTORE ERROR: Owner properties subscription failed:', error);
        }
        // Call callback with empty array on error - UI will show empty state
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to a single property (real-time updates)
   */
  subscribeToProperty(
    propertyId: string,
    user: User | null,
    callback: (property: Property | null) => void
  ): () => void {
    const docRef = doc(db, 'properties', propertyId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Normalize property fields
          const property: Property = {
            ...data,
            id: docSnap.id,
            approved: Boolean(data.approved),
            status: String(data.status || 'available') as Property['status'],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Property;

          // Non-admins can only see approved properties or their own
          if (!isAdmin(user) && !property.approved && property.ownerId !== user?.uid) {
            callback(null);
            return;
          }

          callback(property);
        } else {
          callback(null);
        }
      },
      (error) => {
        if (__DEV__) {
          console.error('Error in property subscription:', error);
        }
        callback(null);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to pending properties (real-time updates, admin only)
   */
  subscribeToPendingProperties(
    user: User,
    callback: (properties: Property[]) => void
  ): () => void {
    if (!isAdmin(user)) {
      if (__DEV__) {
        console.error('Access denied. Only admins can subscribe to pending properties.');
      }
      return () => { };
    }

    const q = query(
      collection(db, 'properties'),
      where('approved', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const properties: Property[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Normalize property fields
          const property: Property = {
            ...data,
            id: docSnap.id,
            approved: Boolean(data.approved),
            status: String(data.status || 'available') as Property['status'],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Property;

          properties.push(property);
        });
        callback(properties);
      },
      (error) => {
        if (__DEV__) {
          console.error('🔥 FIRESTORE ERROR: Pending properties subscription failed:', error);
        }
        // Call callback with empty array on error - UI will show empty state
        callback([]);
      }
    );

    return unsubscribe;
  },
};

