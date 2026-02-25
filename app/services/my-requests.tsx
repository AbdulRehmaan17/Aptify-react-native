import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { serviceRequestService } from '../../src/services/serviceRequestService';
import { ServiceRequest } from '../../src/types';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { EmptyState } from '../../src/components/EmptyState';

export default function MyServiceRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Screen fade-in animation
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const screenSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (user) {
      loadRequests();
    }
    
    // Screen entrance animation
    Animated.parallel([
      Animated.timing(screenFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(screenSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await serviceRequestService.getRequestsByRequester(user.uid, user);
      setRequests(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading service requests:', error);
      }
      // Gracefully handle permission errors
      if (error.message?.includes('permission') || error.message?.includes('Access denied')) {
        Alert.alert('Access Denied', 'You do not have permission to view these requests.');
      } else {
        Alert.alert('Error', error.message || 'Failed to load service requests. Please try again.');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getStatusColor = (status: ServiceRequest['status']): string => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.muted;
      default:
        return colors.muted;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <EmptyState
            icon="lock"
            title="Login Required"
            message="Please login to view your service requests"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: screenFadeAnim,
            transform: [{ translateY: screenSlideAnim }],
          },
        ]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>My Service Requests</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon="build"
                  title="No service requests"
                  message="You haven't made any service requests yet"
                  actionLabel="Browse Services"
                  onAction={() => router.push('/(tabs)/services')}
                />
              </View>
            ) : (
              <View style={styles.requestsList}>
                {requests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.requestCard}
                    onPress={() => router.push(`/services/${request.providerId}`)}
                    activeOpacity={0.7}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestTitle} numberOfLines={1}>
                          {request.title}
                        </Text>
                        <Text style={styles.requestType}>
                          {request.serviceType.charAt(0).toUpperCase() + request.serviceType.slice(1)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}15` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.requestDescription} numberOfLines={2}>
                      {request.description}
                    </Text>
                    <View style={styles.requestFooter}>
                      <View style={styles.locationRow}>
                        <MaterialIcons name="location-on" size={16} color={colors.muted} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {request.location.city}, {request.location.state}
                        </Text>
                      </View>
                      {request.budget && (
                        <Text style={styles.budgetText}>
                          ${request.budget.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg * 3,
  },
  content: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    marginTop: spacing.md,
  },
  requestsList: {
    gap: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  requestTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  requestType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
  },
  requestDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  budgetText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
