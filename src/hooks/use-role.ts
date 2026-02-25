import { useAuth } from '../context/AuthContext';
import { hasRole, isAdmin } from '../utils/accessControl';
import { UserRole } from '../types';

/**
 * Hook for role-based access control
 * Provides convenient role checking functions
 */
export function useRole() {
  const { user } = useAuth();

  return {
    user,
    isAdmin: isAdmin(user),
    hasRole: (roles: UserRole | UserRole[]) => hasRole(user, roles),
    isAuthenticated: !!user,
  };
}
