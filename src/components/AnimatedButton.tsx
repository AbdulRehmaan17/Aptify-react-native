/**
 * Animated Button Component
 * Button with micro-animations for better UX
 */

import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Animated, Text } from 'react-native';
import { ButtonStyles, Typography } from '../constants/theme';
import { Colors } from '../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AnimatedButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scale = useRef(new Animated.Value(1)).current;

  const animatedStyle = {
    transform: [{ scale }],
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 10,
      stiffness: 200,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 200,
    }).start();
  };

  const handlePress = () => {
    // Haptic feedback animation
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        damping: 8,
        stiffness: 300,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 300,
      }),
    ]).start();

    if (!disabled) {
      onPress();
    }
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
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[buttonStyle, style, disabled && styles.disabled]}
        onPress={handlePress}
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
});
