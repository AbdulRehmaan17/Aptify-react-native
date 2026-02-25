import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  delay?: number;
}

/**
 * Animated Card Component
 * Provides smooth fade-in and scale animations for cards
 */
export function AnimatedCard({ children, style, onPress, disabled = false, delay = 0 }: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.card, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Base card styles
  },
});





