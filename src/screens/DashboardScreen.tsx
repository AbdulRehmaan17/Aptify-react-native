import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestore.service';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { User } from '../types';

export default function DashboardScreen() {
  const { user, firebaseUser, logout, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    totalProperties: 0,
    activeRequests: 0,
    messages: 0,
    notifications: 0,
  });

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    if (!user?.uid) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Fetch fresh user data from Firestore using centralized service
      const userDoc = await firestoreService.getDoc<User>('users', user.uid);

      if (userDoc) {
        const fetchedUser: User = {
          uid: user.uid,
          email: userDoc.email || user.email || '',
          displayName: userDoc.name || (userDoc as any).displayName || user.displayName || '',
          photoURL: userDoc.photoURL || user.photoURL,
          phoneNumber: userDoc.phoneNumber || user.phoneNumber,
          role: userDoc.role || user.role || 'user',
          provider: userDoc.provider || user.provider || 'email',
          createdAt: (userDoc as any).createdAt || user.createdAt,
          updatedAt: (userDoc as any).updatedAt || user.updatedAt,
        };
        setUserData(fetchedUser);
      } else {
        setUserData(user);
      }

      // Load summary statistics
      await loadSummaryStats();
    } catch (err: any) {
      if (__DEV__) {
        console.error('[DashboardScreen] Error loading data:', err);
      }
      setError(err.message || 'Failed to load dashboard data');
      // Still set user data if available from context
      if (user) {
        setUserData(user);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryStats = async () => {
    try {
      // Placeholder for summary stats
      // In a real app, you would fetch actual counts from Firestore
      setSummaryStats({
        totalProperties: 0,
        activeRequests: 0,
        messages: 0,
        notifications: 0,
      });
    } catch (err: any) {
      if (__DEV__) {
        console.error('[DashboardScreen] Error loading stats:', err);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Loading dashboard...
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!user || !userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text variant="body" style={[styles.errorText, { color: colors.text }]}>
              {error || 'User not authenticated'}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleLogout}
            >
              <MaterialIcons name="exit-to-app" size={20} color="#fff" />
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
      {/* Error Banner */}
      {error && (
        <Card style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
          <View style={styles.errorBannerContent}>
            <MaterialIcons name="error-outline" size={20} color={colors.error} />
            <Text variant="body" style={[styles.errorBannerText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        </Card>
      )}

      {/* User Info Card */}
      <Card style={{ backgroundColor: colors.card }}>
        <View style={styles.userHeader}>
          {userData.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
              <MaterialIcons name="person" size={32} color="#fff" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text variant="title" style={[styles.userName, { color: colors.text }]}>
              {userData.displayName || 'User'}
            </Text>
            <Text variant="muted" style={styles.userEmail}>
              {userData.email}
            </Text>
            {userData.role && (
              <View style={[styles.userRole, { backgroundColor: colors.tint + '20' }]}>
                <Text variant="body" style={[styles.userRoleText, { color: colors.tint }]}>
                  {userData.role}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="exit-to-app" size={20} color={colors.error} />
          <Text variant="body" style={[styles.logoutButtonText, { color: colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Summary Cards */}
      <View style={styles.section}>
        <Text variant="title" style={[styles.sectionTitle, { color: colors.text }]}>
          Overview
        </Text>
        <View style={styles.summaryRow}>
          <Card style={{ backgroundColor: colors.card, flex: 1 }}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.tint + '20' }]}>
              <MaterialIcons name="home" size={24} color={colors.tint} />
            </View>
            <Text variant="title" style={[styles.summaryValue, { color: colors.text }]}>
              {summaryStats.totalProperties}
            </Text>
            <Text variant="muted" style={styles.summaryLabel}>
              Properties
            </Text>
          </Card>

          <Card style={{ backgroundColor: colors.card, flex: 1 }}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FF9500' + '20' }]}>
              <MaterialIcons name="assignment" size={24} color="#FF9500" />
            </View>
            <Text variant="title" style={[styles.summaryValue, { color: colors.text }]}>
              {summaryStats.activeRequests}
            </Text>
            <Text variant="muted" style={styles.summaryLabel}>
              Requests
            </Text>
          </Card>
        </View>

        <View style={styles.summaryRow}>
          <Card style={{ backgroundColor: colors.card, flex: 1 }}>
            <View style={[styles.summaryIcon, { backgroundColor: '#34C759' + '20' }]}>
              <MaterialIcons name="message" size={24} color="#34C759" />
            </View>
            <Text variant="title" style={[styles.summaryValue, { color: colors.text }]}>
              {summaryStats.messages}
            </Text>
            <Text variant="muted" style={styles.summaryLabel}>
              Messages
            </Text>
          </Card>

          <Card style={{ backgroundColor: colors.card, flex: 1 }}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FF3B30' + '20' }]}>
              <MaterialIcons name="notifications" size={24} color="#FF3B30" />
            </View>
            <Text variant="title" style={[styles.summaryValue, { color: colors.text }]}>
              {summaryStats.notifications}
            </Text>
            <Text variant="muted" style={styles.summaryLabel}>
              Alerts
            </Text>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text variant="title" style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsList}>
          <Card style={{ backgroundColor: colors.card }}>
            <TouchableOpacity style={styles.actionItem}>
              <MaterialIcons name="add-circle-outline" size={24} color={colors.tint} />
              <View style={styles.actionContent}>
                <Text variant="body" style={[styles.actionTitle, { color: colors.text }]}>
                  Add Property
                </Text>
                <Text variant="muted" style={styles.actionSubtitle}>
                  List a new property
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          </Card>

          <Card style={{ backgroundColor: colors.card }}>
            <TouchableOpacity style={styles.actionItem}>
              <MaterialIcons name="support-agent" size={24} color={colors.tint} />
              <View style={styles.actionContent}>
                <Text variant="body" style={[styles.actionTitle, { color: colors.text }]}>
                  Request Service
                </Text>
                <Text variant="muted" style={styles.actionSubtitle}>
                  Get help with your property
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          </Card>
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
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBanner: {
    marginBottom: 0,
  },
  errorBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    marginBottom: 4,
  },
  userRole: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  userRoleText: {
    textTransform: 'capitalize',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    fontWeight: '600',
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  summaryValue: {
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryLabel: {
    textAlign: 'center',
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  actionSubtitle: {
    // Muted text handled by variant
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontWeight: '600',
    color: '#fff',
  },
});
