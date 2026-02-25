import { firestoreService } from './firestore.service';
import { Property } from '../types';

/**
 * Guest Service
 * Read-only service for guest users
 * Guests can ONLY view listings - no create, edit, or delete operations
 */
export const guestService = {
  /**
   * Get all approved listings (read-only)
   * Guests can only see approved and available listings
   * 
   * @param filters - Optional filters for listings
   * @returns Array of approved listings
   */
  async getListings(filters?: {
    city?: string;
    state?: string;
    propertyType?: Property['propertyType'];
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Property[]> {
    try {
      // Build query options for approved and available listings only
      const queryOptions: any = {
        where: [
          { field: 'approved', operator: '==', value: true },
          { field: 'status', operator: '==', value: 'available' },
        ],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      };

      // Add location filters if provided
      if (filters?.city) {
        queryOptions.where.push({
          field: 'location.city',
          operator: '==',
          value: filters.city,
        });
      }

      if (filters?.state) {
        queryOptions.where.push({
          field: 'location.state',
          operator: '==',
          value: filters.state,
        });
      }

      if (filters?.propertyType) {
        queryOptions.where.push({
          field: 'propertyType',
          operator: '==',
          value: filters.propertyType,
        });
      }

      // Fetch from 'properties' collection (matches web app)
      const listings = await firestoreService.getDocs<Property>('properties', queryOptions);

      // Apply price filters in memory (Firestore doesn't support range queries easily)
      let filteredListings = listings;
      if (filters?.minPrice) {
        filteredListings = filteredListings.filter((l) => l.price >= filters.minPrice!);
      }
      if (filters?.maxPrice) {
        filteredListings = filteredListings.filter((l) => l.price <= filters.maxPrice!);
      }

      // Convert Firestore Timestamps to Date objects
      return filteredListings.map((listing) => ({
        ...listing,
        createdAt: listing.createdAt instanceof Date ? listing.createdAt : new Date(listing.createdAt),
        updatedAt: listing.updatedAt instanceof Date ? listing.updatedAt : new Date(listing.updatedAt),
      }));
    } catch (error: any) {
      // If query fails (e.g., missing index), try fallback method
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        if (__DEV__) {
          console.warn('[GuestService] Firestore index missing, using fallback query');
        }
        try {
          return await this.getListingsFromProperties(filters);
        } catch (fallbackError: any) {
          throw new Error(fallbackError.message || 'Failed to fetch listings');
        }
      }
      throw new Error(error.message || 'Failed to fetch listings');
    }
  },

  /**
   * Fallback method to get listings from 'properties' collection
   * (in case 'listings' collection doesn't exist)
   */
  async getListingsFromProperties(filters?: {
    city?: string;
    state?: string;
    propertyType?: Property['propertyType'];
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Property[]> {
    const queryOptions: any = {
      where: [
        { field: 'approved', operator: '==', value: true },
        { field: 'status', operator: '==', value: 'available' },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    };

    if (filters?.city) {
      queryOptions.where.push({
        field: 'location.city',
        operator: '==',
        value: filters.city,
      });
    }

    if (filters?.state) {
      queryOptions.where.push({
        field: 'location.state',
        operator: '==',
        value: filters.state,
      });
    }

    if (filters?.propertyType) {
      queryOptions.where.push({
        field: 'propertyType',
        operator: '==',
        value: filters.propertyType,
      });
    }

    const properties = await firestoreService.getDocs<Property>('properties', queryOptions);

    let filtered = properties;
    if (filters?.minPrice) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    return filtered.map((property) => ({
      ...property,
      createdAt: property.createdAt instanceof Date ? property.createdAt : new Date(property.createdAt),
      updatedAt: property.updatedAt instanceof Date ? property.updatedAt : new Date(property.updatedAt),
    }));
  },

  /**
   * Get a single listing by ID (read-only)
   * Guests can only see approved listings
   * 
   * @param id - Listing ID
   * @returns Listing or null if not found/not approved
   */
  async getListingById(id: string): Promise<Property | null> {
    try {
      // Fetch from 'properties' collection (matches web app)
      const property = await firestoreService.getDoc<Property>('properties', id);
      
      if (!property) {
        return null;
      }

      // Only return if approved and available (guests can only see approved properties)
      if (property.approved && property.status === 'available') {
        return {
          ...property,
          createdAt: property.createdAt instanceof Date ? property.createdAt : new Date(property.createdAt),
          updatedAt: property.updatedAt instanceof Date ? property.updatedAt : new Date(property.updatedAt),
        };
      }

      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch listing');
    }
  },
};
