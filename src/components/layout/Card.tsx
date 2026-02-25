/**
 * Card
 * Reusable card component using theme CardStyles
 * - Consistent elevation and rounded corners
 * - Theme-aware colors
 * - Multiple variants (base, elevated, flat, compact, interactive)
 * - Press animations with scale and shadow effects
 */

import React, { ReactNode, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

export type CardVariant = 'base' | 'elevated' | 'flat' | 'compact' | 'interactive';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: boolean;
}

export function Card({
  children,
  variant = 'base',
  onPress,
  style,
  padding = true,
}: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...(padding && { padding: spacing.md }),
    };

    switch (variant) {
      case 'elevated':
        return { ...baseStyle, ...shadows.lg };
      case 'flat':
        return { ...baseStyle, ...shadows.sm };
      case 'compact':
        return { ...baseStyle, padding: spacing.sm, ...shadows.sm };
      case 'interactive':
        return { ...baseStyle, ...shadows.md };
      default:
        return { ...baseStyle, ...shadows.md };
    }
  };

  const containerStyle: ViewStyle = {
    ...getCardStyle(),
    padding: padding ? undefined : 0,
    ...style,
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
    
    Animated.timing(shadowAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
    
    Animated.timing(shadowAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  if (onPress) {
    const shadowOpacity = shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.2],
    });

    const shadowRadius = shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 8],
    });

    const shadowOffsetY = shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 4],
    });

    const elevation = shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 6],
    });

    return (
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Animated.View
          style={[
            containerStyle,
            {
              shadowOpacity,
              shadowRadius,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: shadowOffsetY },
              elevation,
            },
          ]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}>
            {children}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}
