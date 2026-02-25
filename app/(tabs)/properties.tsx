import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PropertyCardSkeleton } from '../../components/SkeletonComponents';
import { EmptyState } from '../../src/components/EmptyState';
import { Card } from '../../src/components/layout/Card';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { useAuth } from '../../src/context/AuthContext';
import { propertyService } from '../../src/services/propertyService';
import { colors, radius, shadows, spacing, typography } from '../../src/theme';
import { Property } from '../../src/types';

export default function PropertiesScreen() {
  const { user, isGuest } = useAuth();
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

    const loadData = async () => {
      if (isMounted) {
        await loadProperties();
      }
    };

    loadData();

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

    return () => {
      isMounted = false;
    };
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await propertyService.getAllProperties(
        {
          approved: true,
          status: 'available',
        },
        user ?? null
      );

      // Ensure we never set undefined/null into state
      setProperties(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('🔥 FIRESTORE WARNING: PropertiesScreen loadProperties failed:', {
          code: error?.code,
          message: error?.message,
        });
      }
      setProperties([]); // Safe empty array
      setError(error?.message || 'Setting things up… This may take a moment.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

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
              <Text style={styles.title}>Properties</Text>
              <Text style={styles.subtitle}>
                {properties.length > 0 ? `${properties.length} available` : 'Browse listings'}
              </Text>
            </View>
            {!isGuest && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/property/create')}
                activeOpacity={0.7}>
                <MaterialIcons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Guest Banner */}
          {isGuest && (
            <Card variant="base" style={styles.guestBanner}>
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <View style={styles.guestBannerContent}>
                <Text style={styles.guestBannerTitle}>Sign in to create properties</Text>
                <Text style={styles.guestBannerText}>
                  Login to list and manage your properties
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                style={styles.guestButton}>
                <Text style={styles.guestButtonText}>Sign In</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Content */}
          {loading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3, 4].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </View>
          ) : properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="home"
                title={error ? "Setting things up…" : "No properties available"}
                message={error || (isGuest
                  ? "Browse available properties or sign in to create your own"
                  : "Check back later for new listings")}
                actionLabel={error ? "Retry" : (!isGuest ? undefined : "Sign In")}
                onAction={error ? loadProperties : (!isGuest ? undefined : () => router.push('/(auth)/login'))}
                variant={error ? "error" : "default"}
              />
            </View>
          ) : (
            <View style={styles.propertiesList}>
              {(Array.isArray(properties) ? properties : []).map((property) => (
                <Card
                  key={property?.id || Math.random().toString()} // Fallback key if id is missing
                  variant="interactive"
                  onPress={() => property?.id && router.push(`/property/${property.id}`)}
                  style={styles.propertyCard}>
                  {property?.images && property.images.length > 0 ? (
                    <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
                  ) : (
                    <View style={styles.propertyImagePlaceholder}>
                      <MaterialIcons name="home" size={40} color={colors.muted} />
                    </View>
                  )}
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyPrice}>
                      ${(property?.price ?? 0).toLocaleString()}
                    </Text>
                    <Text style={styles.propertyTitle} numberOfLines={2}>
                      {property?.title ?? 'Untitled Property'}
                    </Text>
                    <View style={styles.propertyLocationRow}>
                      <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                      <Text style={styles.propertyLocation} numberOfLines={1}>
                        {property?.location?.city ?? 'Unknown'}, {property?.location?.state ?? 'Unknown'}
                      </Text>
                    </View>
                    {property?.bedrooms !== undefined && property?.bathrooms !== undefined && (
                      <View style={styles.propertyDetails}>
                        <View style={styles.propertyDetailItem}>
                          <MaterialIcons name="bed" size={16} color={colors.textSecondary} />
                          <Text style={styles.propertyDetailText}>{property.bedrooms}</Text>
                        </View>
                        <View style={styles.propertyDetailItem}>
                          <MaterialIcons name="bathtub" size={16} color={colors.textSecondary} />
                          <Text style={styles.propertyDetailText}>{property.bathrooms}</Text>
                        </View>
                      </View>
                    )}
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
  guestBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  guestBannerContent: {
    flex: 1,
  },
  guestBannerTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  guestBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  guestButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  guestButtonText: {
    ...typography.label,
    color: colors.white,
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
  propertyPrice: {
    ...typography.sectionHeading,
    color: colors.primary,
    marginBottom: spacing.xs,
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
  propertyDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  propertyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  propertyDetailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
