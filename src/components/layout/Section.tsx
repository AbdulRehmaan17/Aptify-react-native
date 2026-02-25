/**
 * Section
 * Consistent section spacing and layout
 * - Standardized margins between sections
 * - Optional title and action button
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface SectionProps {
  children: ReactNode;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  titleStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Section({
  children,
  title,
  actionLabel,
  onAction,
  style,
  titleStyle,
  contentStyle,
}: SectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, style]}>
      {(title || actionLabel) && (
        <View style={[styles.header, titleStyle]}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          {actionLabel && onAction && (
            <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
              <Text style={[styles.action, { color: colors.primary }]}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    fontWeight: '700',
  },
  action: {
    ...Typography.bodyBold,
  },
  content: {
    // Content spacing handled by children
  },
});
