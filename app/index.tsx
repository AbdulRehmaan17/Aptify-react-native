/**
 * App Startup Flow
 * Handles: Splash -> Onboarding -> Guest Home or Authenticated Tabs
 * 
 * Rules:
 * - App must NOT block unauthenticated users
 * - Graceful loading states (no blank screens)
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme';
import { isOnboardingComplete } from '../src/utils/onboarding';

export default function Index() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const complete = await isOnboardingComplete();
        setOnboardingComplete(complete);
      } catch (error) {
        if (__DEV__) {
          console.error('Error checking onboarding:', error);
        }
        setOnboardingComplete(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, []);

  // Handle splash screen completion
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Navigate based on app state
  useEffect(() => {
    // Wait for all checks to complete
    if (loading || checkingOnboarding || showSplash) return;

    if (__DEV__) {
      console.log('[Index] 🧭 Navigation Check:', { isAuthenticated, onboardingComplete });
    }

    // If authenticated, go to tabs (index is default)
    if (isAuthenticated && user) {
      // FIXING ROUTING INCONSISTENCY: Redirect to root tabs instead of specific dashboard
      // This ensures /(tabs)/index.tsx is mounted correctly
      router.replace('/(tabs)');
      return;
    }

    // If onboarding not complete, show onboarding
    if (!onboardingComplete) {
      router.replace('/onboarding');
      return;
    }

    // Otherwise, go to intro screen (NO BLOCKING)
    router.replace('/(guest)/intro');
  }, [loading, checkingOnboarding, showSplash, isAuthenticated, user, onboardingComplete, router]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} duration={2000} />;
  }

  // Show graceful loading state (no blank screen)
  if (checkingOnboarding || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // This should not render as navigation happens in useEffect
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
