import { User, UserRole } from '../types';

/**
 * Access Control Utilities
 * Provides role-based access and ownership verification functions
 */

/**
 * Check if user has a specific role
 * Case-insensitive comparison for role matching
 */
export function hasRole(user: User | null, roles: UserRole | UserRole[]): boolean {
  if (!user || !user.role) return false;
  const userRole = user.role.toLowerCase();
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.some(role => role.toLowerCase() === userRole);
}

/**
 * Check if user is an admin
 * Supports both 'Admin' and 'admin' role values for compatibility
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'admin';
}

/**
 * Check if user is an owner
 */
export function isOwner(user: User | null): boolean {
  return hasRole(user, 'Owner');
}

/**
 * Check if user owns a resource (by ownerId)
 */
export function ownsResource(user: User | null, ownerId: string | undefined): boolean {
  if (!user || !ownerId) return false;
  return user.uid === ownerId;
}

/**
 * Check if user is the requester of a service request
 */
export function isRequester(user: User | null, requesterId: string | undefined): boolean {
  if (!user || !requesterId) return false;
  return user.uid === requesterId;
}

/**
 * Check if user is the provider of a service request
 */
export function isProvider(user: User | null, providerId: string | undefined): boolean {
  if (!user || !providerId) return false;
  return user.uid === providerId;
}

/**
 * Check if user is a participant in a chat
 */
export function isChatParticipant(user: User | null, participants: string[] | undefined): boolean {
  if (!user || !participants) return false;
  return participants.includes(user.uid);
}

/**
 * Check if user can access a service request
 * (requester, provider, admin, or owner of related property)
 */
export function canAccessServiceRequest(
  user: User | null,
  request: { requesterId: string; providerId: string; propertyId?: string },
  propertyOwnerId?: string
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isRequester(user, request.requesterId)) return true;
  if (isProvider(user, request.providerId)) return true;
  if (request.propertyId && propertyOwnerId && ownsResource(user, propertyOwnerId)) return true;
  return false;
}

/**
 * Check if user can manage a service request
 * (provider can update status, requester can view, admin can do anything)
 */
export function canManageServiceRequest(
  user: User | null,
  request: { requesterId: string; providerId: string }
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isProvider(user, request.providerId)) return true;
  return false;
}

/**
 * Check if user can manage a property
 * (owner can manage their own, admin can manage any)
 */
export function canManageProperty(user: User | null, propertyOwnerId: string | undefined): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (ownsResource(user, propertyOwnerId)) return true;
  return false;
}

/**
 * Verify user is authenticated
 */
export function requireAuth(user: User | null): void {
  if (!user) {
    throw new Error('Authentication required');
  }
}

/**
 * Verify user has required role
 * Case-insensitive role comparison
 */
export function requireRole(user: User | null, roles: UserRole | UserRole[]): void {
  // 1. Check authentication
  if (!user) {
    throw new Error('Authentication required');
  }

  // 2. Check if user data is loaded (specifically role)
  if (!user.role) {
    // Log this case as it might indicate a data sync issue
    console.warn(`[AccessControl] ⚠️ User ${user.email} (${user.uid}) has no role assigned.`);
    throw new Error('Access denied. Your account profile is incomplete (missing role). Please contact support.');
  }

  // 3. Check role match
  if (!hasRole(user, roles)) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const currentRole = user.role;
    // We throw to prevent execution of protected logic, but UI should catch this.
    throw new Error(`Access denied. Required role: ${roleArray.join(' or ')}. Your role is: ${currentRole}`);
  }
}

/**
 * Verify user owns resource
 */
export function requireOwnership(user: User | null, ownerId: string | undefined, resourceName: string = 'resource'): void {
  requireAuth(user);
  if (!ownsResource(user, ownerId)) {
    throw new Error(`Access denied. You do not own this ${resourceName}.`);
  }
}
