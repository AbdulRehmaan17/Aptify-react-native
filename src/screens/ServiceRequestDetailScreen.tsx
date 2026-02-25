import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { serviceRequestService } from '../services/serviceRequestService';
import { propertyService } from '../services/propertyService';
import { notificationService } from '../services/notificationService';
import { ServiceRequest, ServiceRequestStatus } from '../types';
import { AppStackParamList } from '../navigation/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

type ServiceRequestDetailScreenRouteProp = NativeStackScreenProps<AppStackParamList, 'ServiceRequestDetail'>['route'];
type ServiceRequestDetailScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'ServiceRequestDetail'>;

export default function ServiceRequestDetailScreen() {
  const route = useRoute<ServiceRequestDetailScreenRouteProp>();
  const navigation = useNavigation<ServiceRequestDetailScreenNavigationProp>();
  const { id } = route.params;
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Check if user can manage this request
  const canManage = user && (
    user.role === 'Admin' ||
    (user.role === 'Owner' && property && property.ownerId === user.uid) ||
    (user.role === 'Constructor' || user.role === 'Renovator') && request && request.providerId === user.uid
  );

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const requestData = await serviceRequestService.getRequestById(id);
      if (!requestData) {
        Alert.alert('Error', 'Service request not found');
        navigation.goBack();
        return;
      }
      setRequest(requestData);

      // Load property if propertyId exists
      if (requestData.propertyId) {
        try {
          const propertyData = await propertyService.getPropertyById(requestData.propertyId);
          setProperty(propertyData);
        } catch (error) {
          if (__DEV__) {
            console.error('[ServiceRequestDetailScreen] Error loading property:', error);
          }
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[ServiceRequestDetailScreen] ❌ Error loading request:', error);
      }
      Alert.alert('Error', error.message || 'Failed to load service request.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ServiceRequestStatus) => {
    if (!request) return;

    const statusMessages = {
      accepted: 'approve',
      rejected: 'reject',
      completed: 'mark as completed',
    };

    const action = statusMessages[newStatus] || 'update';
    const confirmMessage = newStatus === 'rejected'
      ? `Are you sure you want to reject this service request?`
      : newStatus === 'completed'
      ? `Mark this service request as completed?`
      : `Approve this service request?`;

    Alert.alert(
      `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setUpdating(true);
              await serviceRequestService.updateRequestStatus(request.id, newStatus);

              // Create notification for requester
              if (request.requesterId) {
                const statusMessages: Record<ServiceRequestStatus, { title: string; body: string }> = {
                  accepted: {
                    title: 'Service Request Approved',
                    body: `Your service request "${request.title}" has been approved.`,
                  },
                  rejected: {
                    title: 'Service Request Rejected',
                    body: `Your service request "${request.title}" has been rejected.`,
                  },
                  completed: {
                    title: 'Service Request Completed',
                    body: `Your service request "${request.title}" has been marked as completed.`,
                  },
                  pending: {
                    title: 'Service Request Updated',
                    body: `Your service request "${request.title}" status has been updated.`,
                  },
                  cancelled: {
                    title: 'Service Request Cancelled',
                    body: `Your service request "${request.title}" has been cancelled.`,
                  },
                };

                const notification = statusMessages[newStatus];
                if (notification) {
                  try {
                    await notificationService.createNotification(
                      request.requesterId,
                      notification.title,
                      notification.body,
                      'service',
                      { requestId: request.id }
                    );
                  } catch (error) {
                    // Don't throw error for notification failures
                    console.error('Failed to create notification for status update:', error);
                  }
                }
              }

              // Reload request to get updated status
              await loadRequest();

              Alert.alert('Success', `Service request ${action}ed successfully.`);
            } catch (error: any) {
              if (__DEV__) {
                console.error('[ServiceRequestDetailScreen] ❌ Error updating status:', error);
              }
              Alert.alert('Error', error.message || `Failed to ${action} service request.`);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
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

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Loading service request...
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text variant="title" style={[styles.errorText, { color: colors.text }]}>
              Service request not found
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: colors.tint }]}
            >
              <Text variant="body" style={styles.backButtonText}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const showApproveButton = canManage && request.status === 'pending';
  const showRejectButton = canManage && (request.status === 'pending' || request.status === 'accepted');
  const showCompleteButton = canManage && request.status === 'accepted';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Title */}
        <Text variant="title" style={[styles.title, { color: colors.text }]}>
          Service Request
        </Text>
        {/* Status Badge */}
        <Surface style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <Chip
              icon={() => (
                <MaterialIcons
                  name={
                    request.status === 'pending'
                      ? 'pending'
                      : request.status === 'accepted'
                      ? 'check-circle'
                      : request.status === 'rejected'
                      ? 'cancel'
                      : request.status === 'completed'
                      ? 'check-circle-outline'
                      : 'close-circle'
                  }
                  size={16}
                  color="#fff"
                />
              )}
              style={[styles.statusChip, { backgroundColor: getStatusColor(request.status) }]}
              textStyle={{ color: '#fff', fontSize: 14, fontWeight: '600' }}
            >
              {request.status.toUpperCase()}
            </Chip>
            <Text variant="bodySmall" style={[styles.dateText, { color: colors.textSecondary }]}>
              Created: {formatDate(request.createdAt)}
            </Text>
          </View>
        </Surface>

        {/* Request Details */}
        <Surface style={[styles.section, { backgroundColor: colors.card }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Request Details
          </Text>
          <Divider style={{ marginBottom: Spacing.base }} />

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
              Title
            </Text>
            <Text variant="bodyLarge" style={[styles.value, { color: colors.text }]}>
              {request.title}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
              Description
            </Text>
            <Text variant="bodyMedium" style={[styles.value, { color: colors.text }]}>
              {request.description}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
              Service Type
            </Text>
            <Chip
              icon={() => (
                <MaterialIcons
                  name={request.serviceType === 'construction' ? 'construction' : 'handyman'}
                  size={16}
                  color={colors.tint}
                />
              )}
              style={[styles.typeChip, { backgroundColor: colors.border }]}
              textStyle={{ color: colors.text }}
            >
              {request.serviceType}
            </Chip>
          </View>
        </Surface>

        {/* Property Information */}
        {property && (
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Property Information
            </Text>
            <Divider style={{ marginBottom: Spacing.base }} />

            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
                Property
              </Text>
              <Text variant="bodyLarge" style={[styles.value, { color: colors.text }]}>
                {property.title}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
                Location
              </Text>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                <Text variant="bodyMedium" style={[styles.value, { color: colors.text }]}>
                  {request.location.address}
                </Text>
              </View>
              <Text variant="bodySmall" style={[styles.value, { color: colors.textSecondary, marginLeft: 20 }]}>
                {request.location.city}, {request.location.state} {request.location.zipCode}
              </Text>
            </View>
          </Surface>
        )}

        {/* Location (if no property) */}
        {!property && (
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Location
            </Text>
            <Divider style={{ marginBottom: Spacing.base }} />

            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={20} color={colors.tint} />
              <View style={styles.locationText}>
                <Text variant="bodyMedium" style={[styles.value, { color: colors.text }]}>
                  {request.location.address}
                </Text>
                <Text variant="bodySmall" style={[styles.value, { color: colors.textSecondary }]}>
                  {request.location.city}, {request.location.state} {request.location.zipCode}
                </Text>
              </View>
            </View>
          </Surface>
        )}

        {/* Additional Information */}
        <Surface style={[styles.section, { backgroundColor: colors.card }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Additional Information
          </Text>
          <Divider style={{ marginBottom: Spacing.base }} />

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
              Budget
            </Text>
            <Text variant="bodyMedium" style={[styles.value, { color: colors.text }]}>
              {formatCurrency(request.budget)}
            </Text>
          </View>

          {request.preferredDate && (
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
                Preferred Date
              </Text>
              <Text variant="bodyMedium" style={[styles.value, { color: colors.text }]}>
                {formatDate(request.preferredDate)}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={[styles.label, { color: colors.textSecondary }]}>
              Last Updated
            </Text>
            <Text variant="bodySmall" style={[styles.value, { color: colors.textSecondary }]}>
              {formatDate(request.updatedAt)}
            </Text>
          </View>
        </Surface>

        {/* Action Buttons for Owners/Admins */}
        {canManage && (
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Manage Request
            </Text>
            <Divider style={{ marginBottom: Spacing.base }} />

            <View style={styles.actionButtons}>
              {showApproveButton && (
                <Button
                  mode="contained"
                  onPress={() => handleStatusUpdate('accepted')}
                  loading={updating}
                  disabled={updating}
                  icon="check-circle"
                  style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                  contentStyle={styles.buttonContent}
                >
                  Approve
                </Button>
              )}

              {showRejectButton && (
                <Button
                  mode="contained"
                  onPress={() => handleStatusUpdate('rejected')}
                  loading={updating}
                  disabled={updating}
                  icon="cancel"
                  style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                  contentStyle={styles.buttonContent}
                >
                  Reject
                </Button>
              )}

              {showCompleteButton && (
                <Button
                  mode="contained"
                  onPress={() => handleStatusUpdate('completed')}
                  loading={updating}
                  disabled={updating}
                  icon="check-circle-outline"
                  style={[styles.actionButton, { backgroundColor: '#0a7ea4' }]}
                  contentStyle={styles.buttonContent}
                >
                  Mark Completed
                </Button>
              )}

              {!showApproveButton && !showRejectButton && !showCompleteButton && (
                <Text variant="bodyMedium" style={[styles.noActionsText, { color: colors.textSecondary }]}>
                  No actions available for this status
                </Text>
              )}
            </View>
          </Surface>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.base,
  },
  errorText: {
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: 60,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 32,
  },
  dateText: {
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  detailRow: {
    marginBottom: Spacing.base,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  value: {
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  locationText: {
    marginLeft: Spacing.xs,
    flex: 1,
  },
  typeChip: {
    height: 28,
    marginTop: Spacing.xs,
  },
  actionButtons: {
    gap: Spacing.base,
  },
  actionButton: {
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  noActionsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
});



