import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';

export default function SettingsScreen() {
  const { user, logout, firebaseUser } = useAuth();
  const router = useRouter();

  // Screen fade-in animation
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const screenSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.sectionCard}>
                <View style={styles.option}>
                  <View style={styles.optionIconContainer}>
                    <MaterialIcons name="email" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Email</Text>
                    <Text style={styles.optionValue} numberOfLines={1}>
                      {firebaseUser?.email || user?.email || 'Not available'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* App Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App</Text>
              <View style={styles.sectionCard}>
                <View style={styles.option}>
                  <View style={styles.optionIconContainer}>
                    <MaterialIcons name="apps" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Version</Text>
                    <Text style={styles.optionValue}>1.0.0</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Logout Section */}
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}>
                <View style={styles.logoutIconContainer}>
                  <MaterialIcons name="logout" size={24} color={colors.white} />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg * 3,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  optionContent: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  optionValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  logoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
