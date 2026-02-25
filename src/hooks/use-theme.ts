/**
 * useTheme Hook
 * Provides easy access to the complete design system
 * 
 * Usage:
 * const { colors, spacing, typography, radius, shadows, styles } = useTheme();
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  Spacing,
  Typography,
  Radius,
  Shadows,
  CardStyles,
  ButtonStyles,
  InputStyles,
  ScreenPadding,
  Layout,
  getThemeColors,
  type ColorScheme,
} from '../constants/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const scheme: ColorScheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = getThemeColors(scheme);

  return {
    // Color scheme
    colorScheme: scheme,
    isDark: scheme === 'dark',
    isLight: scheme === 'light',
    
    // Theme values
    colors,
    spacing: Spacing,
    typography: Typography,
    radius: Radius,
    shadows: Shadows,
    
    // Component styles (pre-configured with current colors)
    cardStyles: {
      base: CardStyles.base(colors),
      elevated: CardStyles.elevated(colors),
      flat: CardStyles.flat(colors),
      compact: CardStyles.compact(colors),
      interactive: CardStyles.interactive(colors),
    },
    
    buttonStyles: {
      primary: ButtonStyles.primary(colors),
      primaryText: ButtonStyles.primaryText(colors),
      secondary: ButtonStyles.secondary(colors),
      secondaryText: ButtonStyles.secondaryText(colors),
      outline: ButtonStyles.outline(colors),
      outlineText: ButtonStyles.outlineText(colors),
      ghost: ButtonStyles.ghost(colors),
      ghostText: ButtonStyles.ghostText(colors),
      danger: ButtonStyles.danger(colors),
      dangerText: ButtonStyles.dangerText(colors),
      icon: ButtonStyles.icon(colors),
      small: ButtonStyles.small(colors),
      smallText: ButtonStyles.smallText(colors),
      disabled: ButtonStyles.disabled(colors),
      disabledText: ButtonStyles.disabledText(colors),
    },
    
    inputStyles: {
      base: InputStyles.base(colors),
      baseText: InputStyles.baseText(colors),
      placeholder: InputStyles.placeholder(colors),
      focused: InputStyles.focused(colors),
      error: InputStyles.error(colors),
      errorText: InputStyles.errorText(colors),
      disabled: InputStyles.disabled(colors),
      disabledText: InputStyles.disabledText(colors),
      rounded: InputStyles.rounded(colors),
      label: InputStyles.label(colors),
      helperText: InputStyles.helperText(colors),
    },
    
    // Layout utilities
    screenPadding: ScreenPadding,
    layout: Layout,
  };
};

export default useTheme;
