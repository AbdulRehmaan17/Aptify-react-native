# Firebase Configuration - Web SDK Only

## Overview
Clean Firebase Web SDK configuration aligned with existing web Firebase config. Uses pure Web SDK - no native Firebase dependencies.

## File: `src/config/firebase.ts`

### Features
✅ **Firebase Web SDK only** - Compatible with Expo  
✅ **getApps().length guard** - Prevents duplicate initialization  
✅ **Single auth instance** - `getAuth(app)` called once  
✅ **Firestore initialized once** - `getFirestore(app)` called once  
✅ **Storage initialized once** - `getStorage(app)` called once  
✅ **No duplication** - All services import from this file  
✅ **No environment guessing** - Uses `process.env` directly  

### Code Structure
```typescript
// 1. Firebase config from environment variables
const firebaseConfig = { ... };

// 2. Initialize app with guard
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 3. Initialize services once
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## Usage

All services import from this centralized config:

```typescript
// ✅ Correct - Import from config
import { auth, db, storage } from '../config/firebase';

// ❌ Wrong - Don't initialize inline
import { initializeApp } from 'firebase/app';
```

## Services Using Centralized Config

All services already use the centralized config:
- ✅ `src/services/authService.ts` - imports `auth, db`
- ✅ `src/services/propertyService.ts` - imports `db, storage`
- ✅ `src/services/chatService.ts` - imports `db`
- ✅ `src/services/notificationService.ts` - imports `db`
- ✅ `src/services/serviceRequestService.ts` - imports `db`
- ✅ `src/context/AuthContext.tsx` - imports `auth, db`
- ✅ `src/screens/DashboardScreen.tsx` - imports `db`
- ✅ `src/screens/ProfileScreen.tsx` - imports `storage`

## Environment Variables

Required environment variables (from `.env`):
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

## Rules Followed

✅ **No native Firebase** - Pure Web SDK  
✅ **No duplication** - Single source of truth  
✅ **No environment guessing** - Direct `process.env` usage  
✅ **Single instances** - Auth, Firestore, Storage initialized once  
✅ **Guard pattern** - `getApps().length` check prevents duplicates  

## Benefits

1. **Consistency** - All services use same Firebase instances
2. **Performance** - No duplicate initializations
3. **Maintainability** - Single config file to manage
4. **Compatibility** - Web SDK works across all platforms
5. **Simplicity** - Clean, minimal code
