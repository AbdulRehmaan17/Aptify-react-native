import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { RouteGuard } from '../../src/components/RouteGuard';
import { propertyService } from '../../src/services/propertyService';
import { Property } from '../../src/types';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPendingProperties();
    }
  }, [user]);

  const loadPendingProperties = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await propertyService.getPendingProperties(user);
      setPendingProperties(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AdminDashboard] ❌ Error loading pending properties:', error);
      }
      Alert.alert('Error', error.message || 'Failed to load pending properties. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingProperties();
  };

  const handleApprove = async (property: Property) => {
    Alert.alert('Approve Property', `Approve "${property.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            if (!user) return;
            setProcessingId(property.id);
            await propertyService.approveProperty(property.id, user);
            await loadPendingProperties();
            Alert.alert('Success', 'Property approved successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to approve property');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (property: Property) => {
    Alert.alert('Reject Property', `Reject "${property.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!user) return;
            setProcessingId(property.id);
            await propertyService.rejectProperty(property.id, user);
            await loadPendingProperties();
            Alert.alert('Success', 'Property rejected');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reject property');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  return (
    <RouteGuard adminOnly={true}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text>
            <View style={{ width: 40 }} />
          </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialIcons name="pending" size={32} color={colors.warning} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{pendingProperties.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading pending properties...</Text>
        </View>
      ) : pendingProperties.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No Pending Properties</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            All properties have been reviewed
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.propertiesList}>
            {pendingProperties.map((property) => (
              <View
                key={property.id}
                style={[styles.propertyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {/* Property Image */}
                <View style={styles.imageContainer}>
                  {property.images && property.images.length > 0 ? (
                    <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
                      <MaterialIcons name="home" size={40} color={colors.icon} />
                    </View>
                  )}
                  <View style={[styles.pendingBadge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.pendingText}>PENDING</Text>
                  </View>
                </View>

                {/* Property Info */}
                <View style={styles.propertyInfo}>
                  <Text style={[styles.propertyTitle, { color: colors.text }]}>{property.title}</Text>
                  <Text style={[styles.propertyPrice, { color: colors.primary }]}>
                    ${property.price.toLocaleString()}
                  </Text>
                  <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={16} color={colors.icon} />
                    <Text style={[styles.propertyLocation, { color: colors.textSecondary }]}>
                      {property.location.city}, {property.location.state}
                    </Text>
                  </View>
                  <Text style={[styles.propertyDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {property.description}
                  </Text>

                  {/* Property Details */}
                  <View style={styles.propertyDetails}>
                    {property.bedrooms && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="bed" size={16} color={colors.icon} />
                        <Text style={[styles.detailText, { color: colors.icon }]}>{property.bedrooms}</Text>
                      </View>
                    )}
                    {property.bathrooms && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="bathroom" size={16} color={colors.icon} />
                        <Text style={[styles.detailText, { color: colors.icon }]}>{property.bathrooms}</Text>
                      </View>
                    )}
                    {property.area && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="square-foot" size={16} color={colors.icon} />
                        <Text style={[styles.detailText, { color: colors.icon }]}>{property.area} sqft</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.viewButton, { borderColor: colors.border }]}
                      onPress={() => router.push(`/property/${property.id}`)}
                      disabled={processingId === property.id}>
                      <MaterialIcons name="visibility" size={18} color={colors.text} />
                      <Text style={[styles.viewButtonText, { color: colors.text }]}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectButton, { backgroundColor: colors.error }]}
                      onPress={() => handleReject(property)}
                      disabled={processingId === property.id || processingId !== null}>
                      {processingId === property.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="close" size={18} color="#fff" />
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveButton, { backgroundColor: colors.success }]}
                      onPress={() => handleApprove(property)}
                      disabled={processingId === property.id || processingId !== null}>
                      {processingId === property.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="check" size={18} color="#fff" />
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      </ScrollView>
    </SafeAreaView>
    </RouteGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: FontSizes.caption,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: FontSizes.body,
  },
  emptyText: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.caption,
    textAlign: 'center',
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  propertiesList: {
    gap: Spacing.base,
  },
  propertyCard: {
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.base,
  },
  pendingText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: Spacing.base,
  },
  propertyTitle: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  propertyPrice: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  propertyLocation: {
    fontSize: FontSizes.caption,
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  propertyDescription: {
    fontSize: FontSizes.caption,
    lineHeight: 20,
    marginBottom: Spacing.md,
    opacity: 0.8,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSizes.caption,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radius.base,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  viewButtonText: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radius.base,
    gap: Spacing.xs,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: FontSizes.caption,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radius.base,
    gap: Spacing.xs,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: FontSizes.caption,
    fontWeight: '600',
  },
});






