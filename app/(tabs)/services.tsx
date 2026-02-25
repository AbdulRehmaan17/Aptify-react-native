import { RenovatorService } from '@/src/services/renovatorService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { Card } from '../../src/components/layout/Card';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { useAuth } from '../../src/context/AuthContext';
import { colors, radius, spacing, typography } from '../../src/theme';
import { Renovator } from '../../src/types';

export default function ServicesScreen() {
  const { isGuest } = useAuth();
  const router = useRouter();

  const [renovators, setRenovators] = useState<Renovator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const screenSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await loadRenovators();
      }
    };

    loadData();

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

  const loadRenovators = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await RenovatorService.getRenovators();
      const safeData = Array.isArray(data) ? data : [];

      setRenovators(safeData);
    } catch (error: any) {
      if (__DEV__) {
        console.warn('🔥 FIRESTORE WARNING: ServicesScreen loadRenovators failed:', {
          code: error?.code,
          message: error?.message,
        });
      }
      setRenovators([]);
      setError(error?.message || 'Setting things up… This may take a moment.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRenovators();
    setRefreshing(false);
  };

  const handleRenovatorPress = (renovatorId: string) => {
    router.push(`/services/${renovatorId}`);
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Service Renovators</Text>
              <Text style={styles.subtitle}>
                {renovators.length > 0
                  ? `${renovators.length} available`
                  : 'Find professionals'}
              </Text>
            </View>
          </View>

          {/* Guest Banner */}
          {isGuest && (
            <Card variant="base" style={styles.guestBanner}>
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <View style={styles.guestBannerContent}>
                <Text style={styles.guestBannerTitle}>
                  Sign in to request services
                </Text>
                <Text style={styles.guestBannerText}>
                  Connect with service renovators and get quotes
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
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading renovators...</Text>
            </View>
          ) : renovators.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="build"
                title={error ? 'Setting things up…' : 'No service renovators found'}
                message={
                  error ||
                  (isGuest
                    ? 'Browse available service renovators or sign in to request services'
                    : 'Check back later for new renovators')
                }
                actionLabel={error ? 'Retry' : isGuest ? 'Sign In' : undefined}
                onAction={
                  error
                    ? loadRenovators
                    : isGuest
                    ? () => router.push('/(auth)/login')
                    : undefined
                }
                variant={error ? 'error' : 'default'}
              />
            </View>
          ) : (
            <View style={styles.renovatorsList}>
              {renovators.map((renovator) => (
                <Card
                  key={renovator.uid}
                  variant="interactive"
                  onPress={() => handleRenovatorPress(renovator.uid)}
                  style={styles.renovatorCard}>
                  
                  <View style={styles.renovatorHeader}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {renovator.name?.charAt(0).toUpperCase() ||
                          renovator.email.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.renovatorInfo}>
                      <Text style={styles.renovatorName} numberOfLines={1}>
                        {renovator.name || renovator.email}
                      </Text>

                      <View style={styles.renovatorEmailRow}>
                        <MaterialIcons
                          name="email"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={styles.renovatorEmail}
                          numberOfLines={1}>
                          {renovator.email}
                        </Text>
                      </View>
                    </View>

                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </View>

                  {renovator.officeAddress && (
                    <Text style={styles.renovatorBio} numberOfLines={2}>
                      {renovator.officeAddress}
                    </Text>
                  )}
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
  animatedContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  header: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  guestBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  guestBannerContent: { flex: 1 },
  guestBannerTitle: { ...typography.bodyBold, color: colors.text },
  guestBannerText: { ...typography.caption, color: colors.textSecondary },
  guestButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  guestButtonText: { ...typography.label, color: colors.white },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary },
  emptyContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  renovatorsList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  renovatorCard: { padding: spacing.md },
  renovatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { ...typography.sectionHeading, color: colors.white },
  renovatorInfo: { flex: 1 },
  renovatorName: { ...typography.bodyBold, color: colors.text },
  renovatorEmailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  renovatorEmail: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  renovatorBio: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  specialtyTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.primary}15`,
    borderRadius: radius.sm,
  },
  specialtyText: { ...typography.small, color: colors.primary },
});
