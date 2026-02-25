/**
 * UI Constants
 * Standardized spacing, typography, and design tokens for consistent UI/UX
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 8,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

export const CardStyles = {
  base: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    ...Shadows.base,
  },
  elevated: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    ...Shadows.md,
  },
  flat: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
  },
  compact: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    ...Shadows.base,
  },
};

export const ButtonStyles = {
  primary: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
    ...Shadows.base,
  },
  secondary: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  rounded: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 40,
  },
  icon: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 44,
    minHeight: 44,
  },
};

export const InputStyles = {
  base: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 48,
  },
  rounded: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 48,
  },
};

// Screen-level spacing constants
export const ScreenPadding = {
  horizontal: Spacing.base,
  vertical: Spacing.base,
  content: Spacing.base,
};

// Card spacing
export const CardSpacing = {
  gap: Spacing.base,
  marginBottom: Spacing.base,
  padding: Spacing.base,
};

// Grid layouts
export const GridLayout = {
  gap: Spacing.base,
  columns: 2,
  itemPadding: Spacing.base,
};





