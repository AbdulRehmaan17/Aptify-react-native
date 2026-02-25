/**
 * Aptify Mobile Design System - Shadows
 * Elevated surfaces with consistent shadow system
 * Supports both iOS and Android
 */

import { ViewStyle } from 'react-native';

export type ShadowLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ShadowStyle extends ViewStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const Shadows: Record<ShadowLevel, ShadowStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

/**
 * Shadow utility functions
 */
export const ShadowUtils = {
  /**
   * Get shadow for card (elevated surface)
   */
  card: Shadows.md,
  
  /**
   * Get shadow for button (pressed state)
   */
  button: Shadows.sm,
  
  /**
   * Get shadow for modal/bottom sheet
   */
  modal: Shadows.xl,
  
  /**
   * Get shadow for floating action button
   */
  fab: Shadows.lg,
  
  /**
   * Get shadow with custom color
   */
  withColor: (shadow: ShadowStyle, color: string): ShadowStyle => ({
    ...shadow,
    shadowColor: color,
  }),
  
  /**
   * Get shadow with custom opacity
   */
  withOpacity: (shadow: ShadowStyle, opacity: number): ShadowStyle => ({
    ...shadow,
    shadowOpacity: opacity,
  }),
};
