# Firestore Service - Usage Guide

## Overview

Centralized Firestore CRUD service (`src/services/firestore.service.ts`) provides reusable functions for all Firestore operations across the app.

## Functions

### 1. `createDoc(collectionName, data, options?)`

Create a new document in a collection.

**Parameters:**
- `collectionName` (string): Name of the Firestore collection
- `data` (Record<string, any>): Document data (without id, createdAt, updatedAt)
- `options` (optional):
  - `includeTimestamps` (boolean): Add createdAt/updatedAt (default: true)
  - `customId` (string): Use custom document ID instead of auto-generated

**Returns:** Document ID (string)

**Example:**
```typescript
// Create with auto-generated ID
const id = await firestoreService.createDoc('properties', {
  title: 'My Property',
  price: 100000,
  ownerId: user.uid
});

// Create with custom ID
const userId = await firestoreService.createDoc('users', {
  name: 'John Doe',
  email: 'john@example.com'
}, { customId: user.uid });
```

---

### 2. `getDocs(collectionName, queryOptions?)`

Get multiple documents from a collection with optional query constraints.

**Parameters:**
- `collectionName` (string): Name of the Firestore collection
- `queryOptions` (optional):
  - `where`: Array of where clauses
    ```typescript
    { field: string, operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in', value: any }
    ```
  - `orderBy`: Array of orderBy clauses
    ```typescript
    { field: string, direction?: 'asc' | 'desc' }
    ```
  - `limit`: Maximum number of documents to return
  - `startAfter`: QueryDocumentSnapshot for pagination

**Returns:** Array of documents with `id` field

**Example:**
```typescript
// Get all approved properties, ordered by creation date
const properties = await firestoreService.getDocs('properties', {
  where: [
    { field: 'approved', operator: '==', value: true }
  ],
  orderBy: [
    { field: 'createdAt', direction: 'desc' }
  ],
  limit: 10
});

// Get user's notifications
const notifications = await firestoreService.getDocs('notifications', {
  where: [
    { field: 'userId', operator: '==', value: user.uid },
    { field: 'read', operator: '==', value: false }
  ],
  orderBy: [
    { field: 'createdAt', direction: 'desc' }
  ],
  limit: 20
});
```

---

### 3. `getDoc(collectionName, id)`

Get a single document by ID.

**Parameters:**
- `collectionName` (string): Name of the Firestore collection
- `id` (string): Document ID

**Returns:** Document data with `id` field, or `null` if not found

**Example:**
```typescript
// Get a specific property
const property = await firestoreService.getDoc('properties', propertyId);

if (property) {
  console.log(property.title);
} else {
  console.log('Property not found');
}

// Get user data
const userDoc = await firestoreService.getDoc('users', userId);
```

---

### 4. `updateDoc(collectionName, id, data, options?)`

Update a document in a collection.

**Parameters:**
- `collectionName` (string): Name of the Firestore collection
- `id` (string): Document ID
- `data` (Record<string, any>): Partial document data to update
- `options` (optional):
  - `includeTimestamps` (boolean): Add updatedAt timestamp (default: true)

**Returns:** void

**Example:**
```typescript
// Update property
await firestoreService.updateDoc('properties', propertyId, {
  title: 'Updated Title',
  price: 150000
});

// Update notification as read
await firestoreService.updateDoc('notifications', notificationId, {
  read: true
}, { includeTimestamps: false });
```

---

### 5. `deleteDoc(collectionName, id)`

Delete a document from a collection.

**Parameters:**
- `collectionName` (string): Name of the Firestore collection
- `id` (string): Document ID

**Returns:** void

**Example:**
```typescript
// Delete a property
await firestoreService.deleteDoc('properties', propertyId);

// Delete a notification
await firestoreService.deleteDoc('notifications', notificationId);
```

---

### 6. `setDoc(collectionName, id, data, options?)`

