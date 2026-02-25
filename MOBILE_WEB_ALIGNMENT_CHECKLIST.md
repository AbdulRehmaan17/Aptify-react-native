# Mobile-Web Alignment Checklist

## Overview
This document verifies that each mobile module behaves exactly like the web app, using the same Firestore collections, queries, and operations.

---

## 1. Authentication Module

### Firestore Collection
- **Collection**: `users/{uid}`
- **Document Structure**: `{ uid, name, email, photoURL, provider, role, createdAt, updatedAt, phoneNumber? }`

### Query Logic (Same as Web)
✅ **Register User**
- Operation: `setDoc(doc(db, 'users', uid), { name, email, photoURL, provider: 'email', role: 'user', createdAt: serverTimestamp() })`
- File: `src/services/auth.service.ts` → `register()`
- Status: ✅ **WORKING**

✅ **Login User**
- Operation: `getDoc(doc(db, 'users', uid))` - Fetch user document
- File: `src/services/auth.service.ts` → `login()`
- Status: ✅ **WORKING**

✅ **Google Sign-In**
- Operation: `setDoc(doc(db, 'users', uid), { name, email, photoURL, provider: 'google', role: 'user', createdAt: serverTimestamp() }, { merge: true })`
- File: `src/services/googleAuth.service.ts` → `signInWithGoogle()`
- Status: ✅ **WORKING**

✅ **Update Profile**
- Operation: `setDoc(doc(db, 'users', uid), { name: displayName, photoURL, phoneNumber, updatedAt: serverTimestamp() }, { merge: true })`
- File: `src/services/auth.service.ts` → `updateUserProfile()`
- Status: ✅ **WORKING**

✅ **Delete Account**
- Operation: `deleteDoc(doc(db, 'users', uid))` + Delete all related data
- File: `src/services/auth.service.ts` → `deleteAccount()`
- Status: ✅ **WORKING** (Deletes user + all related data)

### Field Mapping
✅ Firestore `name` → Mobile `displayName` (mapped correctly in all operations)

### Files Updated
- `src/services/auth.service.ts` ✅
- `src/services/googleAuth.service.ts` ✅
- `src/context/AuthContext.tsx` ✅

---

## 2. Dashboard Module

### Firestore Collections Used
- **Collection**: `users/{uid}` - User profile data
- **Collection**: `properties` - Property count (for Owners)
- **Collection**: `serviceRequests` - Request count
- **Collection**: `chats` - Message count
- **Collection**: `notifications` - Notification count

### Query Logic (Same as Web)
✅ **Load User Data**
- Query: `getDoc(doc(db, 'users', userId))`
- Map Firestore `name` → `displayName`
- File: `src/screens/DashboardScreen.tsx` → `loadDashboardData()`
- Status: ✅ **WORKING** (Uses `firestoreService.getDoc()`)

⚠️ **Load Summary Stats**
- Current: Placeholder (returns 0 for all counts)
- Expected: 
  - Properties: `where('ownerId', '==', userId)` from `properties`
  - Requests: `where('requesterId', '==', userId)` OR `where('providerId', '==', userId)` from `serviceRequests`
  - Messages: `where('participants', 'array-contains', userId)` from `chats`
  - Notifications: `where('userId', '==', userId)` AND `where('read', '==', false)` from `notifications`
- File: `src/screens/DashboardScreen.tsx` → `loadSummaryStats()`
- Status: ⚠️ **NEEDS IMPLEMENTATION** (Currently placeholder)

### Files Updated
- `src/screens/DashboardScreen.tsx` ✅ (User data) / ⚠️ (Summary stats - placeholder)

---

## 3. Properties/Listings Module

### Firestore Collection
- **Collection**: `properties`
- **Document Structure**: `{ id, title, description, price, location: { address, city, state, zipCode }, images, bedrooms?, bathrooms?, area?, propertyType, status, approved, ownerId, createdAt, updatedAt }`

### Query Logic (Same as Web)
✅ **Get All Properties**
- Query: `where('approved', '==', true)`, `orderBy('createdAt', 'desc')`
- Non-admins: Always `where('approved', '==', true)`
- Admins: Can see all if `approved` filter not specified
- File: `src/services/propertyService.ts` → `getAllProperties()`
- Status: ✅ **WORKING**

✅ **Get Property by ID**
- Query: `getDoc(doc(db, 'properties', id))`
- Access control: Non-admins can only see approved properties or their own
- File: `src/services/propertyService.ts` → `getPropertyById()`
- Status: ✅ **WORKING**

