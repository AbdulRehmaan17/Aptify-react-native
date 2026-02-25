/**
 * Animation Utilities
 * Reusable micro-animations for consistent interactions
 */

import { Animated, Easing } from 'react-native';

/**
 * Scale animation for button presses
 */
export const createScaleAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 0.95,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Fade in animation
 */
export const fadeIn = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  });
};

/**
 * Slide up animation
 */
export const slideUp = (value: Animated.Value, distance = 20, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  });
};

/**
 * Stagger animation for lists
 */
export const staggerAnimation = (
  values: Animated.Value[],
  delay = 50,
  duration = 300
) => {
  return Animated.stagger(
    delay,
    values.map((value) =>
      Animated.parallel([
        fadeIn(value, duration),
        slideUp(value, 20, duration),
      ])
    )
  );
};

/**
 * Pulse animation
 */
export const createPulseAnimation = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Shimmer animation for loading states
 */
export const createShimmerAnimation = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  );
};
