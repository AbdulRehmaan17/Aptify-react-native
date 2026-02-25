/**
 * AnimatedScreen
 * Wrapper component for screen content with fade-in animations
 * Provides subtle entrance animations for screen transitions
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

export interface AnimatedScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export function AnimatedScreen({ children, style, delay = 0 }: AnimatedScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}