✅ **Get Properties by Owner**
- Query: `where('ownerId', '==', ownerId)`, `orderBy('createdAt', 'desc')`
- File: `src/services/propertyService.ts` → `getPropertiesByOwner()`
- Status: ✅ **WORKING**

✅ **Create Property**
- Operation: `addDoc(collection(db, 'properties'), { title, description, price, location, images, propertyType, status: 'pending', approved: false, ownerId, createdAt: serverTimestamp() })`
- File: `src/services/propertyService.ts` → `createProperty()`
- Status: ✅ **WORKING**

✅ **Update Property**
- Operation: `updateDoc(doc(db, 'properties', id), { ...updates, updatedAt: serverTimestamp() })`
- Access control: Only owner or admin
- File: `src/services/propertyService.ts` → `updateProperty()`
- Status: ✅ **WORKING**

✅ **Delete Property**
- Operation: `deleteDoc(doc(db, 'properties', id))`
- Access control: Only owner or admin
- File: `src/services/propertyService.ts` → `deleteProperty()`
- Status: ✅ **WORKING**

### Filters (Same as Web)
✅ **Location Filters**
- `where('location.city', '==', city)`
- `where('location.state', '==', state)`
- File: `src/services/propertyService.ts` → `getAllProperties()`
- Status: ✅ **WORKING**

✅ **Property Type Filter**
- `where('propertyType', '==', propertyType)`
- File: `src/services/propertyService.ts` → `getAllProperties()`
- Status: ✅ **WORKING**

✅ **Status Filter**
- `where('status', '==', status)`
- File: `src/services/propertyService.ts` → `getAllProperties()`
- Status: ✅ **WORKING**

✅ **Price Filters**
- Applied in memory: `filter(p => p.price >= minPrice && p.price <= maxPrice)`
- File: `src/services/propertyService.ts` → `getAllProperties()`
- Status: ✅ **WORKING** (In-memory filtering, same as web)

### Files Updated
- `src/services/propertyService.ts` ✅
- `src/screens/PropertyListScreen.tsx` ✅
- `src/screens/PropertyDetailScreen.tsx` ✅
- `src/screens/AddEditPropertyScreen.tsx` ✅

---

## 4. Filters Module

### Firestore Collections Used
- **Collection**: `properties` - For property filters

### Query Logic (Same as Web)
✅ **Property Filters**
- City: `where('location.city', '==', city)`
- State: `where('location.state', '==', state)`
- Property Type: `where('propertyType', '==', propertyType)`
- Status: `where('status', '==', status)`
- Price: In-memory filtering (minPrice, maxPrice)
- File: `src/services/propertyService.ts` → `getAllProperties()`
- Status: ✅ **WORKING**

✅ **Filter UI**
- Filter button with badge (if filters active)
- Active filter chips: Show selected filters, allow clear
- Clear all button
- File: `app/(tabs)/properties.tsx`, `app/(tabs)/services.tsx`
- Status: ✅ **WORKING**

### Files Updated
- `src/services/propertyService.ts` ✅
- `app/(tabs)/properties.tsx` ✅
- `app/(tabs)/services.tsx` ✅

---

## 5. Requests Module

### Firestore Collection
- **Collection**: `serviceRequests`
- **Document Structure**: `{ id, requesterId, providerId, serviceType, propertyId?, title, description, location: { address, city, state, zipCode }, budget?, preferredDate?, status, createdAt, updatedAt }`

### Query Logic (Same as Web)
✅ **Get Service Providers**
- Query: `collection(db, 'users')` - Fetch all, filter by role
- Filter: Role in ['Constructor', 'Renovator']
- Filter by serviceType: 'construction' → 'Constructor', 'renovation' → 'Renovator'
- File: `src/services/serviceRequestService.ts` → `getServiceProviders()`
- Status: ✅ **WORKING**

✅ **Get Service Provider by ID**
- Query: `getDoc(doc(db, 'users', providerId))`
- File: `src/services/serviceRequestService.ts` → `getServiceProvider()`
- Status: ✅ **WORKING**

✅ **Get Requests by Requester**
- Query: `where('requesterId', '==', requesterId)`, `orderBy('createdAt', 'desc')`
- Access control: Users can only see their own (unless admin)
- File: `src/services/serviceRequestService.ts` → `getRequestsByRequester()`
- Status: ✅ **WORKING**

