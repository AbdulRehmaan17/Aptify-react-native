import { User, UserRole } from '../types';
import { hasRole, isAdmin, requireAuth, requireRole } from './accessControl';

/**
 * Navigation Guards
 * Utilities for protecting navigation routes and actions
 */

/**
 * Check if user can navigate to a route
 */
export function canNavigateToRoute(user: User | null, requiredRole?: UserRole | UserRole[], requireAuth = true): boolean {
  if (requireAuth && !user) {
    return false;
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return false;
  }

  return true;
}

/**
 * Check if user can access admin routes
 */
export function canAccessAdminRoutes(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Guard function for admin-only actions
 * Throws error if user is not admin
 */
export function requireAdmin(user: User | null): void {
  requireAuth(user);
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
}

/**
 * Guard function for specific role actions
 * Throws error if user doesn't have required role
 */
export function requireRoleAccess(user: User | null, roles: UserRole | UserRole[]): void {
  requireAuth(user);
  requireRole(user, roles);
}
