/**
 * AnimatedPressable
 * TouchableOpacity with subtle scale animation on press
 */

import React, { ReactNode, useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

export interface AnimatedPressableProps extends TouchableOpacityProps {
  children: ReactNode;
  style?: ViewStyle;
  scaleValue?: number;
}

export function AnimatedPressable({ 
  children, 
  style, 
  scaleValue = 0.97,
  onPressIn,
  onPressOut,
  ...props 
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
