/**
 * Reusable Skeleton Components
 * Provides consistent loading states across the app with shimmer animations
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Shimmer animation hook
 * Returns an animated value that loops from 0 to 1 and back
 */
const useShimmer = (): Animated.Value => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);

  return shimmer;
};

interface SkeletonBaseProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBase({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBaseProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shimmer = useShimmer();

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PropertyCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBase width="100%" height={220} borderRadius={Radius.lg} style={styles.imageSkeleton} />
      <View style={styles.content}>
        <SkeletonBase width="40%" height={26} borderRadius={Radius.md} style={styles.priceSkeleton} />
        <SkeletonBase width="80%" height={20} borderRadius={Radius.md} style={styles.titleSkeleton} />
        <SkeletonBase width="60%" height={16} borderRadius={Radius.md} style={styles.locationSkeleton} />
        <View style={styles.detailsRow}>
          <SkeletonBase width={60} height={16} borderRadius={Radius.md} />
          <SkeletonBase width={60} height={16} borderRadius={Radius.md} />
          <SkeletonBase width={80} height={16} borderRadius={Radius.md} />
        </View>
      </View>
    </View>
  );
}

export function PropertyDetailSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.detailContainer}>
      {/* Image Skeleton */}
      <SkeletonBase width="100%" height={400} borderRadius={0} />
      
      {/* Content */}
      <View style={styles.detailContent}>
        {/* Title and Price Card */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SkeletonBase width="80%" height={28} borderRadius={Radius.md} style={styles.detailTitle} />
          <SkeletonBase width="50%" height={32} borderRadius={Radius.md} style={styles.detailPrice} />
        </View>

        {/* Property Details Card */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SkeletonBase width="40%" height={20} borderRadius={Radius.md} style={styles.detailCardTitle} />
          <View style={styles.detailDetailsRow}>
            <View style={styles.detailDetailItem}>
              <SkeletonBase width={56} height={56} borderRadius={Radius.md} />
              <SkeletonBase width={40} height={20} borderRadius={Radius.md} style={styles.detailValue} />
              <SkeletonBase width={60} height={14} borderRadius={Radius.md} />
            </View>
            <View style={styles.detailDetailItem}>
              <SkeletonBase width={56} height={56} borderRadius={Radius.md} />
              <SkeletonBase width={40} height={20} borderRadius={Radius.md} style={styles.detailValue} />
              <SkeletonBase width={60} height={14} borderRadius={Radius.md} />
            </View>
            <View style={styles.detailDetailItem}>
              <SkeletonBase width={56} height={56} borderRadius={Radius.md} />
              <SkeletonBase width={50} height={20} borderRadius={Radius.md} style={styles.detailValue} />
              <SkeletonBase width={40} height={14} borderRadius={Radius.md} />
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SkeletonBase width="30%" height={20} borderRadius={Radius.md} style={styles.detailCardTitle} />
          <SkeletonBase width="100%" height={16} borderRadius={Radius.md} style={styles.detailDescription} />
          <SkeletonBase width="95%" height={16} borderRadius={Radius.md} style={styles.detailDescription} />
          <SkeletonBase width="85%" height={16} borderRadius={Radius.md} style={styles.detailDescription} />
        </View>

        {/* Location Card */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SkeletonBase width="25%" height={20} borderRadius={Radius.md} style={styles.detailCardTitle} />
          <View style={styles.detailLocationRow}>
            <SkeletonBase width={24} height={24} borderRadius={Radius.md} />
            <View style={styles.detailLocationText}>
              <SkeletonBase width="80%" height={16} borderRadius={Radius.md} style={styles.detailLocationAddress} />
              <SkeletonBase width="60%" height={14} borderRadius={Radius.md} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.detailActions}>
          <SkeletonBase width="65%" height={48} borderRadius={Radius.md} />
          <SkeletonBase width="30%" height={48} borderRadius={Radius.md} />
        </View>
      </View>
    </View>
  );
}

