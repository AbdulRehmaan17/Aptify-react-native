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
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ServiceProvider, ServiceRequest, ServiceRequestStatus, ServiceType, User } from '../types';
import {
  canAccessServiceRequest,
  canManageServiceRequest,
  isAdmin,
  requireAuth,
  requireRole
} from '../utils/accessControl';
import { isFirestoreIndexError } from '../utils/firestoreSafe';
import { notificationService } from './notificationService';

/**
 * Service Request Service
 * Handles all service request-related operations
 */
export const serviceRequestService = {
  /**
   * Get all service providers (Constructor and Renovator roles)
   */
  async getServiceProviders(serviceType?: ServiceType, limitCount?: number): Promise<ServiceProvider[]> {
    try {
      const roles = serviceType === 'construction' ? ['Constructor'] : serviceType === 'renovation' ? ['Renovator'] : ['Constructor', 'Renovator'];

      // Fetch users with Constructor or Renovator roles
      const usersRef = collection(db, 'users');
      let q = query(usersRef);

      // Add pagination limit if provided
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      // Firestore doesn't support OR queries easily without 'in' operator which requires an index
      // We will query for all users with a role, or use 'in' if possible.
      // Better approach: Query for each role and merge, OR query all users and filter in memory (if user base is small)

      // Attempt to use 'in' operator for cleaner query. If it fails due to index, we'll fall back.
      let providers: ServiceProvider[] = [];

      try {
        // TEMPORARILY REMOVED ROLE FILTER to see all users
        // const qRoles = query(usersRef, where('role', 'in', roles));
        const qRoles = query(usersRef); // Fetch ALL users
        const snapshot = await getDocs(qRoles);

        console.log('[ServiceRequestService] 📸 getServiceProviders snapshot size:', snapshot.size);

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Relaxed check: Include if role matches OR if we just want to see everyone for debugging
          // For now, let's include everyone so we can see who is in the DB
          // if (roles.includes(data.role)) {
          providers.push({
            uid: docSnap.id,
            email: data.email || '',
            displayName: data.name || data.displayName || 'Unknown User',
            photoURL: data.photoURL,
            phoneNumber: data.phoneNumber,
            role: (data.role as 'Constructor' | 'Renovator') || 'user', // Default to user if missing
            bio: data.bio,
            specialties: data.specialties || [],
            rating: data.rating,
            totalJobs: data.totalJobs || 0,
            createdAt: data.createdAt?.toDate(),
          });
          // }
        });
      } catch (e) {
        console.warn('[ServiceRequestService] ⚠️ "in" query failed, falling back to client-side filtering', e);
        // Fallback: Fetch all users (limit to decent number) and filter
        // This is not ideal for production but works for fixing empty results due to index issues
        const qAll = query(usersRef, limit(100)); // Safety limit
        const snapshot = await getDocs(qAll);

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (roles.includes(data.role)) {
            providers.push({
              uid: docSnap.id,
              email: data.email || '',
              displayName: data.name || data.displayName,
              photoURL: data.photoURL,
              phoneNumber: data.phoneNumber,
              role: data.role as 'Constructor' | 'Renovator',
              bio: data.bio,
              specialties: data.specialties || [],
              rating: data.rating,
              totalJobs: data.totalJobs || 0,
              createdAt: data.createdAt?.toDate(),
            });
          }
        });
      }

      if (__DEV__) {
        console.log('[ServiceRequestService] ✅ getServiceProviders result', {
          total: providers.length,
          roles: roles,
        });
      }

      return providers;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getServiceProviders. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getServiceProviders failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error('Setting things up… This may take a moment.');
    }
  },

  /**
   * Get service provider by ID
   */
  async getServiceProvider(providerId: string): Promise<ServiceProvider | null> {
    try {
      const docRef = doc(db, 'users', providerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role;

        if (role === 'Constructor' || role === 'Renovator') {
          // Map Firestore 'name' to mobile 'displayName' (same as web app)
          return {
            uid: docSnap.id,
            email: data.email || '',
            displayName: data.name || data.displayName,
            photoURL: data.photoURL,
            phoneNumber: data.phoneNumber,
            role: role as 'Constructor' | 'Renovator',
            bio: data.bio,
            specialties: data.specialties || [],
            rating: data.rating,
            totalJobs: data.totalJobs || 0,
            createdAt: data.createdAt?.toDate(),
          };
        }
      }

      return null;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getServiceProvider. Returning null.', {
          code: error?.code,
          message: error?.message,
        });
        return null;
      }

      console.warn('🔥 FIRESTORE WARNING: getServiceProvider failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch service provider');
    }
  },

  /**
   * Create a service request
   * Ownership: Sets requesterId from current user
   */
  async createServiceRequest(
    request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'requesterId'>,
    user: User
  ): Promise<string> {
    try {
      requireAuth(user);

      const docRef = await addDoc(collection(db, 'serviceRequests'), {
        ...request,
        requesterId: user.uid, // Ensure requesterId is set from authenticated user
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create notification for provider
      try {
        await notificationService.createNotification(
          request.providerId,
          'New Service Request',
          `You have a new ${request.serviceType} service request`,
          'service',
          { requestId: docRef.id, requesterId: user.uid }
        );
      } catch (error) {
        // Don't throw error for notification failures
        console.warn('Failed to create notification for new service request:', error);
      }

      return docRef.id;
    } catch (error: any) {
      console.warn('🔥 FIRESTORE WARNING: createServiceRequest failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to create service request');
    }
  },

  /**
   * Get service requests by requester ID
   * Ownership: Users can only see their own requests (or admin can see any)
   */
  async getRequestsByRequester(requesterId: string, user: User | null = null): Promise<ServiceRequest[]> {
    try {
      // Users can only query their own requests (unless admin)
      // Check if user is defined before accessing uid
      const currentUser = user || null;
      if (!isAdmin(currentUser) && currentUser?.uid !== requesterId) {
        throw new Error('Access denied. You can only view your own service requests.');
      }

      const q = query(
        collection(db, 'serviceRequests'),
        where('requesterId', '==', requesterId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests: ServiceRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requests.push({
          id: docSnap.id,
          ...data,
          preferredDate: data.preferredDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ServiceRequest);
      });

      return requests;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getRequestsByRequester. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getRequestsByRequester failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch service requests');
    }
  },

  /**
   * Get service requests by provider ID
   * Ownership: Providers can only see requests sent to them (or admin can see any)
   */
  async getRequestsByProvider(providerId: string, user: User | null): Promise<ServiceRequest[]> {
    try {
      // Users can only query requests sent to them (unless admin)
      if (!isAdmin(user) && user?.uid !== providerId) {
        throw new Error('Access denied. You can only view service requests sent to you.');
      }

      const q = query(
        collection(db, 'serviceRequests'),
        where('providerId', '==', providerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests: ServiceRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requests.push({
          id: docSnap.id,
          ...data,
          preferredDate: data.preferredDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ServiceRequest);
      });

      return requests;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getRequestsByProvider. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getRequestsByProvider failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch service requests');
    }
  },

  /**
   * Get service requests by property ID (for Owners)
   * Ownership: Only property owner or admin can view requests for a property
   */
  async getRequestsByProperty(propertyId: string, user: User | null, propertyOwnerId?: string): Promise<ServiceRequest[]> {
    try {
      // Verify user owns the property (unless admin)
      if (!isAdmin(user)) {
        if (!user || user.uid !== propertyOwnerId) {
          throw new Error('Access denied. You can only view service requests for your own properties.');
        }
      }

      const q = query(
        collection(db, 'serviceRequests'),
        where('propertyId', '==', propertyId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests: ServiceRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requests.push({
          id: docSnap.id,
          ...data,
          preferredDate: data.preferredDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ServiceRequest);
      });

      return requests;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getRequestsByProperty. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getRequestsByProperty failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch service requests');
    }
  },

  /**
   * Get all service requests (for Admins)
   * Role-based access: Only admins can view all requests
   */
  async getAllRequests(user: User): Promise<ServiceRequest[]> {
    try {
      requireRole(user, 'Admin');

      const q = query(
        collection(db, 'serviceRequests'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests: ServiceRequest[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requests.push({
          id: docSnap.id,
          ...data,
          preferredDate: data.preferredDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ServiceRequest);
      });

      return requests;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getAllRequests. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getAllRequests failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch service requests');
    }
  },

  /**
   * Update service request status
   * Ownership: Only provider (who can manage) or admin can update status
   */
  async updateRequestStatus(requestId: string, status: ServiceRequestStatus, user: User): Promise<void> {
    try {
      requireAuth(user);

      // Get request to check ownership
      const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Service request not found');
      }

      const request = requestDoc.data() as ServiceRequest;
      if (!canManageServiceRequest(user, request)) {
        throw new Error('Access denied. You do not have permission to update this service request.');
      }

      // Security rules require: requesterId and providerId cannot change
      const docRef = doc(db, 'serviceRequests', requestId);
      await updateDoc(docRef, {
        status,
        requesterId: request.requesterId, // Preserve requesterId (security rule requirement)
        providerId: request.providerId, // Preserve providerId (security rule requirement)
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.warn('🔥 FIRESTORE WARNING: updateRequestStatus failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to update service request');
    }
  },

  /**
   * Get service request by ID
   * Ownership: Only requester, provider, property owner, or admin can view
   */
  async getRequestById(requestId: string, user: User | null, propertyOwnerId?: string): Promise<ServiceRequest | null> {
    try {
      const docRef = doc(db, 'serviceRequests', requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const request = {
          id: docSnap.id,
          ...data,
          preferredDate: data.preferredDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ServiceRequest;

        // Check if user has access to this request
        if (!canAccessServiceRequest(user, request, propertyOwnerId)) {
          return null; // Return null instead of throwing to allow graceful handling
        }

        return request;
      }

      return null;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ServiceRequestService] ⚠️ Missing Firestore index for getRequestById. Returning null.', {
          code: error?.code,
          message: error?.message,
        });
        return null;
      }

      console.warn('🔥 FIRESTORE WARNING: getRequestById failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch service request');
    }
  },

  /**
   * Subscribe to service requests by requester (real-time updates)
   * Ownership: Users can only subscribe to their own requests (or admin can see any)
   */
  subscribeToRequestsByRequester(
    requesterId: string,
    user: User | null,
    callback: (requests: ServiceRequest[]) => void
  ): () => void {
    if (!isAdmin(user) && user?.uid !== requesterId) {
      console.warn('Access denied. Users can only subscribe to their own service requests.');
      return () => { };
    }

    const q = query(
      collection(db, 'serviceRequests'),
      where('requesterId', '==', requesterId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: ServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          requests.push({
            id: docSnap.id,
            ...data,
            preferredDate: data.preferredDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ServiceRequest);
        });
        callback(requests);
      },
      (error) => {
        if (isFirestoreIndexError(error)) {
          console.warn('[ServiceRequestService] ⚠️ Missing Firestore index in subscribeToRequestsByRequester. Returning empty list.', {
            code: error?.code,
            message: error?.message,
          });
          callback([]);
          return;
        }

        console.warn('🔥 FIRESTORE WARNING: Service requests subscription failed:', {
          code: error?.code,
          message: error?.message,
        });
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to service requests by provider (real-time updates)
   * Ownership: Providers can only subscribe to requests sent to them (or admin can see any)
   */
  subscribeToRequestsByProvider(
    providerId: string,
    user: User | null,
    callback: (requests: ServiceRequest[]) => void
  ): () => void {
    if (!isAdmin(user) && user?.uid !== providerId) {
      console.warn('Access denied. Users can only subscribe to service requests sent to them.');
      return () => { };
    }

    const q = query(
      collection(db, 'serviceRequests'),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: ServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          requests.push({
            id: docSnap.id,
            ...data,
            preferredDate: data.preferredDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ServiceRequest);
        });
        callback(requests);
      },
      (error) => {
        if (isFirestoreIndexError(error)) {
          console.warn('[ServiceRequestService] ⚠️ Missing Firestore index in subscribeToRequestsByProvider. Returning empty list.', {
            code: error?.code,
            message: error?.message,
          });
          callback([]);
          return;
        }

        console.warn('🔥 FIRESTORE WARNING: Provider requests subscription failed:', {
          code: error?.code,
          message: error?.message,
        });
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to a single service request (real-time updates)
   */
  subscribeToRequest(
    requestId: string,
    user: User | null,
    propertyOwnerId: string | undefined,
    callback: (request: ServiceRequest | null) => void
  ): () => void {
    const docRef = doc(db, 'serviceRequests', requestId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const request = {
            id: docSnap.id,
            ...data,
            preferredDate: data.preferredDate?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ServiceRequest;

          // Check if user has access to this request
          if (!canAccessServiceRequest(user, request, propertyOwnerId)) {
            callback(null);
            return;
          }

          callback(request);
        } else {
          callback(null);
        }
      },
      (error) => {
        if (isFirestoreIndexError(error)) {
          console.warn('[ServiceRequestService] ⚠️ Missing Firestore index in subscribeToRequest. Returning null.', {
            code: error?.code,
            message: error?.message,
          });
          callback(null);
          return;
        }

        console.warn('🔥 FIRESTORE WARNING: Service request subscription failed:', {
          code: error?.code,
          message: error?.message,
        });
        callback(null);
      }
    );

    return unsubscribe;
  },

  /**
   * Delete a service request
   * Ownership: Only requester or admin can delete
   */
  async deleteRequest(requestId: string, user: User): Promise<void> {
    try {
      requireAuth(user);

      // Get request to check ownership
      const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Service request not found');
      }

      const request = requestDoc.data() as ServiceRequest;

      // Only requester or admin can delete
      if (!isAdmin(user) && request.requesterId !== user.uid) {
        throw new Error('Access denied. You can only delete your own service requests.');
      }

      const docRef = doc(db, 'serviceRequests', requestId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.warn('🔥 FIRESTORE WARNING: deleteRequest failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to delete service request');
    }
  },

  /**
   * Update service request (full update)
   * Ownership: Only requester can update details (provider can only update status)
   */
  async updateRequest(
    requestId: string,
    updates: Partial<Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>>,
    user: User
  ): Promise<void> {
    try {
      requireAuth(user);

      // Get request to check ownership
      const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Service request not found');
      }

      const request = requestDoc.data() as ServiceRequest;

      // Only requester can update full details, provider can only update status
      if (!isAdmin(user) && request.requesterId !== user.uid && request.providerId !== user.uid) {
        throw new Error('Access denied. You do not have permission to update this service request.');
      }

      // Providers can only update status
      // Security rules require: requesterId and providerId cannot change
      if (!isAdmin(user) && request.providerId === user.uid) {
        const allowedUpdates = { status: updates.status };
        if (Object.keys(allowedUpdates).length === 0 || !allowedUpdates.status) {
          throw new Error('Providers can only update the status of service requests.');
        }
        const docRef = doc(db, 'serviceRequests', requestId);
        await updateDoc(docRef, {
          status: updates.status,
          requesterId: request.requesterId, // Preserve requesterId (security rule requirement)
          providerId: request.providerId, // Preserve providerId (security rule requirement)
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // Requester or admin can update any field
      // Security rules require: requesterId and providerId cannot change
      const safeUpdates: any = { ...updates };
      safeUpdates.requesterId = request.requesterId; // Preserve requesterId (security rule requirement)
      safeUpdates.providerId = request.providerId; // Preserve providerId (security rule requirement)

      const docRef = doc(db, 'serviceRequests', requestId);
      await updateDoc(docRef, {
        ...safeUpdates,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.warn('🔥 FIRESTORE WARNING: updateRequest failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to update service request');
    }
  },
};


