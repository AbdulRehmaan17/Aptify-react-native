/**
 * Tab Bar Constants
 * Floating tab bar configuration and utilities
 */

import { Dimensions } from 'react-native';
import { Spacing } from './theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export const TAB_BAR_CONFIG = {
  MARGIN: Spacing.md, // 16px margin from screen edges
  BASE_HEIGHT: 64, // Base height for better touch targets
  PADDING_TOP: Spacing.sm, // 8px top padding
} as const;

/**
 * Calculate total tab bar height including safe area
 */
export const getTabBarHeight = (insetsBottom: number): number => {
  const paddingBottom = Math.max(insetsBottom, Spacing.md);
  return TAB_BAR_CONFIG.BASE_HEIGHT + TAB_BAR_CONFIG.PADDING_TOP + paddingBottom;
};

/**
 * Calculate bottom padding needed for screens to account for floating tab bar
 * Tab bar height + margin + extra spacing for content
 */
export const getTabBarBottomPadding = (insetsBottom: number): number => {
  const tabBarHeight = getTabBarHeight(insetsBottom);
  return tabBarHeight + TAB_BAR_CONFIG.MARGIN + Spacing.lg; // ~104-120px depending on device
};

/**
 * Get floating tab bar width
 */
export const getTabBarWidth = (): number => {
  return width - (TAB_BAR_CONFIG.MARGIN * 2);
};
