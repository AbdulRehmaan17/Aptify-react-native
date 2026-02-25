import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '../../src/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

/**
 * Card Component
 * Production-grade card using design system
 * Uses centralized theme - no hardcoded values
 */
export function Card({ children, style, elevated = false }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card, // 16px radius
    padding: spacing.lg, // 20px padding for professional cards
    ...shadows.md, // Soft elevation shadow
  },
  elevated: {
    ...shadows.lg, // Higher elevation
  },
});
