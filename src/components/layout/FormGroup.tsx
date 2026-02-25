/**
 * FormGroup Component
 * Container for form inputs with consistent spacing
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme';

export interface FormGroupProps {
  children: ReactNode;
  style?: ViewStyle;
  spacing?: 'sm' | 'md' | 'lg';
}

export function FormGroup({ children, style, spacing: spacingSize = 'md' }: FormGroupProps) {
  const spacingValue = spacingSize === 'sm' ? spacing.sm : spacingSize === 'lg' ? spacing.lg : spacing.md;

  return (
    <View style={[styles.container, { gap: spacingValue }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
