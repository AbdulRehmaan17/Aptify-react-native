# Design System Migration Guide

## Overview

A centralized mobile design system has been created at `src/constants/theme.ts`. This document outlines how to migrate existing code to use the new design system.

## Theme Structure

### Colors
- **Primary**: `#0A7EA4` (teal) - Main brand color
- **Secondary**: `#2EC4B6` (lighter teal) - Accent color
- Full light & dark mode support
- Semantic colors: success, error, warning, info

### Typography
- **Headings**: h1 (32px), h2 (28px), h3 (24px), h4 (20px)
- **Body**: body (16px), bodyBold, bodyLarge (18px)
- **Small**: caption (14px), small (12px)

### Spacing
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 40px, xxxl: 48px

### Radius
- sm: 8px, base: 12px, lg: 16px, xl: 24px, full: 9999

## Usage

### Basic Usage

```typescript
import { Colors, Spacing, Typography, Radius, Shadows } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function MyComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={{ padding: Spacing.md, backgroundColor: colors.background }}>
      <Text style={[Typography.h2, { color: colors.text }]}>Title</Text>
    </View>
  );
}
```

### Using the useTheme Hook (Recommended)

```typescript
import { useTheme } from '@/src/hooks/use-theme';

function MyComponent() {
  const { colors, spacing, typography, buttonStyles } = useTheme();
  
  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.background }}>
      <Text style={[typography.h2, { color: colors.text }]}>Title</Text>
      <TouchableOpacity style={buttonStyles.primary}>
        <Text style={buttonStyles.primaryText}>Button</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Component Styles

#### Cards
```typescript
const { cardStyles } = useTheme();

<View style={cardStyles.base}>...</View>
<View style={cardStyles.elevated}>...</View>
<View style={cardStyles.flat}>...</View>
```

#### Buttons
```typescript
const { buttonStyles } = useTheme();

<TouchableOpacity style={buttonStyles.primary}>
  <Text style={buttonStyles.primaryText}>Primary</Text>
</TouchableOpacity>

<TouchableOpacity style={buttonStyles.outline}>
  <Text style={buttonStyles.outlineText}>Outline</Text>
</TouchableOpacity>
```

#### Inputs
```typescript
const { inputStyles } = useTheme();

<TextInput
  style={inputStyles.base}
  placeholderTextColor={inputStyles.placeholder.color}
/>
```

## Migration Checklist

### Replace Hardcoded Colors
- [ ] Replace `'#FFFFFF'` with `colors.textInverse` or `colors.white`
- [ ] Replace `'#0A7EA4'` with `colors.primary`
- [ ] Replace `'#94A3B8'` with `colors.tabIconDefault` or `colors.textSecondary`
- [ ] Replace `'#000'` with `colors.text` (for dark mode support)
- [ ] Replace `'#fff'` with `colors.textInverse`

### Replace Hardcoded Spacing
- [ ] Replace `padding: 16` with `padding: Spacing.md` or `Spacing.base`
- [ ] Replace `margin: 8` with `margin: Spacing.sm`
- [ ] Use spacing tokens consistently

### Replace Hardcoded Typography
- [ ] Replace `fontSize: 16` with `Typography.body`
- [ ] Replace `fontSize: 24, fontWeight: '600'` with `Typography.h3`
- [ ] Use typography tokens for consistency

### Replace Hardcoded Radius
- [ ] Replace `borderRadius: 12` with `Radius.base`
- [ ] Replace `borderRadius: 9999` with `Radius.full`

### Replace Hardcoded Shadows
- [ ] Replace custom shadow objects with `Shadows.base`, `Shadows.md`, etc.

## Files Updated

### ✅ Completed
- `src/constants/theme.ts` - Complete design system
- `src/hooks/use-theme.ts` - Theme hook
- `app/(tabs)/_layout.tsx` - Tab bar colors
- `app/index.tsx` - Landing screen buttons
- `app/(tabs)/properties.tsx` - Property screen colors

### 🔄 In Progress
- Other tab screens (dashboard, services, messages, profile, etc.)
- Auth screens (login, register, forgot-password)
- Property detail screens
- Service screens
- Admin screens

## Common Patterns

### Dynamic Colors in StyleSheet
Since StyleSheet.create is static, use inline styles for dynamic colors:

```typescript
// ❌ Bad - hardcoded in StyleSheet
const styles = StyleSheet.create({
  text: { color: '#fff' }
});

// ✅ Good - dynamic color
const styles = StyleSheet.create({
  text: {} // Base style only
});

<Text style={[styles.text, { color: colors.textInverse }]}>Text</Text>
```

### Button with Theme
```typescript
const { buttonStyles, colors } = useTheme();

<TouchableOpacity
  style={[buttonStyles.primary, disabled && buttonStyles.disabled]}
  disabled={disabled}>
  <Text style={[
    buttonStyles.primaryText,
    disabled && buttonStyles.disabledText
  ]}>
    Submit
  </Text>
</TouchableOpacity>
```

### Card with Theme
```typescript
const { cardStyles, colors, spacing } = useTheme();

<View style={[cardStyles.base, { marginBottom: spacing.md }]}>
  <Text style={{ color: colors.text }}>Content</Text>
</View>
```

## Benefits

1. **Consistency**: All components use the same design tokens
2. **Dark Mode**: Automatic support via color scheme
3. **Maintainability**: Change colors in one place
4. **Type Safety**: Full TypeScript support
5. **Mobile Optimized**: Touch targets, spacing optimized for mobile

## Next Steps

1. Continue migrating remaining screens
2. Remove old theme files (`constants/colors.ts`, `constants/design.ts`, `constants/ui.ts`)
3. Update all imports to use new theme system
4. Test dark mode across all screens
5. Document component usage patterns
