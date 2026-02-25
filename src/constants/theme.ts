/**
 * Aptify Mobile Design System - Unified Theme
 * Professional mobile design system matching web app
 * 
 * Features:
 * - Teal/Emerald based palette (matching web)
 * - Soft neutral backgrounds (not pure white)
 * - Modern typography scale for mobile
 * - Consistent spacing system (4px base)
 * - Rounded cards with elevated surfaces
 * - Full light & dark mode support
 * 
 * Usage:
 * import { Colors, Typography, Spacing, Shadows, Radius } from '@/constants/theme';
 * import { useTheme } from '@/hooks/use-theme';
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Colors, type ColorScheme, getColors } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';
import { Shadows, type ShadowLevel } from './shadows';
import { Radius } from './radius';

// Re-export all design tokens
export { Colors, Typography, Spacing, Shadows, Radius };
export type { ColorScheme, ShadowLevel };

// ============================================================================
// BASE COMPONENT STYLES
// ============================================================================

/**
 * Card Styles
 * Rounded cards with elevated surfaces
 */
export const CardStyles = {
  base: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.cardPadding,
    ...Shadows.md,
  }),
  elevated: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.cardElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.cardPadding,
    ...Shadows.lg,
  }),
  flat: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.cardPadding,
  }),
  compact: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.sm,
    ...Shadows.sm,
  }),
  interactive: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.cardPadding,
    ...Shadows.md,
  }),
} as const;

/**
 * Button Styles
 * Mobile-optimized with proper touch targets (min 44x44pt)
 */
export const ButtonStyles = {
  primary: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.buttonPadding,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  }),
  primaryText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textInverse,
    ...Typography.button,
  }),
  
  secondary: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.secondary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.buttonPadding,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  }),
  secondaryText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textInverse,
    ...Typography.button,
  }),
  
  outline: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: 'transparent',
    borderRadius: Radius.button,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: Spacing.buttonPadding,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  outlineText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.primary,
    ...Typography.button,
  }),
  
  ghost: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: 'transparent',
    borderRadius: Radius.button,
    paddingVertical: Spacing.buttonPadding,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  ghostText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.primary,
    ...Typography.button,
  }),
  
  danger: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.error,
    borderRadius: Radius.button,
    paddingVertical: Spacing.buttonPadding,
    paddingHorizontal: Spacing.buttonPaddingHorizontal,
    minHeight: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  }),
  dangerText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textInverse,
    ...Typography.button,
  }),
  
  icon: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.button,
    width: Spacing.touchTarget,
    height: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.xs,
  }),
  
  small: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: Spacing.touchTargetSmall,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  smallText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textInverse,
    ...Typography.buttonSmall,
  }),
  
  disabled: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.border,
    opacity: 0.5,
  }),
  disabledText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textSecondary,
    opacity: 0.6,
  }),
} as const;

/**
 * Input Styles
 * Mobile-optimized input fields
 */
export const InputStyles = {
  base: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.inputPadding,
    paddingHorizontal: Spacing.inputPadding,
    minHeight: Spacing.touchTarget,
  }),
  baseText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.text,
    ...Typography.body,
  }),
  placeholder: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textSecondary,
  }),
  
  focused: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    borderColor: colors.primary,
    borderWidth: 2,
  }),
  
  error: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    borderColor: colors.error,
    borderWidth: 2,
  }),
  errorText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.error,
    ...Typography.caption,
  }),
  
  disabled: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
  }),
  disabledText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textSecondary,
  }),
  
  rounded: (colors: ReturnType<typeof getColors>): ViewStyle => ({
    backgroundColor: colors.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.inputPadding,
    paddingHorizontal: Spacing.lg,
    minHeight: Spacing.touchTarget,
  }),
  
  label: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.text,
    ...Typography.label,
    marginBottom: Spacing.xs,
  }),
  helperText: (colors: ReturnType<typeof getColors>): TextStyle => ({
    color: colors.textSecondary,
    ...Typography.caption,
    marginTop: Spacing.xs,
  }),
} as const;

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

export const ScreenPadding = {
  horizontal: Spacing.screen,
  vertical: Spacing.screenVertical,
  content: Spacing.md,
} as const;

export const Layout = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  column: {
    flexDirection: 'column' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  flex1: {
    flex: 1,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get theme colors for a specific color scheme
 */
export const getThemeColors = (scheme: ColorScheme = 'light') => {
  return getColors(scheme);
};

// Legacy exports for backward compatibility
export const FontSizes = {
  h1: Typography.h1.fontSize,
  h2: Typography.h2.fontSize,
  h3: Typography.h3.fontSize,
  h4: Typography.h4.fontSize,
  body: Typography.body.fontSize,
  caption: Typography.caption.fontSize,
  small: Typography.small.fontSize,
} as const;

// Default export for convenience
export default {
  Colors,
  Typography,
  Spacing,
  Shadows,
  Radius,
  CardStyles,
  ButtonStyles,
  InputStyles,
  ScreenPadding,
  Layout,
  getThemeColors,
};