✅ **Get Requests by Provider**
- Query: `where('providerId', '==', providerId)`, `orderBy('createdAt', 'desc')`
- Access control: Providers can only see requests sent to them (unless admin)
- File: `src/services/serviceRequestService.ts` → `getRequestsByProvider()`
- Status: ✅ **WORKING**

✅ **Get Requests by Property**
- Query: `where('propertyId', '==', propertyId)`, `orderBy('createdAt', 'desc')`
- Access control: Only property owner or admin
- File: `src/services/serviceRequestService.ts` → `getRequestsByProperty()`
- Status: ✅ **WORKING**

✅ **Get All Requests (Admin)**
- Query: `orderBy('createdAt', 'desc')`
- Access control: Admin only
- File: `src/services/serviceRequestService.ts` → `getAllRequests()`
- Status: ✅ **WORKING**

✅ **Create Service Request**
- Operation: `addDoc(collection(db, 'serviceRequests'), { requesterId, providerId, serviceType, propertyId?, title, description, location, budget?, preferredDate?, status: 'pending', createdAt: serverTimestamp() })`
- Creates notification for provider
- File: `src/services/serviceRequestService.ts` → `createServiceRequest()`
- Status: ✅ **WORKING**

✅ **Update Request Status**
- Operation: `updateDoc(doc(db, 'serviceRequests', id), { status, updatedAt: serverTimestamp() })`
- Access control: Only provider (who can manage) or admin
- File: `src/services/serviceRequestService.ts` → `updateRequestStatus()`
- Status: ✅ **WORKING**

❌ **Delete Service Request**
- Operation: Not implemented
- Reason: **DISABLED** - Service requests should not be deleted, only cancelled (status: 'cancelled')
- File: N/A
- Status: ✅ **INTENTIONAL** (Use update status to 'cancelled' instead)

### Files Updated
- `src/services/serviceRequestService.ts` ✅
- `src/screens/ServiceRequestListScreen.tsx` ✅
- `src/screens/ServiceRequestDetailScreen.tsx` ✅
- `src/screens/CreateServiceRequestScreen.tsx` ✅

---

## 6. Notifications Module

### Firestore Collection
- **Collection**: `notifications`
- **Document Structure**: `{ id, userId, title, body, type, data, read, createdAt }`

### Query Logic (Same as Web)
✅ **Get User Notifications**
- Query: `where('userId', '==', userId)`, `orderBy('createdAt', 'desc')`, `limit(50)`
- Access control: Users can only see their own
- File: `src/services/notificationService.ts` → `getUserNotifications()`
- Status: ✅ **WORKING**

✅ **Get Unread Count**
- Query: `where('userId', '==', userId)`, `where('read', '==', false)`
- Access control: Users can only see their own count
- File: `src/services/notificationService.ts` → `getUnreadCount()`
- Status: ✅ **WORKING**

✅ **Create Notification**
- Operation: `addDoc(collection(db, 'notifications'), { userId, title, body, type, data, read: false, createdAt: serverTimestamp() })`
- File: `src/services/notificationService.ts` → `createNotification()`
- Status: ✅ **WORKING**

✅ **Mark as Read**
- Operation: `updateDoc(doc(db, 'notifications', id), { read: true })`
- Access control: Users can only mark their own as read
- File: `src/services/notificationService.ts` → `markAsRead()`
- Status: ✅ **WORKING**

✅ **Mark All as Read**
- Operation: Batch update all unread notifications for user
- Access control: Users can only mark their own as read
- File: `src/services/notificationService.ts` → `markAllAsRead()`
- Status: ✅ **WORKING**

❌ **Delete Notification**
- Operation: `updateDoc(doc(db, 'notifications', id), { read: true })` (soft delete)
- Reason: **SOFT DELETE** - Notifications are marked as read instead of deleted (same as web)
- File: `src/services/notificationService.ts` → `deleteNotification()`
- Status: ✅ **INTENTIONAL** (Soft delete by marking as read)

### Real-time Subscriptions
✅ **Subscribe to Notifications**
- Query: `where('userId', '==', userId)`, `orderBy('createdAt', 'desc')`, `limit(50)`
- File: `src/services/notificationService.ts` → `subscribeToUserNotifications()`
- Status: ✅ **WORKING**

✅ **Subscribe to Unread Count**
- Query: `where('userId', '==', userId)`, `where('read', '==', false)`
- File: `src/services/notificationService.ts` → `subscribeToUnreadCount()`
- Status: ✅ **WORKING**

