# Navigation Setup - React Navigation

## Structure

Simple, exam-safe navigation system with React Navigation.

```
/navigation
  ├── RootNavigator.tsx    # Root stack - switches Auth/App
  ├── AuthStack.tsx         # Auth screens (Login, Register, ForgotPassword)
  ├── MainTabs.tsx          # Bottom tabs (Dashboard, Requests, Profile)
  └── types.ts              # TypeScript types
```

## Navigation Flow

### Unauthenticated
```
RootNavigator
  └── AuthStack
      ├── Login
      ├── Register
      └── ForgotPassword
```

### Authenticated
```
RootNavigator
  └── MainTabs (Bottom Tabs)
      ├── Dashboard
      ├── Requests
      └── Profile
```

## Files

### RootNavigator.tsx
- One root stack navigator
- Switches between Auth and App based on authentication
- Shows SplashScreen while loading
- No conditional chaos - simple ternary

### AuthStack.tsx
- Stack navigator for authentication screens
- Login → Register → ForgotPassword
- Minimal config - headerShown: false

### MainTabs.tsx
- Bottom tab navigator
- Three tabs only: Dashboard, Requests, Profile
- Uses MaterialIcons for tab icons
- Themed with app colors

### types.ts
- TypeScript type definitions
- Global navigation type declarations
- Clean param lists

## Entry Point

`App.tsx` - Minimal setup:
- NavigationContainer wrapper
- RootNavigator component
- All providers (Auth, Theme, etc.)

## Usage

### Navigate from Auth to App
```typescript
// After successful login, AuthContext updates isAuthenticated
// RootNavigator automatically switches to App stack
```

### Navigate within Tabs
```typescript
// Use React Navigation hooks
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('Dashboard');
navigation.navigate('Requests');
navigation.navigate('Profile');
```

### Navigate to Auth
```typescript
// On logout, AuthContext updates isAuthenticated to false
// RootNavigator automatically switches to Auth stack
```

## Rules Followed

✅ One root stack  
✅ One bottom tab navigator  
✅ Three tabs only (Dashboard, Requests, Profile)  
✅ Auth screens → AuthStack  
✅ App screens → MainTabs  
✅ No deep nesting  
✅ No conditional chaos  
✅ Minimal config only  

## Notes

- All navigation is type-safe with TypeScript
- No Expo Router dependencies in navigation logic
- Clean separation of concerns
- Easy to understand and maintain
- Exam-safe structure
