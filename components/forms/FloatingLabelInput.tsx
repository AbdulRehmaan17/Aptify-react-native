import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../../src/theme';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: any;
}

export function FloatingLabelInput({
  label,
  error,
  value,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const labelOpacity = useSharedValue(value ? 1 : 0.6);

  React.useEffect(() => {
    if (value) {
      labelPosition.value = withTiming(1, { duration: 200 });
      labelOpacity.value = withTiming(1, { duration: 200 });
    } else if (!isFocused) {
      labelPosition.value = withTiming(0, { duration: 200 });
      labelOpacity.value = withTiming(0.6, { duration: 200 });
    }
  }, [value, isFocused]);

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: labelPosition.value * -22,
        scale: isFocused || value ? 0.85 : 1,
      },
    ],
    opacity: labelOpacity.value,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    labelPosition.value = withTiming(1, { duration: 200 });
    labelOpacity.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) {
      labelPosition.value = withTiming(0, { duration: 200 });
      labelOpacity.value = withTiming(0.6, { duration: 200 });
    }
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <Animated.Text
          style={[
            styles.label,
            (isFocused || value) && styles.labelFocused,
            error && styles.labelError,
            animatedLabelStyle,
          ]}>
          {label}
        </Animated.Text>
        <TextInput
          style={styles.input}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="transparent"
          {...props}
        />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    minHeight: 56,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: colors.error,
  },
  label: {
    position: 'absolute',
    left: spacing.base,
    ...typography.body,
    color: colors.textSecondary,
    pointerEvents: 'none',
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.error,
  },
  input: {
    ...typography.body,
    color: colors.text,
    padding: 0,
    marginTop: spacing.xs,
  },
  errorContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
  },
});
