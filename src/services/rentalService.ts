import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Rental, User } from '../types';
import { isAdmin, requireAuth } from '../utils/accessControl';

/**
 * Rental Service
 * Handles all rental-related Firestore operations
 */
export const rentalService = {
  /**
   * Get all rentals
   * Public read for approved rentals
   */
  async getAllRentals(
    filters?: {
      city?: string;
      state?: string;
      propertyType?: Rental['propertyType'];
      status?: Rental['status'];
      minPrice?: number;
      maxPrice?: number;
      approved?: boolean;
    },
    user?: User | null,
    limitCount?: number
  ): Promise<Rental[]> {
    try {
      console.log('[RentalService] 🔍 Starting getAllRentals query', {
        filters,
        userId: user?.uid || 'guest',
        limit: limitCount,
      });

      // Public read - allow guest users to browse approved rentals
      // Non-admins can only see approved rentals
      const currentUser = user || null;
      const approvedFilter = isAdmin(currentUser)
        ? (filters?.approved !== undefined ? filters.approved : true)
        : true;

      let q;
      const constraints: any[] = [];

      if (approvedFilter) {
        constraints.push(where('approved', '==', true));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      q = query(collection(db, 'rentals'), ...constraints);

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.city) {
        q = query(q, where('location.city', '==', filters.city));
      }

      if (filters?.state) {
        q = query(q, where('location.state', '==', filters.state));
      }

      if (filters?.propertyType) {
        q = query(q, where('propertyType', '==', filters.propertyType));
      }

      const snapshot = await getDocs(q);

      console.log('[RentalService] ✅ Query completed', {
        snapshotSize: snapshot.size,
      });

      const rentals: Rental[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Normalize rental fields with safe defaults
        const rental: Rental = {
          id: docSnap.id,
          ...data,
          // Normalize approved
          approved: data.approved !== undefined ? Boolean(data.approved) : true,

          // Normalize status
          status: String(data.status || 'available') as Rental['status'],

          // Normalize timestamps
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          availableFrom: data.availableFrom?.toDate(),

          // Ensure ownerId exists
          ownerId: data.ownerId || 'unknown-owner',

          // Ensure location exists
          location: data.location || { address: 'Unknown', city: 'Unknown', state: 'Unknown', zipCode: '' },

          // Ensure images exists
          images: data.images || [],

          // Ensure rent exists
          monthlyRent: typeof data.monthlyRent === 'number' ? data.monthlyRent : 0,

          title: data.title || 'Untitled Rental',
          description: data.description || 'No description available',
          propertyType: data.propertyType || 'other',
        } as Rental;

        // Log warning if fields were missing
        if (!data.createdAt || !data.ownerId) {
          if (__DEV__) {
            console.warn('[RentalService] ⚠️ Rental missing required fields (using defaults)', {
              id: docSnap.id,
              missingCreatedAt: !data.createdAt,
              missingOwnerId: !data.ownerId
            });
          }
        }

        if (rental.approved !== false) {
          rentals.push(rental);
        }
      });

      // Apply price filters in memory
      let filteredRentals = rentals;
      if (filters?.minPrice) {
        filteredRentals = filteredRentals.filter((r) => r.monthlyRent >= filters.minPrice!);
      }
      if (filters?.maxPrice) {
        filteredRentals = filteredRentals.filter((r) => r.monthlyRent <= filters.maxPrice!);
      }

      console.log('[RentalService] ✅ getAllRentals result', {
        total: filteredRentals.length,
      });

      return filteredRentals;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getAllRentals failed:', error);
      throw new Error(error.message || 'Failed to fetch rentals');
    }
  },

  /**
   * Get rental by ID
   */
  async getRentalById(id: string, user: User | null = null): Promise<Rental | null> {
    try {
      const docRef = doc(db, 'rentals', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const rental = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          availableFrom: data.availableFrom?.toDate(),
        } as Rental;

        // Non-admins can only see approved rentals or their own
        if (!isAdmin(user) && !rental.approved && rental.ownerId !== user?.uid) {
          return null;
        }

        return rental;
      }

      return null;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getRentalById failed:', error);
      throw new Error(error.message || 'Failed to fetch rental');
    }
  },

  /**
   * Create a new rental
   * Ownership: Sets ownerId from current user
   */
  async createRental(
    rental: Omit<Rental, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    user: User | null
  ): Promise<string> {
    try {
      requireAuth(user);

      const ownerId = user!.uid;
      if (!ownerId || typeof ownerId !== 'string') {
        throw new Error('Invalid user ID');
      }

      const docRef = await addDoc(collection(db, 'rentals'), {
        ...rental,
        ownerId, // Must equal request.auth.uid
        approved: false, // New rentals require admin approval
        createdAt: serverTimestamp(), // Timestamp required
        updatedAt: serverTimestamp(),
      });

      if (__DEV__) {
        console.log('[RentalService] ✅ Rental created', {
          rentalId: docRef.id,
          ownerId,
        });
      }

      return docRef.id;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: createRental failed:', error);
      throw new Error(error.message || 'Failed to create rental');
    }
  },

  /**
   * Update a rental
   * Ownership: Only owner or admin can update
   */
  async updateRental(id: string, updates: Partial<Rental>, user: User | null): Promise<void> {
    try {
      requireAuth(user);

      const propertyDoc = await getDoc(doc(db, 'rentals', id));
      if (!propertyDoc.exists()) {
        throw new Error('Rental not found');
      }

      const rental = propertyDoc.data() as Rental;
      if (!isAdmin(user) && rental.ownerId !== user?.uid) {
        throw new Error('Access denied. You do not have permission to update this rental.');
      }

      // Prevent changing ownerId or approved status (unless admin)
      const safeUpdates: any = { ...updates };
      safeUpdates.ownerId = rental.ownerId;

      if (!isAdmin(user)) {
        safeUpdates.approved = rental.approved;
      }

      safeUpdates.updatedAt = serverTimestamp();

      await updateDoc(doc(db, 'rentals', id), safeUpdates);
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: updateRental failed:', error);
      throw new Error(error.message || 'Failed to update rental');
    }
  },

  /**
   * Delete a rental
   * Ownership: Only owner or admin can delete
   */
  async deleteRental(id: string, user: User | null): Promise<void> {
    try {
      requireAuth(user);

      const rentalDoc = await getDoc(doc(db, 'rentals', id));
      if (!rentalDoc.exists()) {
        throw new Error('Rental not found');
      }

      const rental = rentalDoc.data() as Rental;
      if (!isAdmin(user) && rental.ownerId !== user?.uid) {
        throw new Error('Access denied. You do not have permission to delete this rental.');
      }

      await deleteDoc(doc(db, 'rentals', id));
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: deleteRental failed:', error);
      throw new Error(error.message || 'Failed to delete rental');
    }
  },

  /**
   * Get rentals by owner ID
   * Ownership: Users can only see their own rentals (or admin can see any)
   */
  async getRentalsByOwner(ownerId: string, user: User | null): Promise<Rental[]> {
    try {
      if (!isAdmin(user) && user?.uid !== ownerId) {
        throw new Error('Access denied. You can only view your own rentals.');
      }

      const q = query(
        collection(db, 'rentals'),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const rentals: Rental[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        rentals.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          availableFrom: data.availableFrom?.toDate(),
        } as Rental);
      });

      return rentals;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getRentalsByOwner failed:', error);
      throw new Error(error.message || 'Failed to fetch rentals');
    }
  },
};
