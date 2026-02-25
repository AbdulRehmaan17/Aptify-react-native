/**
 * Aptify Mobile Design System - Spacing
 * Consistent spacing system based on 4px base unit
 * Mobile-optimized for touch targets and readability
 */

export const Spacing = {
  // Base scale (4px increments)
  xs: 4,      // 4px - Tight spacing (icons, badges, compact elements)
  sm: 8,      // 8px - Small spacing (compact padding, gaps)
  md: 16,     // 16px - Medium spacing (default padding, standard gaps)
  lg: 24,     // 24px - Large spacing (sections, card padding)
  xl: 32,     // 32px - Extra large (major sections, screen padding)
  xxl: 40,    // 40px - Extra extra large (hero sections)
  xxxl: 48,   // 48px - Maximum spacing (landing sections)
  
  // Semantic aliases for common use cases
  base: 16,           // Default spacing (alias for md)
  section: 24,        // Section spacing (alias for lg)
  screen: 16,         // Screen horizontal padding (alias for md)
  screenVertical: 24, // Screen vertical padding (alias for lg)
  
  // Component-specific spacing
  cardPadding: 16,     // Card internal padding
  cardGap: 12,        // Gap between cards
  inputPadding: 16,   // Input field padding
  buttonPadding: 16,  // Button padding (vertical)
  buttonPaddingHorizontal: 24, // Button padding (horizontal)
  
  // Touch target sizes (minimum 44x44pt for accessibility)
  touchTarget: 44,    // Minimum touch target size
  touchTargetSmall: 36, // Small touch target (icons)
  
  // Layout spacing
  headerHeight: 56,   // Standard header height
  tabBarHeight: 56,   // Tab bar height
  bottomSheetHandle: 4, // Bottom sheet handle height
} as const;

/**
 * Spacing utility functions
 */
export const SpacingUtils = {
  /**
   * Get horizontal padding for screen
   */
  screenHorizontal: Spacing.screen,
  
  /**
   * Get vertical padding for screen
   */
  screenVertical: Spacing.screenVertical,
  
  /**
   * Get padding for card
   */
  card: Spacing.cardPadding,
  
  /**
   * Get gap between list items
   */
  listGap: Spacing.md,
  
  /**
   * Get section spacing
   */
  section: Spacing.section,
};