### Files Updated
- `src/services/notificationService.ts` ✅
- `src/screens/NotificationScreen.tsx` ✅

---

## 7. Profile Module

### Firestore Collection
- **Collection**: `users/{uid}`
- **Document Structure**: `{ uid, name, email, photoURL, provider, role, createdAt, updatedAt, phoneNumber? }`

### Query Logic (Same as Web)
✅ **Get User Profile**
- Query: `getDoc(doc(db, 'users', uid))`
- Map Firestore `name` → `displayName`
- File: `src/context/AuthContext.tsx` → `onAuthStateChanged()`
- Status: ✅ **WORKING**

✅ **Update Profile**
- Operation: `setDoc(doc(db, 'users', uid), { name: displayName, photoURL, phoneNumber, updatedAt: serverTimestamp() }, { merge: true })`
- Also updates Firebase Auth profile
- File: `src/services/auth.service.ts` → `updateUserProfile()`
- Status: ✅ **WORKING**

✅ **Upload Profile Picture**
- Operation: Upload to Firebase Storage, then update user document
- File: `src/screens/ProfileScreen.tsx` → `uploadProfilePicture()`
- Status: ✅ **WORKING**

❌ **Delete Profile**
- Operation: `deleteAccount()` - Deletes user + all related data
- Reason: **AVAILABLE** - Full account deletion (deletes user document + all related data)
- File: `src/services/auth.service.ts` → `deleteAccount()`
- Status: ✅ **WORKING** (Full deletion, not just profile)

### Files Updated
- `src/services/auth.service.ts` ✅
- `src/screens/ProfileScreen.tsx` ✅

---

## Summary

### ✅ All Modules Verified

| Module | Collection | READ | CREATE | UPDATE | DELETE | Status |
|--------|-----------|------|--------|--------|--------|--------|
| **Authentication** | `users` | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| **Dashboard** | `users`, `properties`, `serviceRequests`, `chats`, `notifications` | ✅ | N/A | N/A | N/A | ⚠️ Stats placeholder |
| **Properties** | `properties` | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| **Filters** | `properties` | ✅ | N/A | N/A | N/A | ✅ Complete |
| **Requests** | `serviceRequests`, `users` | ✅ | ✅ | ✅ | ❌ Disabled* | ✅ Complete |
| **Notifications** | `notifications` | ✅ | ✅ | ✅ | ❌ Soft delete* | ✅ Complete |
| **Profile** | `users` | ✅ | N/A | ✅ | ✅ | ✅ Complete |

*Delete operations are intentionally disabled/soft-deleted (same as web app behavior)

### Field Mapping
✅ **Firestore `name` → Mobile `displayName`** - Mapped correctly in all modules

### Access Control
✅ **Non-admins**: Only see approved properties
✅ **Users**: Can only access their own data (requests, notifications, chats)
✅ **Owners**: Can manage their own properties
✅ **Providers**: Can see requests sent to them
✅ **Admins**: Can access all data

### Files Updated Per Module

1. **Authentication**: `src/services/auth.service.ts`, `src/services/googleAuth.service.ts`, `src/context/AuthContext.tsx`
2. **Dashboard**: `src/screens/DashboardScreen.tsx` (user data ✅, stats ⚠️)
3. **Properties**: `src/services/propertyService.ts`, `src/screens/PropertyListScreen.tsx`, `src/screens/PropertyDetailScreen.tsx`, `src/screens/AddEditPropertyScreen.tsx`
4. **Filters**: `src/services/propertyService.ts`, `app/(tabs)/properties.tsx`, `app/(tabs)/services.tsx`
5. **Requests**: `src/services/serviceRequestService.ts`, `src/screens/ServiceRequestListScreen.tsx`, `src/screens/ServiceRequestDetailScreen.tsx`, `src/screens/CreateServiceRequestScreen.tsx`
6. **Notifications**: `src/services/notificationService.ts`, `src/screens/NotificationScreen.tsx`
7. **Profile**: `src/services/auth.service.ts`, `src/screens/ProfileScreen.tsx`

---

## Next Steps

1. ⚠️ **Implement Dashboard Summary Stats** - Replace placeholder with actual Firestore queries
2. ✅ All other modules are aligned with web app behavior

---

**Status**: ✅ **Mobile app modules aligned with web app** (except dashboard stats placeholder)
