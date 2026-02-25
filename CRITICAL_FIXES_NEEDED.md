# Critical Fixes Needed - Quick Reference

## 🔴 PRIORITY 1 - MUST FIX (App Won't Run)

### 1. Create `.env` File
**Location**: Root directory

**Action**: Copy `.env.example` to `.env` and fill in Firebase credentials

```bash
cp .env.example .env
```

Then edit `.env` with your Firebase config values.

---

### 2. Fix Navigation Conflict

**Problem**: App uses both Expo Router (`useRouter`) and React Navigation

**Files to Fix**:
- `app/(tabs)/home.tsx`
- `app/(tabs)/properties.tsx`
- `app/(tabs)/services.tsx`
- `app/(tabs)/messages.tsx`
- `app/(tabs)/notifications.tsx`
- `app/(tabs)/profile.tsx`

**Replace**:
```tsx
// ❌ REMOVE THIS:
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/path');

// ✅ USE THIS:
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('ScreenName', { params });
```

---

### 3. Create AppStack with All Detail Screens

**File**: `src/navigation/AppStack.tsx` (needs to be created)

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import PropertyDetailScreen from '../../src/screens/PropertyDetailScreen';
import CreatePropertyScreen from '../../app/property/create';
import ServiceProviderDetailScreen from '../../app/services/[id]';
import RequestServiceScreen from '../../app/services/request';
import ChatDetailScreen from '../../app/chat/[id]';
import DashboardScreen from '../../src/screens/DashboardScreen';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="CreateProperty" component={CreatePropertyScreen} />
      <Stack.Screen name="ServiceProviderDetail" component={ServiceProviderDetailScreen} />
      <Stack.Screen name="RequestService" component={RequestServiceScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </Stack.Navigator>
  );
};
```

---

### 4. Update Navigation Types

**File**: `src/navigation/types.ts`

```tsx
import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from './AuthStack';
import { MainTabsParamList } from './MainTabs';

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  PropertyDetail: { id: string };
  CreateProperty: undefined;
  ServiceProviderDetail: { id: string };
  RequestService: { providerId?: string };
  ChatDetail: { id: string; otherUserId?: string; otherUserName?: string };
  AdminDashboard: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

---

### 5. Update RootNavigator to Use AppStack

**File**: `src/navigation/RootNavigator.tsx`

```tsx
import { AppStack } from './AppStack'; // Add this import

export const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppStack} /> // Changed from MainTabs
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};
```

---

## 🔴 PRIORITY 2 - HIGH (App Runs But Broken)

### Fix All Navigation Calls

**Pattern to Find**: `router.push`, `router.replace`, `router.back`

**Files**:
1. `app/(tabs)/home.tsx` - ~10 instances
2. `app/(tabs)/properties.tsx` - ~5 instances
3. `app/(tabs)/services.tsx` - ~3 instances
4. `app/(tabs)/messages.tsx` - ~2 instances
5. `app/(tabs)/notifications.tsx` - ~3 instances

**Common Replacements**:

```tsx
// Tab navigation
router.push('/(tabs)/properties') 
→ navigation.navigate('Dashboard') // or appropriate tab name

// Detail screens
router.push(`/property/${id}`)
→ navigation.navigate('PropertyDetail', { id })

// Create screens
router.push('/property/create')
→ navigation.navigate('CreateProperty')

// Back navigation
router.back()
→ navigation.goBack()

// Replace (after logout)
router.replace('/(auth)/login')
→ // Not needed - RootNavigator handles this
```

---

## ✅ QUICK FIX CHECKLIST

- [ ] Create `.env` file with Firebase config
- [ ] Create `src/navigation/AppStack.tsx`
- [ ] Update `src/navigation/types.ts` with AppStackParamList
- [ ] Update `src/navigation/RootNavigator.tsx` to use AppStack
- [ ] Replace all `router.push()` in `app/(tabs)/home.tsx`
- [ ] Replace all `router.push()` in `app/(tabs)/properties.tsx`
- [ ] Replace all `router.push()` in `app/(tabs)/services.tsx`
- [ ] Replace all `router.push()` in `app/(tabs)/messages.tsx`
- [ ] Replace all `router.push()` in `app/(tabs)/notifications.tsx`
- [ ] Test login flow
- [ ] Test navigation to all screens
- [ ] Test logout flow

---

## 🧪 TESTING COMMANDS

```bash
# Fresh install test
rm -rf node_modules
npm install
npx expo start

# Check for router.push usage
grep -r "router.push" app/
grep -r "router.replace" app/
grep -r "router.back" app/
```

---

## ⚠️ NOTES

1. **Expo Router Files**: The `app/_layout.tsx` and `app/(tabs)/_layout.tsx` files are not used when using React Navigation. They can be removed or left as-is (they won't cause issues).

2. **Entry Point**: The app uses `App.tsx` as entry point (not Expo Router), which is correct.

3. **Navigation**: All navigation should use React Navigation hooks, not Expo Router.

4. **Environment**: The `.env` file is critical - app will crash without it.

---

**Estimated Time**: 4-6 hours for all fixes
