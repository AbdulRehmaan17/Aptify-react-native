import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../src/theme';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'error';
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}>
      <View style={[styles.iconContainer, variant === 'error' && styles.iconError]}>
        <MaterialIcons
          name={icon}
          size={48}
          color={variant === 'error' ? colors.error : colors.primary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, variant === 'error' && styles.buttonError]}
          onPress={onAction}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.buttonText,
              variant === 'error' && styles.buttonTextError,
            ]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconError: {
    backgroundColor: `${colors.error}15`,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  buttonError: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  buttonTextError: {
    color: colors.white,
  },
});
