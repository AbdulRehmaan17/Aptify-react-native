/**
 * Divider
 * Consistent divider component
 * - Theme-aware colors
 * - Horizontal and vertical variants
 * - Customizable spacing
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface DividerProps {
  vertical?: boolean;
  spacing?: number;
  style?: ViewStyle;
  color?: string;
}

export function Divider({
  vertical = false,
  spacing = Spacing.md,
  style,
  color,
}: DividerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const dividerColor = color || colors.divider;

  if (vertical) {
    return (
      <View
        style={[
          styles.vertical,
          { backgroundColor: dividerColor, marginHorizontal: spacing },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        { backgroundColor: dividerColor, marginVertical: spacing },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
