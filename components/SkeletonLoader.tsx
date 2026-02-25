import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors, radius, spacing } from '../src/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

function Shimmer({ children }: { children: React.ReactNode }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  return (
    <Shimmer>
      <View
        style={[
          styles.skeleton,
          { width, height, borderRadius },
          style,
        ]}
      />
    </Shimmer>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="100%" height={180} borderRadius={radius.lg} />
      <View style={styles.cardContent}>
        <SkeletonLoader width="70%" height={20} style={styles.title} />
        <SkeletonLoader width="50%" height={16} style={styles.subtitle} />
        <View style={styles.row}>
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={80} height={16} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonStatCard() {
  return (
    <View style={styles.statCard}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <SkeletonLoader width={60} height={24} style={styles.statValue} />
      <SkeletonLoader width={80} height={16} style={styles.statLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.base,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
  },
  statValue: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    marginTop: spacing.xs / 2,
  },
});
