/**
 * useAuthUser Hook
 * Convenience hook for accessing authenticated user
 * Only use this inside React components
 */
import { useAuth } from '../context/AuthContext';

export const useAuthUser = () => {
  const { user, isAuthenticated, isGuest } = useAuth();
  
  return {
    user,
    isAuthenticated,
    isGuest,
    userId: user?.uid || null,
  };
};
