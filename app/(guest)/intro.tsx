import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  View as GradientView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <GradientView
        style={[styles.gradient, { backgroundColor: colors.primary }]}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>A</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Aptify</Text>
            <Text style={styles.subtitle}>Find. List. Connect.</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => router.replace('/(guest)/home')}
              activeOpacity={0.8}>
              <Text style={styles.buttonPrimaryText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}>
              <Text style={styles.buttonSecondaryText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.lg * 2,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logoText: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.primary,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.lg * 3,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.h3,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonPrimary: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  buttonPrimaryText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.white,
  },
  buttonSecondaryText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
