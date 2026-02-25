import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';

interface TextProps {
  children: React.ReactNode;
  variant?: 'title' | 'body' | 'muted';
  style?: TextStyle;
  numberOfLines?: number;
}

/**
 * Text Component
 * Clean typography with exam-safe sizes
 * - Title: 18px
 * - Body: 14px
 * - Muted: 14px with 0.6 opacity
 */
export function Text({ children, variant = 'body', style, numberOfLines }: TextProps) {
  return (
    <RNText
      style={[styles.text, styles[variant], style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
  },
  muted: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.6,
  },
});
