import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { hasRole, isAdmin } from '../utils/accessControl';
import { UserRole } from '../types';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/ui';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireAuth?: boolean;
  adminOnly?: boolean;
}

/**
 * RouteGuard Component
 * Protects routes based on authentication and role requirements
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  requireAuth = false, // Default to false - don't block by default
  adminOnly = false,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // Only redirect if explicitly required (opt-in protection)
    // Don't block by default - allow guest access
    if (requireAuth && !isAuthenticated) {
      if (__DEV__) {
        console.log('[RouteGuard] ⚠️ Authentication required for this route');
      }
      // Show message instead of redirecting - let user choose to login
      return;
    }

    // Check admin-only requirement
    if (adminOnly && !isAdmin(user)) {
      if (__DEV__) {
        console.log('[RouteGuard] ❌ Admin access denied for user:', user?.email);
      }
      router.back();
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(user, requiredRole)) {
      if (__DEV__) {
        const roles = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
        console.log('[RouteGuard] ❌ Role access denied. Required:', roles, 'User role:', user?.role);
      }
      router.back();
      return;
    }
  }, [user, loading, isAuthenticated, requireAuth, adminOnly, requiredRole, router]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // Check authentication - show message but don't block (allow guest to see content)
  if (requireAuth && !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialIcons name="lock-outline" size={64} color={colors.icon} />
        <Text style={[styles.title, { color: colors.text }]}>Authentication Required</Text>
        <Text style={[styles.message, { color: colors.icon }]}>
          Please sign in to access this feature
        </Text>
        {/* Allow guest to see children with limited functionality */}
        {children}
      </View>
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin(user)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialIcons name="admin-panel-settings" size={64} color={colors.error} />
        <Text style={[styles.title, { color: colors.text }]}>Access Denied</Text>
        <Text style={[styles.message, { color: colors.icon }]}>Admin access required</Text>
      </View>
    );
  }

  // Check role requirement
  if (requiredRole && !hasRole(user, requiredRole)) {
    const roles = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialIcons name="block" size={64} color={colors.error} />
        <Text style={[styles.title, { color: colors.text }]}>Access Denied</Text>
        <Text style={[styles.message, { color: colors.icon }]}>
          This page requires {roles} role
        </Text>
      </View>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
