/**
 * Splash Screen Component
 * Professional Aptify branded splash screen with smooth animations
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  duration = 2000 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const iconRotate = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations for professional feel
    Animated.sequence([
      // Logo appears with scale and fade
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Subtle icon rotation
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-finish after duration
    const timer = setTimeout(() => {
      // Fade out animation before finishing
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background gradient effect */}
      <View style={[styles.backgroundCircle, { backgroundColor: `${colors.primary}08` }]} />
      <View style={[styles.backgroundCircle2, { backgroundColor: `${colors.secondary}05` }]} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}>
        {/* Icon with rotation */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${colors.primary}15`,
              transform: [{ rotate: iconRotation }],
            },
          ]}>
          <MaterialIcons name="home" size={64} color={colors.primary} />
        </Animated.View>
        
        {/* App Name */}
        <Text style={[styles.appName, { color: colors.primary }]}>Aptify</Text>
        
        {/* Tagline */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your trusted platform for property discovery
          </Text>
        </Animated.View>
      </Animated.View>
      
      {/* Loading indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={[styles.loadingDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.loadingDot, styles.loadingDotDelayed, { backgroundColor: colors.secondary }]} />
        <View style={[styles.loadingDot, styles.loadingDotDelayed2, { backgroundColor: colors.primary }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    top: -width * 0.5,
    right: -width * 0.3,
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    bottom: -width * 0.4,
    left: -width * 0.2,
    opacity: 0.2,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: Spacing.md,
  },
  tagline: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    fontSize: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: Spacing.xxxl * 2,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  loadingDotDelayed: {
    // Animation handled by opacity
  },
  loadingDotDelayed2: {
    // Animation handled by opacity
  },
});
