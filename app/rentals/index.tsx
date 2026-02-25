import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radius, shadows, typography } from '../../src/theme';
import { rentalService } from '../../src/services/rentalService';
import { Rental } from '../../src/types';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

export default function RentalsScreen() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const data = await rentalService.getAllRentals({ approved: true, status: 'available' }, user);
      setRentals(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading rentals:', error);
      }
      Alert.alert('Error', error.message || 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRentals();
    setRefreshing(false);
  };

  const handleRentalPress = (rentalId: string) => {
    router.push(`/rentals/${rentalId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rentals</Text>
        {!isGuest && (
          <TouchableOpacity
            onPress={() => router.push('/rentals/create')}
            style={styles.addButton}
            activeOpacity={0.7}>
            <MaterialIcons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.rentalCardSkeleton}>
                <SkeletonLoader width="100%" height={200} borderRadius={radius.lg} />
                <View style={styles.skeletonContent}>
                  <SkeletonLoader width="80%" height={20} style={{ marginBottom: spacing.xs }} />
                  <SkeletonLoader width="60%" height={16} />
                </View>
              </View>
            ))}
          </View>
        ) : rentals.length === 0 ? (
          <EmptyState
            icon="apartment"
            title="No Rentals Available"
            message="Check back later for new rental listings"
          />
        ) : (
          rentals.map((rental, index) => (
            <Animated.View
              key={rental.id}
              entering={FadeInUp.delay(index * 100).duration(400)}>
              <TouchableOpacity
                style={styles.rentalCard}
                onPress={() => handleRentalPress(rental.id)}
                activeOpacity={0.9}>
                {rental.images && rental.images.length > 0 ? (
                  <Image
                    source={{ uri: rental.images[0] }}
                    style={styles.rentalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="apartment" size={48} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.rentalContent}>
                  <Text style={styles.rentalPrice}>
                    ${rental.monthlyRent.toLocaleString()}/month
                  </Text>
                  <Text style={styles.rentalTitle} numberOfLines={1}>
                    {rental.title}
                  </Text>
                  <View style={styles.rentalLocation}>
                    <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {rental.location.city}, {rental.location.state}
                    </Text>
                  </View>
                  {(rental.bedrooms || rental.bathrooms) && (
                    <View style={styles.rentalDetails}>
                      {rental.bedrooms && (
                        <View style={styles.detailItem}>
                          <MaterialIcons name="bed" size={16} color={colors.textSecondary} />
                          <Text style={styles.detailText}>{rental.bedrooms}</Text>
                        </View>
                      )}
                      {rental.bathrooms && (
                        <View style={styles.detailItem}>
                          <MaterialIcons name="bathtub" size={16} color={colors.textSecondary} />
                          <Text style={styles.detailText}>{rental.bathrooms}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    ...typography.title,
    color: colors.text,
  },
  addButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.base,
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  rentalCardSkeleton: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  skeletonContent: {
    padding: spacing.base,
  },
  rentalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  rentalImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentalContent: {
    padding: spacing.base,
  },
  rentalPrice: {
    ...typography.title,
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  rentalTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  rentalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs / 2,
  },
  rentalDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  detailText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
