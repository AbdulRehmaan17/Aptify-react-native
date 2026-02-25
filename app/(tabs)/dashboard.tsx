import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { UserRole, Property } from '../../src/types';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { propertyService } from '../../src/services/propertyService';

type NavigationItem = {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  roles?: UserRole[];
};

const navigationItems: NavigationItem[] = [
  {
    id: 'browse-properties',
    title: 'Browse Properties',
    icon: 'search',
    route: '/(tabs)/listings',
    roles: ['Buyer', 'Owner', 'Constructor', 'Renovator'],
  },
  {
    id: 'list-property',
    title: 'List Property',
    icon: 'add-home',
    route: '/property/create',
    roles: ['Owner'],
  },
  {
    id: 'services',
    title: 'Services',
    icon: 'build',
    route: '/services/providers',
    roles: ['Buyer', 'Owner', 'Constructor', 'Renovator'],
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: 'message',
    route: '/(tabs)/messages',
    roles: ['Buyer', 'Owner', 'Constructor', 'Renovator'],
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: 'person',
    route: '/(tabs)/profile',
    roles: ['Buyer', 'Owner', 'Constructor', 'Renovator'],
  },
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    icon: 'admin-panel-settings',
    route: '/admin/dashboard',
    roles: ['Admin'],
  },
];

const getRoleColor = (role?: UserRole): string => {
  switch (role) {
    case 'Buyer':
      return colors.success;
    case 'Owner':
      return colors.primary;
    case 'Constructor':
      return colors.warning;
    case 'Renovator':
      return '#AF52DE'; // Purple
    case 'Admin':
      return colors.error;
    default:
      return colors.textSecondary;
  }
};

const getRoleIcon = (role?: UserRole): keyof typeof MaterialIcons.glyphMap => {
  switch (role) {
    case 'Buyer':
      return 'shopping-cart';
    case 'Owner':
      return 'home';
    case 'Constructor':
      return 'construction';
    case 'Renovator':
      return 'handyman';
    case 'Admin':
      return 'admin-panel-settings';
    default:
      return 'person';
  }
};

export default function DashboardScreen() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // CRITICAL: Guest users should NEVER see dashboard - redirect to guest home
  React.useEffect(() => {
    if (!authLoading && (isGuest || !user)) {
      router.replace('/(guest)/home');
    }
  }, [authLoading, isGuest, user, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Don't render dashboard for guests
  if (isGuest || !user) {
    return null;
  }

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myPropertiesCount, setMyPropertiesCount] = useState(0);

  // Load user's property count
  useEffect(() => {
    if (user && user.role === 'Owner') {
      loadMyPropertiesCount();
    }
  }, [user]);

  const loadMyPropertiesCount = async () => {
    if (!user) return;
    try {
      const properties = await propertyService.getPropertiesByOwner(user.uid, user);
      setMyPropertiesCount(properties.length);
    } catch (error: any) {
      if (__DEV__) {
        console.error('🔥 FIRESTORE ERROR: Failed to load properties count:', error);
      }
      // Gracefully handle error - show 0 instead of crashing
      setMyPropertiesCount(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.role === 'Owner') {
      await loadMyPropertiesCount();
    }
    setRefreshing(false);
  };

  // Filter navigation items based on user role
  const userRole = user?.role;
  const availableItems = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(userRole as UserRole)
  );

  const handleNavigation = (route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xl + insets.bottom + 72 } // Tab bar height (64) + safe area + extra spacing
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeContent}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              {user?.role
                ? `Manage your ${user.role.toLowerCase()} activities`
                : 'Get started with your property journey'}
            </Text>
          </View>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          {/* Listings Card */}
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
            onPress={() => router.push('/(tabs)/properties')}
            activeOpacity={0.7}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialIcons name="home" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>
              {user?.role === 'Owner' ? myPropertiesCount : '—'}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Listings</Text>
          </TouchableOpacity>

          {/* Bookings Card */}
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
            onPress={() => router.push('/(tabs)/messages')}
            activeOpacity={0.7}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${colors.success}15` }]}>
              <MaterialIcons name="event" size={24} color={colors.success} />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>—</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bookings</Text>
          </TouchableOpacity>

          {/* Profile Card */}
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${colors.warning}15` }]}>
              <MaterialIcons name="person" size={24} color={colors.warning} />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>
              {user?.role ? '1' : '—'}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {/* Properties */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/(tabs)/properties')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="search" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Properties</Text>
            </TouchableOpacity>

            {/* Services */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/(tabs)/services')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="build" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Services</Text>
            </TouchableOpacity>

            {/* Messages */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/(tabs)/messages')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="message" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Messages</Text>
            </TouchableOpacity>

            {/* Profile */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="person" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Profile</Text>
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="notifications" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Notifications</Text>
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="settings" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>

            {/* Saved Properties */}
            <TouchableOpacity
              style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
              onPress={() => router.push('/property/my-listings')}
              activeOpacity={0.7}>
              <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="favorite" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: colors.text }]}>My Listings</Text>
            </TouchableOpacity>

            {/* Additional Role-Based Actions */}
            {user?.role === 'Owner' && (
              <TouchableOpacity
                style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
                onPress={() => router.push('/property/create')}
                activeOpacity={0.7}>
                <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <MaterialIcons name="add-home" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.quickAccessTitle, { color: colors.text }]}>List Property</Text>
              </TouchableOpacity>
            )}

            {user?.role === 'Admin' && (
              <TouchableOpacity
                style={[styles.quickAccessCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}
                onPress={() => router.push('/admin/dashboard')}
                activeOpacity={0.7}>
                <View style={[styles.quickAccessIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <MaterialIcons name="admin-panel-settings" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.quickAccessTitle, { color: colors.text }]}>Admin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    // paddingBottom set dynamically with safe area insets
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    opacity: 0.7,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h3,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text on avatar
  },
  summarySection: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.base,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryNumber: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    opacity: 0.7,
  },
  quickAccessSection: {
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: spacing.base,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  quickAccessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickAccessTitle: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
