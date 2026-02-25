import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Property } from '../../src/types';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { propertyService } from '../../src/services/propertyService';
import { PropertyCardSkeleton } from '../../components/SkeletonComponents';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { Card } from '../../src/components/layout/Card';

export default function ListingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screen fade-in animation
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const screenSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      const loadData = async () => {
        if (isMounted) {
          await loadProperties();
        }
      };
      loadData();
    }
    
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
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadProperties = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await propertyService.getPropertiesByOwner(user.uid, user);
      setProperties(data);
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: ListingsScreen loadProperties failed:', error);
      setProperties([]);
      setError(error.message || 'Setting things up… This may take a moment.');
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
            await propertyService.deleteProperty(propertyId, user!);
            await loadProperties();
          } catch (error: any) {
            if (error.message?.includes('Authentication required') || error.message?.includes('Access denied')) {
              Alert.alert('Access Denied', 'You do not have permission to delete this property.');
            } else {
              Alert.alert('Error', error.message || 'Failed to delete property. Please try again.');
            }
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <EmptyState
            icon="lock"
            title="Login Required"
            message="Please login to view your listings"
            actionLabel="Sign In"
            onAction={() => router.push('/(auth)/login')}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Listings</Text>
              <Text style={styles.subtitle}>
                {properties.length > 0 ? `${properties.length} properties` : 'Manage your properties'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/property/create')}
              activeOpacity={0.7}>
              <MaterialIcons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </View>
          ) : properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="list"
                title={error ? "Setting things up…" : "No listings yet"}
                message={error || "Create your first property listing to get started"}
                actionLabel={error ? "Retry" : "Create Listing"}
                onAction={error ? loadProperties : () => router.push('/property/create')}
                variant={error ? "error" : "default"}
              />
            </View>
          ) : (
            <View style={styles.propertiesList}>
              {properties.map((property) => (
                <Card
                  key={property.id}
                  variant="interactive"
                  onPress={() => router.push(`/property/${property.id}`)}
                  style={styles.propertyCard}>
                  {property.images && property.images.length > 0 ? (
                    <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
                  ) : (
                    <View style={styles.propertyImagePlaceholder}>
                      <MaterialIcons name="home" size={40} color={colors.muted} />
                    </View>
                  )}
                  <View style={styles.propertyInfo}>
                    <View style={styles.propertyHeader}>
                      <Text style={styles.propertyPrice}>
                        ${property.price.toLocaleString()}
                      </Text>
                      <View style={styles.propertyActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/property/edit/${property.id}`);
                          }}
                          style={styles.actionButton}
                          activeOpacity={0.7}>
                          <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(property.id, property.title);
                          }}
                          style={styles.actionButton}
                          activeOpacity={0.7}>
                          <MaterialIcons name="delete" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.propertyTitle} numberOfLines={2}>
                      {property.title}
                    </Text>
                    <View style={styles.propertyLocationRow}>
                      <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                      <Text style={styles.propertyLocation} numberOfLines={1}>
                        {property.location.city}, {property.location.state}
                      </Text>
                    </View>
                    <View style={styles.statusRow}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: property.approved ? `${colors.success}15` : `${colors.warning}15` }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: property.approved ? colors.success : colors.warning }
                        ]}>
                          {property.approved ? 'Approved' : 'Pending Approval'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  propertiesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  propertyCard: {
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  propertyImagePlaceholder: {
    height: 200,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    padding: spacing.md,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  propertyPrice: {
    ...typography.sectionHeading,
    color: colors.primary,
    flex: 1,
  },
  propertyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  propertyTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  propertyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  propertyLocation: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  statusRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
  },
});
