import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { propertyService } from '../../src/services/propertyService';
import { Property } from '../../src/types';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../src/constants/theme';
import { showSuccessToast } from '../../src/utils/toast';
import { getFriendlyErrorMessage } from '../../src/utils/errorMessages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PropertyCardSkeleton } from '../../components/SkeletonComponents';

export default function MyListingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await propertyService.getPropertiesByOwner(user.uid, user);
      setProperties(data);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('Error loading properties:', {
          code: error?.code,
          message: error?.message,
        });
      }
      const friendly = getFriendlyErrorMessage(
        error,
        'Failed to load your properties. Please try again.'
      );
      Alert.alert('Error', friendly);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const handleDelete = (propertyId: string, propertyTitle: string) => {
    Alert.alert('Delete Property', `Are you sure you want to delete "${propertyTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(propertyId);
            await propertyService.deleteProperty(propertyId, user);
            await loadProperties();
            showSuccessToast('Property deleted successfully.');
          } catch (error: any) {
            if (__DEV__) {
              console.warn('Error deleting property:', {
                code: error?.code,
                message: error?.message,
              });
            }
            const friendly = getFriendlyErrorMessage(
              error,
              'Failed to delete property. Please try again.'
            );
            Alert.alert('Error', friendly);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: Property['status'], approved?: boolean): string => {
    if (!approved) return colors.warning;
    switch (status) {
      case 'available':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'sold':
      case 'rented':
        return colors.icon;
      default:
        return colors.icon;
    }
  };

  const getStatusText = (status: Property['status'], approved?: boolean): string => {
    if (!approved) return 'Pending Approval';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>My Listings</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView 
            style={styles.list} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.propertiesList}>
              {[1, 2, 3].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Listings</Text>
        <TouchableOpacity
          onPress={() => router.push('/property/create')}
          style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {properties.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="home" size={64} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No Properties Listed</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Start by listing your first property
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/property/create')}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>List Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.propertiesList}>
            {properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={[
                  styles.propertyCard,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  deletingId === property.id && styles.propertyCardDisabled,
                ]}
                onPress={() => router.push(`/property/${property.id}`)}
                activeOpacity={0.7}
                disabled={deletingId === property.id}>
                {/* Property Image */}
                <View style={styles.imageContainer}>
                  {property.images && property.images.length > 0 ? (
                    <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
                      <MaterialIcons name="home" size={40} color={colors.icon} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(property.status, property.approved) },
                    ]}>
                    <Text style={styles.statusText}>{getStatusText(property.status, property.approved)}</Text>
                  </View>
                </View>

                {/* Property Info */}
                <View style={styles.propertyInfo}>
                  <View style={styles.propertyHeader}>
                    <View style={styles.propertyTitleContainer}>
                      <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>
                        {property.title}
                      </Text>
                      <Text style={[styles.propertyPrice, { color: colors.primary }]}>
                        ${property.price.toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (deletingId === property.id) return;
                        Alert.alert(
                          property.title,
                          'Choose an action',
                          [
                            {
                              text: 'View Details',
                              onPress: () => router.push(`/property/${property.id}`),
                            },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => handleDelete(property.id, property.title),
                            },
                            { text: 'Cancel', style: 'cancel' },
                          ],
                          { cancelable: true }
                        );
                      }}>
                      {deletingId === property.id ? (
                        <ActivityIndicator size="small" color={colors.icon} />
                      ) : (
                        <MaterialIcons name="more-vert" size={24} color={colors.icon} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={16} color={colors.icon} />
                    <Text style={[styles.propertyLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                      {property.location.city}, {property.location.state}
                    </Text>
                  </View>

                  <View style={styles.propertyDetails}>
                    {property.bedrooms && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="bed" size={16} color={colors.icon} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{property.bedrooms}</Text>
                      </View>
                    )}
                    {property.bathrooms && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="bathroom" size={16} color={colors.icon} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{property.bathrooms}</Text>
                      </View>
                    )}
                    {property.area && (
                      <View style={styles.detailItem}>
                        <MaterialIcons name="square-foot" size={16} color={colors.icon} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{property.area} sqft</Text>
                      </View>
                    )}
                  </View>

                  {!property.approved && (
                    <View style={[styles.approvalNotice, { backgroundColor: `${colors.warning}20` }]}>
                      <MaterialIcons name="info" size={16} color={colors.warning} />
                      <Text style={[styles.approvalText, { color: colors.warning }]}>
                        Waiting for admin approval
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
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
    padding: Spacing.lg,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    marginBottom: Spacing.xl,
    opacity: 0.7,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: Radius.base,
    gap: Spacing.sm,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  propertiesList: {
    padding: Spacing.base,
  },
  propertyCard: {
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  propertyCardDisabled: {
    opacity: 0.6,
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
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.base,
  },
  statusText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  propertyInfo: {
    padding: Spacing.base,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  propertyTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  propertyTitle: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  propertyPrice: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyLocation: {
    fontSize: FontSizes.caption,
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.base,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  approvalText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
});


