import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

/**
 * Badge Component
 * Simple status badge with neutral colors
 */
export function Badge({ text, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#f0f0f0',
  },
  success: {
    backgroundColor: '#e8f5e9',
  },
  warning: {
    backgroundColor: '#fff3e0',
  },
  error: {
    backgroundColor: '#ffebee',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultText: {
    color: '#666',
  },
  successText: {
    color: '#2e7d32',
  },
  warningText: {
    color: '#f57c00',
  },
  errorText: {
    color: '#c62828',
  },
});
