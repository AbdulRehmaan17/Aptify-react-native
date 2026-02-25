import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import QuickActionCard, { type QuickActionItem } from '../../components/QuickActionCard';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { useAuth } from '../../src/context/AuthContext';
import { propertyService } from '../../src/services/propertyService';
import { colors, radius, shadows, spacing } from '../../src/theme';
import { Property } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = spacing.base;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP) / 2;
const MIN_TAB_BAR_SPACING = 12;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const quickActions: QuickActionItem[] = [
  {
    id: 'properties',
    title: 'Properties',
    icon: 'home',
    route: '/(tabs)/properties',
  },
  {
    id: 'services',
    title: 'Services',
    icon: 'build',
    route: '/(tabs)/services',
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: 'message',
    route: '/(tabs)/messages',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications',
    route: '/(tabs)/notifications',
  },
  {
    id: 'listings',
    title: 'My Listings',
    icon: 'list',
    route: '/(tabs)/listings',
  },
];

export default function HomeScreen() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user || isGuest) {
      loadFeaturedProperties();
    }
  }, [user, isGuest]);

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      if (__DEV__) {
        console.log('[HomeScreen] Loading featured properties...', {
          userId: user?.uid || 'guest',
          isGuest,
        });
      }

      const properties = await propertyService.getAllProperties(
        { approved: true },
        user,
        6
      );

      if (__DEV__) {
        console.log('[HomeScreen] Properties loaded:', {
          count: properties.length,
          properties: properties.map((p) => ({ id: p.id, title: p.title })),
        });
      }

      // Always use a safe array (never undefined/null)
      setFeaturedProperties(Array.isArray(properties) ? properties : []);
    } catch (error: any) {
      // CRITICAL: Never crash app - show user-friendly error
      const errorMessage = error?.message || 'Unable to load properties. Please try again.';
      if (__DEV__) {
        console.warn('[HomeScreen] Error loading featured properties:', {
          error: errorMessage,
          code: error?.code,
          stack: error?.stack,
          userId: user?.uid || 'guest',
        });
      }
      setError(errorMessage);
      setFeaturedProperties([]); // Empty array is safe - UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedProperties();
    setRefreshing(false);
  };

  const handleQuickActionPress = (item: QuickActionItem) => {
    if (isGuest && item.id === 'messages') {
      return;
    }
    router.push(item.route as any);
  };

  const handleCreateListing = () => {
    if (isGuest) {
      router.push('/(auth)/login');
      return;
    }
    router.push('/property/create');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: MIN_TAB_BAR_SPACING + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {isGuest
                  ? 'Welcome to Aptify'
                  : user?.displayName?.split(' ')[0] || 'User'}
              </Text>
            </View>
            {!isGuest && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
                style={styles.avatarButton}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(user?.displayName?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        'U'
                      ).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties or services..."
            placeholderTextColor={colors.textSecondary}
            onFocus={() => router.push('/(tabs)/properties')}
            editable={false}
          />
        </Animated.View>

        {/* Quick Actions Grid - Square cards with equal height */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <FlatList
            data={quickActions}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.duration(300).delay(300 + index * 50)}>
                <QuickActionCard
                  item={item}
                  index={index}
                  cardWidth={CARD_WIDTH}
                  onPress={handleQuickActionPress}
                />
              </Animated.View>
            )}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.quickActionsGrid}
            columnWrapperStyle={styles.quickActionsRow}
          />
        </Animated.View>

        {/* Featured Properties */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Properties</Text>
          {loading ? (
            <View style={styles.skeletonContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonCardWrapper}>
                    <SkeletonCard />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : error ? (
            <EmptyState
              icon="error-outline"
              title="Unable to Load Properties"
              message={error}
              variant="error"
              actionLabel="Try Again"
              onAction={loadFeaturedProperties}
            />
          ) : featuredProperties.length === 0 ? (
            <EmptyState
              icon="home"
              title="No Properties Available"
              message="Check back later for new listings"
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(Array.isArray(featuredProperties) ? featuredProperties : []).map((property, index) => (
                <Animated.View
                  key={property?.id || `featured-${index}`}
                  entering={FadeIn.duration(300).delay(400 + index * 50)}>
                  <TouchableOpacity
                    style={styles.propertyCard}
                    onPress={() => property?.id && router.push(`/property/${property.id}`)}
                    activeOpacity={0.9}>
                    {property?.images && property.images.length > 0 ? (
                      <Image
                        source={{ uri: property.images[0] }}
                        style={styles.propertyImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.propertyImagePlaceholder}>
                        <MaterialIcons name="home" size={48} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.propertyContent}>
                      <Text style={styles.propertyPrice}>
                        ${(property?.price ?? 0).toLocaleString()}
                      </Text>
                      <Text style={styles.propertyTitle} numberOfLines={2}>
                        {property?.title ?? 'Untitled'}
                      </Text>
                      <Text style={styles.propertyLocation} numberOfLines={1}>
                        {property?.location?.city ?? 'Unknown'}, {property?.location?.state ?? 'Unknown'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Create Listing Button */}
        {!isGuest && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateListing}
              activeOpacity={0.8}>
              <MaterialIcons name="add" size={24} color={colors.white} />
              <Text style={styles.createButtonText}>Create Listing</Text>
            </TouchableOpacity>
          </Animated.View>
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
  scrollContent: {
    padding: PADDING,
  },
  header: {
    marginBottom: spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
  },
  avatarButton: {
    marginLeft: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    padding: 0,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.base,
  },
  quickActionsGrid: {
    gap: CARD_GAP,
  },
  quickActionsRow: {
    justifyContent: 'space-between',
  },
  featuredSection: {
    marginBottom: spacing.xl,
  },
  skeletonContainer: {
    marginTop: spacing.sm,
  },
  skeletonCardWrapper: {
    width: Math.min(SCREEN_WIDTH * 0.75, 320),
    marginRight: spacing.md,
  },
  propertyCard: {
    width: Math.min(SCREEN_WIDTH * 0.75, 320),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyContent: {
    padding: spacing.base,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
    // Fix text wrapping - allow proper line breaks
    flexWrap: 'wrap',
  },
  propertyLocation: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
