import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function GuestHomeScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Guest Banner */}
          {isGuest && (
            <View style={styles.guestBanner}>
              <MaterialIcons name="info" size={20} color={colors.white} />
              <Text style={styles.guestBannerText}>Login to unlock features</Text>
            </View>
          )}

          {/* Hero Section */}
          <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <MaterialIcons name="home" size={48} color={colors.white} />
              </View>
              <Text style={styles.heroTitle}>Welcome to Aptify</Text>
              <Text style={styles.heroSubtitle}>
                Discover properties and connect with service providers
              </Text>
            </View>
          </View>

          {/* App Purpose Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What is Aptify?</Text>
            <Text style={styles.sectionDescription}>
              Aptify is your trusted platform for property discovery, connecting buyers with property owners, and finding professional service providers for your real estate needs.
            </Text>
          </View>

          {/* CTA Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            
            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaPrimary]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}>
              <MaterialIcons name="login" size={24} color={colors.white} />
              <Text style={styles.ctaButtonPrimaryText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaSecondary]}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}>
              <MaterialIcons name="person-add" size={24} color={colors.primary} />
              <Text style={styles.ctaButtonSecondaryText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaTertiary]}
              onPress={() => router.push('/(guest)/listing')}
              activeOpacity={0.8}>
              <MaterialIcons name="explore" size={24} color={colors.primary} />
              <Text style={styles.ctaButtonTertiaryText}>Explore Properties</Text>
            </TouchableOpacity>
          </View>

          {/* Features Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="home" size={32} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Browse Properties</Text>
                <Text style={styles.featureDescription}>
                  Explore verified listings
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="build" size={32} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Find Services</Text>
                <Text style={styles.featureDescription}>
                  Connect with providers
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="chat" size={32} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Chat</Text>
                <Text style={styles.featureDescription}>
                  Message property owners
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="verified" size={32} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Verified</Text>
                <Text style={styles.featureDescription}>
                  Trusted listings only
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  guestBannerText: {
    ...typography.bodyBold,
    color: colors.white,
    flex: 1,
  },
  heroSection: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    minHeight: 200,
  },
  heroContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.95,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  ctaPrimary: {
    backgroundColor: colors.primary,
  },
  ctaButtonPrimaryText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  ctaSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ctaButtonSecondaryText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  ctaTertiary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaButtonTertiaryText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: '47%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