export function ProviderCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.providerHeader}>
        <SkeletonBase width={64} height={64} borderRadius={Radius.full} />
        <View style={styles.providerInfo}>
          <SkeletonBase width="70%" height={20} borderRadius={Radius.md} style={styles.providerName} />
          <SkeletonBase width="50%" height={16} borderRadius={Radius.md} style={styles.providerRating} />
        </View>
      </View>
      <SkeletonBase width="100%" height={16} borderRadius={Radius.md} style={styles.bio} />
      <SkeletonBase width="80%" height={16} borderRadius={Radius.md} style={styles.bio} />
      <View style={styles.specialtiesRow}>
        <SkeletonBase width={80} height={32} borderRadius={Radius.full} />
        <SkeletonBase width={80} height={32} borderRadius={Radius.full} />
        <SkeletonBase width={80} height={32} borderRadius={Radius.full} />
      </View>
      <SkeletonBase width="100%" height={48} borderRadius={Radius.button} style={styles.button} />
    </View>
  );
}

export function ChatCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBase width={56} height={56} borderRadius={Radius.full} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <SkeletonBase width="60%" height={18} borderRadius={Radius.md} />
          <SkeletonBase width={60} height={14} borderRadius={Radius.md} />
        </View>
        <SkeletonBase width="80%" height={16} borderRadius={Radius.md} style={styles.lastMessage} />
      </View>
    </View>
  );
}

export function NotificationCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.notificationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBase width={52} height={52} borderRadius={Radius.full} />
      <View style={styles.notificationInfo}>
        <SkeletonBase width="70%" height={18} borderRadius={Radius.md} style={styles.notificationTitle} />
        <SkeletonBase width="100%" height={16} borderRadius={Radius.md} style={styles.notificationBody} />
        <SkeletonBase width="80%" height={16} borderRadius={Radius.md} style={styles.notificationBody} />
        <View style={styles.notificationFooter}>
          <SkeletonBase width={80} height={14} borderRadius={Radius.md} />
          <SkeletonBase width={60} height={14} borderRadius={Radius.md} />
        </View>
      </View>
    </View>
  );
}

interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 3 }: ListSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonBase width={48} height={48} borderRadius={Radius.full} />
          <View style={styles.listItemContent}>
            <SkeletonBase width="70%" height={18} borderRadius={Radius.md} />
            <SkeletonBase width="50%" height={14} borderRadius={Radius.md} style={styles.listItemSubtext} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.md,
  },
  imageSkeleton: {
    marginBottom: 0,
  },
  content: {
    padding: Spacing.md,
  },
  priceSkeleton: {
    marginBottom: Spacing.xs,
  },
  titleSkeleton: {
    marginBottom: Spacing.sm,
  },
  locationSkeleton: {
    marginBottom: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  providerCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.md,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  providerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  providerName: {
    marginBottom: Spacing.xs,
  },
  providerRating: {
    marginTop: Spacing.xs / 2,
  },
  bio: {
    marginBottom: Spacing.sm,
  },
  specialtiesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.xs,
  },
  chatCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  lastMessage: {
    marginTop: Spacing.xs / 2,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderLeftWidth: 4,
    marginBottom: 1,
  },
  notificationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  notificationTitle: {
    marginBottom: Spacing.sm,
  },
  notificationBody: {
    marginBottom: Spacing.xs,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  listItemSubtext: {
    marginTop: Spacing.xs,
  },
  detailContainer: {
    flex: 1,
  },
  detailContent: {
    padding: Spacing.xl,
  },
  detailCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  detailTitle: {
    marginBottom: Spacing.sm,
  },
  detailPrice: {
    marginTop: Spacing.xs,
  },
  detailCardTitle: {
    marginBottom: Spacing.lg,
  },
  detailDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  detailDescription: {
    marginBottom: Spacing.sm,
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLocationText: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  detailLocationAddress: {
    marginBottom: Spacing.xs,
  },
  detailActions: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.xxl,
  },
});
