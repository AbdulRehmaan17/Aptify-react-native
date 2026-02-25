/**
 * Aptify Mobile Design System - Border Radius
 * Consistent rounded corners for modern UI
 */

export const Radius = {
  none: 0,
  xs: 4,      // 4px - Very small radius (badges, chips)
  sm: 8,      // 8px - Small radius (small buttons, inputs)
  md: 12,     // 12px - Medium radius (default for cards, buttons)
  lg: 16,     // 16px - Large radius (large cards, modals)
  xl: 20,     // 20px - Extra large radius (hero sections)
  xxl: 24,    // 24px - Extra extra large (special cards)
  full: 9999, // Full circle (avatars, pills)
  
  // Semantic aliases
  card: 12,        // Default card radius
  button: 12,      // Default button radius
  input: 12,       // Default input radius
  badge: 8,        // Badge/chip radius
  avatar: 9999,    // Avatar radius (full circle)
  modal: 20,       // Modal/bottom sheet radius
} as const;
