/**
 * Button Component
 * Professional button with micro-interactions
 * - Press feedback animations
 * - Multiple variants
 * - Theme-aware styling
 */

import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { ButtonStyles, Typography } from '../../constants/theme';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
    }).start();
  };

  const buttonStyle = variant === 'primary'
    ? ButtonStyles.primary(colors)
    : variant === 'secondary'
    ? ButtonStyles.secondary(colors)
    : variant === 'outline'
    ? ButtonStyles.outline(colors)
    : ButtonStyles.ghost(colors);

  const textStyleFinal = variant === 'primary'
    ? ButtonStyles.primaryText(colors)
    : variant === 'secondary'
    ? ButtonStyles.secondaryText(colors)
    : variant === 'outline'
    ? ButtonStyles.outlineText(colors)
    : ButtonStyles.ghostText(colors);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
      <TouchableOpacity
        style={[buttonStyle, style, disabled && styles.disabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}>
        <Text style={[textStyleFinal, textStyle]}>
          {children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});