Set a document (create or update). Useful when you want to ensure a document exists with specific data.

**Parameters:**
- `collectionName` (string): Name of the Firestore collection
- `id` (string): Document ID
- `data` (Record<string, any>): Document data
- `options` (optional):
  - `merge` (boolean): Merge with existing data (default: false)
  - `includeTimestamps` (boolean): Add timestamps (default: true)

**Returns:** void

**Example:**
```typescript
// Create or update user document
await firestoreService.setDoc('users', userId, {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
}, { merge: true });
```

---

## Example: Replacing Inline Firestore Usage

### Before (Direct Firestore Usage):
```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const userDocRef = doc(db, 'users', userId);
const userDoc = await getDoc(userDocRef);
if (userDoc.exists()) {
  const data = userDoc.data();
  // ... use data
}
```

### After (Using Firestore Service):
```typescript
import { firestoreService } from '../services/firestore.service';

const userDoc = await firestoreService.getDoc('users', userId);
if (userDoc) {
  // ... use userDoc (already includes id and converted timestamps)
}
```

---

## Example: DashboardScreen Implementation

**File:** `src/screens/DashboardScreen.tsx`

**Before:**
```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const userDocRef = doc(db, 'users', user.uid);
const userDoc = await getDoc(userDocRef);
if (userDoc.exists()) {
  const data = userDoc.data();
  // ... process data
}
```

**After:**
```typescript
import { firestoreService } from '../services/firestore.service';

const userDoc = await firestoreService.getDoc<User>('users', user.uid);
if (userDoc) {
  // ... use userDoc directly
  // Timestamps are already converted to Date objects
  // Document ID is already included
}
```

---

## Benefits

1. **Consistency**: All Firestore operations use the same service
2. **Error Handling**: Centralized error handling with user-friendly messages
3. **Type Safety**: TypeScript support with generics
4. **Automatic Timestamps**: Handles createdAt/updatedAt automatically
5. **Date Conversion**: Automatically converts Firestore Timestamps to Date objects
6. **Logging**: Development logging for debugging
7. **Reusability**: Use across all modules without duplicating code

---

## Migration Guide

### Step 1: Replace Imports
```typescript
// Remove
import { doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Add
import { firestoreService } from '../services/firestore.service';
```

### Step 2: Replace Operations

**Create:**
```typescript
// Before
const docRef = await addDoc(collection(db, 'properties'), data);

// After
const id = await firestoreService.createDoc('properties', data);
```

**Read (Single):**
```typescript
// Before
const docRef = doc(db, 'properties', id);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
  const data = docSnap.data();
}

// After
const doc = await firestoreService.getDoc('properties', id);
if (doc) {
  // Use doc directly
}
```

**Read (Multiple):**
```typescript
// Before
const q = query(collection(db, 'properties'), where('approved', '==', true));
const snapshot = await getDocs(q);
const docs = [];
snapshot.forEach((doc) => {
  docs.push({ id: doc.id, ...doc.data() });
});

// After
const docs = await firestoreService.getDocs('properties', {
  where: [{ field: 'approved', operator: '==', value: true }]
});
```

**Update:**
```typescript
// Before
const docRef = doc(db, 'properties', id);
await updateDoc(docRef, { title: 'New Title' });

// After
await firestoreService.updateDoc('properties', id, { title: 'New Title' });
```

**Delete:**
```typescript
// Before
const docRef = doc(db, 'properties', id);
await deleteDoc(docRef);

// After
await firestoreService.deleteDoc('properties', id);
```

---

## Collections Used in App

- `users` - User profiles
- `properties` - Property listings
- `serviceRequests` - Service requests
- `notifications` - User notifications
- `chats` - Chat conversations
- `messages` - Chat messages

---

## Status

✅ **Firestore Service Implemented**

- CRUD functions created
- Query options supported
- Error handling implemented
- Example usage in DashboardScreen
- Ready for migration across all modules
