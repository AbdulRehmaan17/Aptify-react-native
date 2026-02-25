# UI Components Guide

## Overview
Clean, exam-safe reusable UI components following strict design rules:
- ✅ Cards only
- ✅ No fancy animations
- ✅ Neutral colors
- ✅ Clear buttons
- ✅ Consistent typography

---

## Components

### 1. Card
**File**: `components/ui/Card.tsx`

**Usage**:
```tsx
import { Card } from '@/components/ui';

<Card>
  <Text variant="title">Card Title</Text>
  <Text variant="body">Card content goes here</Text>
</Card>
```

**Props**:
- `children`: React.ReactNode
- `style?`: ViewStyle (optional)

**Styles**:
- Background: `#fff`
- Border radius: `12`
- Padding: `16`
- Margin bottom: `12`

---

### 2. Button
**File**: `components/ui/Button.tsx`

**Usage**:
```tsx
import { Button } from '@/components/ui';

<Button
  title="Submit"
  onPress={() => {}}
  variant="primary"
/>
```

**Props**:
- `title`: string (required)
- `onPress`: () => void (required)
- `variant?`: 'primary' | 'secondary' | 'outline' (default: 'primary')
- `disabled?`: boolean (default: false)
- `loading?`: boolean (default: false)
- `style?`: ViewStyle (optional)
- `textStyle?`: TextStyle (optional)

**Variants**:
- `primary`: Dark background (#333), white text
- `secondary`: Gray background (#666), white text
- `outline`: Transparent background, border, dark text

---

### 3. Text
**File**: `components/ui/Text.tsx`

**Usage**:
```tsx
import { Text } from '@/components/ui';

<Text variant="title">Title Text</Text>
<Text variant="body">Body text</Text>
<Text variant="muted">Muted text</Text>
```

**Props**:
- `children`: React.ReactNode (required)
- `variant?`: 'title' | 'body' | 'muted' (default: 'body')
- `style?`: TextStyle (optional)
- `numberOfLines?`: number (optional)

**Variants**:
- `title`: 18px, font-weight 600
- `body`: 14px, font-weight 400
- `muted`: 14px, font-weight 400, opacity 0.6

---

### 4. Input
**File**: `components/ui/Input.tsx`

**Usage**:
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
/>
```

**Props**:
- All standard `TextInputProps` are supported
- `label?`: string (optional)
- `error?`: string (optional)
- `containerStyle?`: ViewStyle (optional)

**Styles**:
- Font size: 14px
- Border radius: 8px
- Padding: 12px vertical, 16px horizontal
- Error state: Red border (#FF3B30)

---

### 5. Badge
**File**: `components/ui/Badge.tsx`

**Usage**:
```tsx
import { Badge } from '@/components/ui';

<Badge text="Active" variant="success" />
<Badge text="Pending" variant="warning" />
<Badge text="Error" variant="error" />
```

**Props**:
- `text`: string (required)
- `variant?`: 'default' | 'success' | 'warning' | 'error' (default: 'default')
- `style?`: ViewStyle (optional)

**Variants**:
- `default`: Light gray background
- `success`: Light green background
- `warning`: Light orange background
- `error`: Light red background

---

## Example: Complete Screen

```tsx
import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { Card, Button, Text, Input, Badge } from '@/components/ui';

export default function ExampleScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Card with content */}
        <Card>
          <Text variant="title">Card Title</Text>
          <Text variant="body" style={{ marginTop: 8 }}>
            This is body text inside a card.
          </Text>
          <Text variant="muted" style={{ marginTop: 4 }}>
            This is muted text.
          </Text>
        </Card>

        {/* Input example */}
        <Input
          label="Email"
          placeholder="Enter email"
          keyboardType="email-address"
        />

        {/* Badge example */}
        <Card>
          <Text variant="title">Status</Text>
          <Badge text="Active" variant="success" style={{ marginTop: 8 }} />
        </Card>

        {/* Button example */}
        <Button
          title="Submit"
          onPress={() => {}}
          variant="primary"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Design Rules

### Colors
- **Primary**: `#333` (dark gray)
- **Secondary**: `#666` (medium gray)
- **Background**: `#fff` (white)
- **Border**: `#ddd` (light gray)
- **Text**: `#333` (dark gray)
- **Muted text**: `#333` with `opacity: 0.6`
- **Error**: `#FF3B30` (red)

### Typography
- **Title**: 18px, font-weight 600
- **Body**: 14px, font-weight 400
- **Muted**: 14px, font-weight 400, opacity 0.6

### Spacing
- **Card padding**: 16px
- **Card margin bottom**: 12px
- **Card border radius**: 12px
- **Button padding**: 12px vertical, 24px horizontal
- **Input padding**: 12px vertical, 16px horizontal

### No Animations
- All components are static
- No transitions or animations
- Simple, clean interactions only

---

## Migration Guide

### Replace existing components:

**Before**:
```tsx
<View style={styles.card}>
  <Text style={styles.title}>Title</Text>
</View>
```

**After**:
```tsx
<Card>
  <Text variant="title">Title</Text>
</Card>
```

**Before**:
```tsx
<TouchableOpacity style={styles.button}>
  <Text style={styles.buttonText}>Click</Text>
</TouchableOpacity>
```

**After**:
```tsx
<Button title="Click" onPress={() => {}} />
```

---

## Notes

- All components use neutral colors
- No animations or transitions
- Consistent spacing and typography
- Exam-safe and readable
- Fully typed with TypeScript
