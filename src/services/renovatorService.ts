import {
  collection,
  getDocs,
  limit,
  query
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Renovator, ServiceType } from '../types';

/**
 * Service Request Service
 * Handles all service request-related operations
 */
export const RenovatorService = {
  /**
   * Get all service providers (Constructor and Renovator roles)
   */
  async getRenovators(serviceType?: ServiceType, limitCount?: number): Promise<Renovator[]> {
    try {
      const renovatorsRef = collection(db, 'renovators');
      let q = query(renovatorsRef);

      // Add pagination limit if provided
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      // Firestore doesn't support OR queries easily without 'in' operator which requires an index
      // We will query for all users with a role, or use 'in' if possible.
      // Better approach: Query for each role and merge, OR query all users and filter in memory (if user base is small)

      // Attempt to use 'in' operator for cleaner query. If it fails due to index, we'll fall back.
      let renovators: Renovator[] = [];

      try {
        // TEMPORARILY REMOVED ROLE FILTER to see all users
        // const qRoles = query(usersRef, where('role', 'in', roles));
        const qRenovators = query(renovatorsRef); // Fetch ALL users
        const snapshot = await getDocs(qRenovators);

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Relaxed check: Include if role matches OR if we just want to see everyone for debugging
          // For now, let's include everyone so we can see who is in the DB
          // if (roles.includes(data.role)) {
          renovators.push({
            uid: docSnap.id,
            email: data.email || '',
            name: data.name || '',
            createdAt: data.createdAt?.toDate(),
            officeAddress: data.officeAddress || '',
          });
          // }
        });
      } catch (e) {
        console.warn('[RenovatorService] ⚠️ Error getting renovators:', e);
        return [];
      }
      return renovators;
    } catch (error: any) {
      console.warn('[RenovatorService] ⚠️ Error getting renovators:', error);
      throw new Error('Failed to get renovators');
    }
  }
};