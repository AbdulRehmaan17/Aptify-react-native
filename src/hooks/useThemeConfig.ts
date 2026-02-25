/**
 * useThemeConfig Hook
 * Provides theme colors and configuration
 * Only use this inside React components
 */
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '../theme';
import { getColors } from '../constants/colors';

export const useThemeConfig = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = getColors(colorScheme);
  
  return {
    colorScheme,
    colors: themeColors,
    isDark: colorScheme === 'dark',
  };
};
