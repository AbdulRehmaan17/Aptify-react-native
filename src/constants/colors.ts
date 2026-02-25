/**
 * Aptify Mobile Design System - Colors
 * Teal/Emerald based palette matching web app
 * Soft neutral backgrounds (not pure white)
 * Full light & dark mode support
 */

export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    // Text Colors
    text: '#0F172A',           // Slate-900 - Primary text
    textSecondary: '#64748B',  // Slate-500 - Secondary text
    textTertiary: '#94A3B8',   // Slate-400 - Tertiary text
    textInverse: '#FFFFFF',     // White - Text on colored backgrounds
    textMuted: '#94A3B8',      // Slate-400 - Muted text
    
    // Background Colors (Soft neutrals, not pure white)
    background: '#F8FAFC',      // Slate-50 - Main background (soft neutral)
    backgroundSecondary: '#F1F5F9', // Slate-100 - Secondary background
    backgroundTertiary: '#E2E8F0',  // Slate-200 - Tertiary background
    card: '#FFFFFF',            // White - Card background (elevated)
    cardSecondary: '#F8FAFC',   // Slate-50 - Secondary card background
    cardElevated: '#FFFFFF',    // White - Elevated card background
    
    // Brand Colors - Teal/Emerald Based
    primary: '#0FA4A9',        // Primary teal (main brand) - #0FA4A9
    primaryLight: '#14B8BE',    // Light teal (hover/active)
    primaryDark: '#0C8A8E',     // Dark teal (pressed)
    primarySubtle: '#E0F7F8',   // Very light teal (backgrounds)
    
    secondary: '#2EC4B6',      // Emerald/teal accent
    secondaryLight: '#4FD4C6', // Light emerald
    secondaryDark: '#1FA89A',  // Dark emerald
    secondarySubtle: '#E0F7F5', // Very light emerald (backgrounds)
    
    // Semantic Colors
    success: '#10B981',        // Emerald-500 - Success
    successLight: '#34D399',   // Emerald-400 - Light success
    successDark: '#059669',     // Emerald-600 - Dark success
    successSubtle: '#D1FAE5',   // Emerald-100 - Success background
    
    error: '#EF4444',          // Red-500 - Error
    errorLight: '#F87171',    // Red-400 - Light error
    errorDark: '#DC2626',      // Red-600 - Dark error
    errorSubtle: '#FEE2E2',   // Red-100 - Error background
    
    warning: '#F59E0B',        // Amber-500 - Warning
    warningLight: '#FBBF24',   // Amber-400 - Light warning
    warningDark: '#D97706',    // Amber-600 - Dark warning
    warningSubtle: '#FEF3C7',  // Amber-100 - Warning background
    
    info: '#3B82F6',           // Blue-500 - Info
    infoLight: '#60A5FA',      // Blue-400 - Light info
    infoDark: '#2563EB',       // Blue-600 - Dark info
    infoSubtle: '#DBEAFE',     // Blue-100 - Info background
    
    // UI Element Colors
    border: '#E2E8F0',         // Slate-200 - Border color
    borderLight: '#F1F5F9',    // Slate-100 - Light border
    borderDark: '#CBD5E1',     // Slate-300 - Dark border
    divider: '#E2E8F0',        // Slate-200 - Divider color
    
    icon: '#64748B',           // Slate-500 - Default icon
    iconSecondary: '#94A3B8',  // Slate-400 - Secondary icon
    iconTertiary: '#CBD5E1',  // Slate-300 - Tertiary icon
    
    // Tab Bar Colors
    tabIconDefault: '#94A3B8', // Slate-400 - Inactive tab
    tabIconSelected: '#0FA4A9', // Primary - Active tab
    
    // Overlay Colors
    overlay: 'rgba(15, 23, 42, 0.5)',      // Modal overlay
    overlayLight: 'rgba(15, 23, 42, 0.1)', // Light overlay
    overlayDark: 'rgba(15, 23, 42, 0.7)',  // Dark overlay
    
    // Special Colors
    shadow: 'rgba(15, 23, 42, 0.08)',      // Shadow color
    shadowDark: 'rgba(15, 23, 42, 0.15)', // Dark shadow
    
    // Legacy Aliases (for backward compatibility)
    tint: '#0FA4A9',
    white: '#FFFFFF',
  },
  dark: {
    // Text Colors
    text: '#F1F5F9',           // Slate-100 - Primary text
    textSecondary: '#94A3B8',   // Slate-400 - Secondary text
    textTertiary: '#64748B',    // Slate-500 - Tertiary text
    textInverse: '#0F172A',     // Slate-900 - Text on colored backgrounds
    textMuted: '#64748B',       // Slate-500 - Muted text
    
    // Background Colors
    background: '#0F172A',      // Slate-900 - Main background
    backgroundSecondary: '#1E293B', // Slate-800 - Secondary background
    backgroundTertiary: '#334155',   // Slate-700 - Tertiary background
    card: '#1E293B',            // Slate-800 - Card background
    cardSecondary: '#334155',   // Slate-700 - Secondary card
    cardElevated: '#334155',    // Slate-700 - Elevated card
    
    // Brand Colors - Lighter for dark mode visibility
    primary: '#14B8BE',         // Teal-400 - Primary (lighter for dark mode)
    primaryLight: '#2EC4C9',    // Teal-300 - Light primary
    primaryDark: '#0C8A8E',     // Teal-500 - Dark primary
    primarySubtle: '#1E3A3A',  // Dark teal (backgrounds)
    
    secondary: '#0FA4A9',      // Teal-500 - Secondary (darker for contrast)
    secondaryLight: '#14B8BE',  // Teal-400 - Light secondary
    secondaryDark: '#0C8A8E',   // Teal-600 - Dark secondary
    secondarySubtle: '#1A2E3A', // Dark teal (backgrounds)
    
    // Semantic Colors
    success: '#10B981',         // Emerald-500 - Success
    successLight: '#34D399',   // Emerald-400 - Light success
    successDark: '#059669',     // Emerald-600 - Dark success
    successSubtle: '#064E3B',   // Emerald-900 - Success background
    
    error: '#EF4444',          // Red-500 - Error
    errorLight: '#F87171',     // Red-400 - Light error
    errorDark: '#DC2626',      // Red-600 - Dark error
    errorSubtle: '#7F1D1D',    // Red-900 - Error background
    
    warning: '#F59E0B',        // Amber-500 - Warning
    warningLight: '#FBBF24',   // Amber-400 - Light warning
    warningDark: '#D97706',    // Amber-600 - Dark warning
    warningSubtle: '#78350F',  // Amber-900 - Warning background
    
    info: '#3B82F6',           // Blue-500 - Info
    infoLight: '#60A5FA',       // Blue-400 - Light info
    infoDark: '#2563EB',        // Blue-600 - Dark info
    infoSubtle: '#1E3A8A',     // Blue-900 - Info background
    
    // UI Element Colors
    border: '#334155',         // Slate-700 - Border color
    borderLight: '#475569',    // Slate-600 - Light border
    borderDark: '#1E293B',      // Slate-800 - Dark border
    divider: '#334155',         // Slate-700 - Divider color
    
    icon: '#94A3B8',           // Slate-400 - Default icon
    iconSecondary: '#64748B',  // Slate-500 - Secondary icon
    iconTertiary: '#475569',   // Slate-600 - Tertiary icon
    
    // Tab Bar Colors
    tabIconDefault: '#64748B', // Slate-500 - Inactive tab
    tabIconSelected: '#14B8BE', // Teal-400 - Active tab
    
    // Overlay Colors
    overlay: 'rgba(0, 0, 0, 0.7)',      // Modal overlay
    overlayLight: 'rgba(0, 0, 0, 0.3)', // Light overlay
    overlayDark: 'rgba(0, 0, 0, 0.85)',  // Dark overlay
    
    // Special Colors
    shadow: 'rgba(0, 0, 0, 0.3)',       // Shadow color
    shadowDark: 'rgba(0, 0, 0, 0.5)',   // Dark shadow
    
    // Legacy Aliases (for backward compatibility)
    tint: '#14B8BE',
    white: '#FFFFFF',
  },
} as const;

/**
 * Get colors for a specific color scheme
 */
export const getColors = (scheme: ColorScheme = 'light') => {
  return Colors[scheme];
};
