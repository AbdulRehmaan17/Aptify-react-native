import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { serviceRequestService } from '../services/serviceRequestService';
import { ServiceRequest, ServiceRequestStatus } from '../types';
import { AppStackParamList } from '../navigation/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

type ServiceRequestListScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function ServiceRequestListScreen() {
  const { user, loading: authLoading } = useAuth();
  const navigation = useNavigation<ServiceRequestListScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      setRequests([]);
      return;
    }

    loadRequests();
  }, [user, authLoading]);

  const loadRequests = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch requests based on user role
      let userRequests: ServiceRequest[] = [];

      if (user.role === 'Buyer') {
        // Buyers: requests they made
        userRequests = await serviceRequestService.getRequestsByRequester(user.uid);
      } else if (user.role === 'Owner') {
        // Owners: requests for their properties
        // First get all their properties
        const { propertyService } = await import('../services/propertyService');
        const ownerProperties = await propertyService.getPropertiesByOwner(user.uid, user);
        const propertyIds = ownerProperties.map((p) => p.id);
        
        // Get requests for each property
        const allRequests: ServiceRequest[] = [];
        for (const propertyId of propertyIds) {
          const propertyRequests = await serviceRequestService.getRequestsByProperty(propertyId);
          allRequests.push(...propertyRequests);
        }
        
        // Remove duplicates and sort by createdAt
        const uniqueRequests = allRequests.reduce((acc, req) => {
          if (!acc.find((r) => r.id === req.id)) {
            acc.push(req);
          }
          return acc;
        }, [] as ServiceRequest[]);
        
        uniqueRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        userRequests = uniqueRequests;
      } else if (user.role === 'Constructor' || user.role === 'Renovator') {
        // Providers: requests they received
        userRequests = await serviceRequestService.getRequestsByProvider(user.uid);
      } else if (user.role === 'Admin') {
        // Admins: all requests
        userRequests = await serviceRequestService.getAllRequests();
      } else {
        // For other roles, show requests they made
        userRequests = await serviceRequestService.getRequestsByRequester(user.uid);
      }

      setRequests(userRequests);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[ServiceRequestListScreen] ❌ Error loading requests:', error);
      }
      setError(error.message || 'Failed to load service requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getStatusColor = (status: ServiceRequestStatus): string => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'completed':
        return '#0a7ea4';
      case 'cancelled':
        return '#687076';
      default:
        return '#687076';
    }
  };

  const getStatusIcon = (status: ServiceRequestStatus): string => {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'accepted':
        return 'check-circle';
      case 'rejected':
        return 'cancel';
      case 'completed':
        return 'check-circle-outline';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRequestPress = (request: ServiceRequest) => {
    // Navigate to service request detail screen
    navigation.navigate('ServiceRequestDetail', { id: request.id });
  };

  if (!user && !authLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text variant="titleMedium" style={[styles.errorText, { color: colors.text }]}>
          Please sign in to view your service requests.
        </Text>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading service requests...
        </Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color={colors.error || '#FF3B30'} />
        <Text variant="titleMedium" style={[styles.errorText, { color: colors.text }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadRequests}
          style={[styles.retryButton, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group requests by status
  const groupedRequests = {
    pending: requests.filter((r) => r.status === 'pending'),
    accepted: requests.filter((r) => r.status === 'accepted'),
    completed: requests.filter((r) => r.status === 'completed'),
    rejected: requests.filter((r) => r.status === 'rejected'),
    cancelled: requests.filter((r) => r.status === 'cancelled'),
  };

  const displayRequests = [
    ...groupedRequests.pending,
    ...groupedRequests.accepted,
    ...groupedRequests.completed,
    ...groupedRequests.rejected,
    ...groupedRequests.cancelled,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <Surface style={[styles.headerCard, { backgroundColor: colors.card }]}>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: colors.text }]}>
          My Service Requests
        </Text>
        <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </Text>
      </Surface>

      {displayRequests.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="assignment" size={64} color={colors.text} />
          <Text variant="title" style={[styles.emptyTitle, { color: colors.text }]}>
            No Service Requests
          </Text>
          <Text variant="muted" style={styles.emptySubtitle}>
            {user?.role === 'Buyer' || user?.role === 'Owner'
              ? 'You haven\'t made any service requests yet'
              : 'You haven\'t received any service requests yet'}
          </Text>
        </View>
      ) : (
        displayRequests.map((request) => (
          <TouchableOpacity
            key={request.id}
            onPress={() => handleRequestPress(request)}
            activeOpacity={0.7}
          >
            <Card style={{ backgroundColor: colors.card }}>
              {/* Header with Title and Status */}
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text variant="title" style={[styles.requestTitle, { color: colors.text }]} numberOfLines={2}>
                    {request.title}
                  </Text>
                  <Text variant="muted" style={styles.requestDate}>
                    {formatDate(request.createdAt)}
                  </Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text variant="body" style={styles.statusChipText}>
                    {request.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <Text variant="body" style={[styles.description, { color: colors.text }]} numberOfLines={2}>
                {request.description}
              </Text>

              {/* Service Type and Location */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <MaterialIcons
                    name={request.serviceType === 'construction' ? 'construction' : 'handyman'}
                    size={16}
                    color={colors.text}
                  />
                  <Text variant="muted" style={styles.detailText}>
                    {request.serviceType}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="location-on" size={16} color={colors.text} />
                  <Text variant="muted" style={styles.detailText} numberOfLines={1}>
                    {request.location.city}, {request.location.state}
                  </Text>
                </View>
              </View>

              {/* Budget and Preferred Date */}
              {(request.budget || request.preferredDate) && (
                <View style={styles.metaRow}>
                  {request.budget && (
                    <View style={styles.metaItem}>
                      <MaterialIcons name="attach-money" size={16} color={colors.text} />
                      <Text variant="muted" style={styles.metaText}>
                        Budget: {formatCurrency(request.budget)}
                      </Text>
                    </View>
                  )}
                  {request.preferredDate && (
                    <View style={styles.metaItem}>
                      <MaterialIcons name="calendar-today" size={16} color={colors.text} />
                      <Text variant="muted" style={styles.metaText}>
                        Preferred: {formatDate(request.preferredDate)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    marginTop: 4,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  requestTitle: {
    marginBottom: 4,
  },
  requestDate: {
    marginTop: 4,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    textTransform: 'capitalize',
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    // Muted text handled by variant
  },
});

