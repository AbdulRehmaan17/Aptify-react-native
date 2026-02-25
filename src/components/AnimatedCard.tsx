/**
 * AnimatedCard
 * Card component with subtle slide-up and fade-in animations
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

export interface AnimatedCardProps extends Omit<TouchableOpacityProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle;
  delay?: number;
  index?: number;
}

export function AnimatedCard({ children, style, delay = 0, index = 0, ...props }: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animationDelay = delay + (index * 50); // Stagger animations for lists
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, index]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}>
      <TouchableOpacity {...props} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
