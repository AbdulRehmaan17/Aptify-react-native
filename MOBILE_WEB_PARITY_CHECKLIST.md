# Mobile App - Web App Parity Checklist

## Overview
This document ensures mobile app behavior matches web app behavior exactly. All Firestore collections, queries, and data structures must align.

---

## 1. Authentication Module

### Firestore Collection
- **Collection**: `users`
- **Document Structure**: `{ uid, name, email, photoURL, provider, role, createdAt, updatedAt, phoneNumber? }`
- **Note**: Web uses `name` field, mobile maps to `displayName`

### Query Logic (Same as Web)
✅ **Register**
- Create Firebase Auth user
- Create Firestore document: `users/{uid}`
- Fields: `uid`, `name` (from displayName), `email`, `photoURL: null`, `provider: 'email'`, `role: 'user'`, `createdAt: serverTimestamp()`
- Store in AsyncStorage for mobile persistence

✅ **Login**
- Sign in with Firebase Auth
- Fetch Firestore document: `users/{uid}`
- Map Firestore `name` → mobile `displayName`
- Store in AsyncStorage

✅ **Google Sign-In**
- Create credential from access token
- Sign in with Firebase Auth
- Create/update Firestore document: `users/{uid}`
- Fields: `provider: 'google'`, preserve existing data on update
- Map Firestore `name` → mobile `displayName`

✅ **Logout**
- Sign out from Firebase Auth
- Clear AsyncStorage
- Navigate to Auth stack

✅ **Update Profile**
- Update Firebase Auth profile (displayName, photoURL)
- Update Firestore: `users/{uid}` with `{ name, photoURL, phoneNumber, updatedAt: serverTimestamp() }`
- Map `displayName` → `name` for Firestore

### Expected UI Output
- Login screen → Register/ForgotPassword
- Register screen → Auto-login after success
- Profile shows: name, email, photo, role badge, provider badge
- Logout button → Returns to Login

### Error Handling
✅ `auth/email-already-in-use` → "This email is already registered"
✅ `auth/user-not-found` → "No account found with this email"
✅ `auth/wrong-password` → "Incorrect password"
✅ `auth/invalid-email` → "Invalid email address"
✅ `auth/weak-password` → "Password is too weak"
✅ `auth/network-request-failed` → "Network error. Check connection"
✅ `auth/invalid-api-key` → "Firebase configuration error"

---

## 2. Dashboard Data Module

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
- Display: name, email, photoURL, role

✅ **Load Summary Stats** (if implemented)
- Properties: `where('ownerId', '==', userId)` from `properties`
- Requests: `where('requesterId', '==', userId)` OR `where('providerId', '==', userId)` from `serviceRequests`
- Messages: `where('participants', 'array-contains', userId)` from `chats`
- Notifications: `where('userId', '==', userId)` AND `where('read', '==', false)` from `notifications`

### Expected UI Output
- User card: Avatar, name, email, role badge
- Summary cards: Properties count, Requests count, Messages count, Notifications count
- Quick actions: Add Property, Request Service
- Pull-to-refresh support

### Error Handling
✅ User not found → Show error banner, allow logout
✅ Network error → Show error banner, allow retry
✅ Loading state → Show spinner

---

## 3. Property Listings Module

### Firestore Collection
- **Collection**: `properties`
- **Document Structure**: `{ id, title, description, price, location: { address, city, state, zipCode }, images, bedrooms?, bathrooms?, area?, propertyType, status, approved, ownerId, createdAt, updatedAt }`

### Query Logic (Same as Web)
✅ **Get All Properties**
- Base query: `collection(db, 'properties')`
- Filter: `where('approved', '==', true)` (non-admins only see approved)
- Filter: `where('status', '==', 'available')` (if filter applied)
- Order: `orderBy('createdAt', 'desc')`
- Additional filters:
  - `where('location.city', '==', city)` (if city filter)
  - `where('location.state', '==', state)` (if state filter)
  - `where('propertyType', '==', type)` (if type filter)
- Price filters: Applied in-memory (minPrice, maxPrice)

✅ **Get Property by ID**
- Query: `getDoc(doc(db, 'properties', id))`
- Access control: Non-admins can only see approved OR their own

✅ **Get Properties by Owner**
- Query: `where('ownerId', '==', ownerId)`, `orderBy('createdAt', 'desc')`
- Access control: Users can only query their own (unless admin)

✅ **Get Pending Properties** (Admin only)
- Query: `where('approved', '==', false)`, `orderBy('createdAt', 'desc')`

✅ **Get Unique Locations**
- Query: `where('approved', '==', true)`, `where('status', '==', 'available')`
- Extract unique cities and states from results

### Expected UI Output
- Property list: Cards with image, price, title, location, bedrooms/bathrooms/area
- Filter chips: Show active filters (min price, max price, city, state)
- Empty state: "No properties available" or "No properties match your filters"
- Loading state: Skeleton cards
- Pull-to-refresh support

### Error Handling
✅ Missing index → Fallback to in-memory filtering
✅ Network error → Show error message, allow retry
✅ No properties → Show empty state with message

---

## 4. Filters Module

### Firestore Queries (Same as Web)
✅ **Price Range**
- Applied in-memory after Firestore query
- Filter: `property.price >= minPrice && property.price <= maxPrice`

✅ **Location Filters**
- City: `where('location.city', '==', city)`
- State: `where('location.state', '==', state)`

✅ **Property Type**
- Filter: `where('propertyType', '==', type)`

✅ **Status**
- Filter: `where('status', '==', status)` (default: 'available')

✅ **Approval Status**
- Non-admins: Always `where('approved', '==', true)`
- Admins: Can see all if `approved` filter not specified

### Expected UI Output
- Filter button with badge (if filters active)
- Filter modal: Price inputs, Location dropdowns, Type chips
- Active filter chips: Show selected filters, allow clear
- Clear all button

### Error Handling
✅ Invalid price range → Validation error
✅ No results → "No properties match your filters" with clear button

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

✅ **Get Requests by Requester**
- Query: `where('requesterId', '==', requesterId)`, `orderBy('createdAt', 'desc')`
- Access control: Users can only see their own (unless admin)

✅ **Get Requests by Provider**
- Query: `where('providerId', '==', providerId)`, `orderBy('createdAt', 'desc')`
- Access control: Providers can only see requests sent to them (unless admin)

✅ **Get Requests by Property**
- Query: `where('propertyId', '==', propertyId)`, `orderBy('createdAt', 'desc')`
- Access control: Only property owner or admin

✅ **Create Service Request**
- Create document: `serviceRequests/{id}`
- Fields: `requesterId` (from auth), `status: 'pending'`, `createdAt: serverTimestamp()`
- Create notification for provider

✅ **Update Request Status**
- Update: `updateDoc(doc(db, 'serviceRequests', id), { status, updatedAt: serverTimestamp() })`
- Access control: Only provider (who can manage) or admin

### Expected UI Output
- Provider list: Cards with avatar, name, role, bio, specialties, rating
- Request list: Cards with title, description, status badge, date, location
- Status badges: pending (yellow), accepted (green), rejected (red), completed (blue), cancelled (gray)
- Empty state: "No service requests" with role-specific message
- Pull-to-refresh support

### Error Handling
✅ Access denied → "Access denied. You can only view your own requests"
✅ Request not found → Show error, navigate back
✅ Network error → Show error message, allow retry
✅ Invalid status → Validation error

---

## 6. Notifications Module

### Firestore Collection
- **Collection**: `notifications`
- **Document Structure**: `{ id, userId, title, body, type, data?, read, createdAt }`

### Query Logic (Same as Web)
✅ **Get User Notifications**
- Query: `where('userId', '==', userId)`, `orderBy('createdAt', 'desc')`, `limit(50)`
- Access control: Users can only see their own

✅ **Get Unread Count**
- Query: `where('userId', '==', userId)`, `where('read', '==', false)`
- Return: `snapshot.size`

✅ **Mark as Read**
- Update: `updateDoc(doc(db, 'notifications', id), { read: true })`
- Access control: Users can only mark their own

✅ **Mark All as Read**
- Query: `where('userId', '==', userId)`, `where('read', '==', false)`
- Batch update: Set `read: true` for all

✅ **Create Notification**
- Create document: `notifications/{id}`
- Fields: `userId`, `title`, `body`, `type`, `data`, `read: false`, `createdAt: serverTimestamp()`

### Expected UI Output
- Notification list: Cards with icon (by type), title, body, timestamp, unread dot
- Unread badge: Red dot on unread notifications
- Empty state: "All caught up!" with message
- Mark all read button (if unread > 0)
- Pull-to-refresh support

### Error Handling
✅ Access denied → "Access denied. You can only view your own notifications"
✅ Network error → Show error message, allow retry
✅ Notification not found → Skip (graceful)

---

## 7. Profile Module

### Firestore Collection
- **Collection**: `users/{uid}`
- **Document Structure**: `{ uid, name, email, photoURL, provider, role, phoneNumber?, createdAt, updatedAt }`

### Query Logic (Same as Web)
✅ **Load Profile**
- Query: `getDoc(doc(db, 'users', userId))`
- Map Firestore `name` → mobile `displayName`
- Display: name, email, photo, phone, role, provider

✅ **Update Profile**
- Update Firebase Auth: `updateProfile(user, { displayName, photoURL })`
- Update Firestore: `setDoc(doc(db, 'users', userId), { name, photoURL, phoneNumber, updatedAt: serverTimestamp() }, { merge: true })`
- Map `displayName` → `name` for Firestore

✅ **Upload Photo**
- Upload to: `storage/profiles/{userId}/{imageName}`
- Get download URL
- Update Firestore `photoURL` field

✅ **Get My Properties** (if shown)
- Query: `where('ownerId', '==', userId)` from `properties`

### Expected UI Output
- Profile header: Avatar (editable), name, email, phone, role badge, provider badge
- Edit button → Opens edit modal
- Menu items: My Properties, Admin Dashboard (if admin), Settings, Logout
- Edit modal: Photo upload, name input, phone input, save/cancel buttons

### Error Handling
✅ Validation error → "Please enter a display name"
✅ Upload error → "Failed to upload profile picture"
✅ Network error → "Failed to update profile"
✅ Access denied → "Access denied" (should not happen for own profile)

---

## 8. Chat/Messages Module

### Firestore Collections
- **Collection**: `chats`
- **Document Structure**: `{ id, participants: [userId1, userId2], lastMessage?, lastMessageTime?, createdAt }`
- **Collection**: `messages`
- **Document Structure**: `{ id, chatId, senderId, receiverId, content, read, timestamp }`

### Query Logic (Same as Web)
✅ **Get User Chats**
- Query: `where('participants', 'array-contains', userId)`, `orderBy('lastMessageTime', 'desc')`
- Access control: Users can only see their own chats

✅ **Get or Create Chat**
- Check existing: `where('participants', 'array-contains', userId1)`
- Filter in memory: Find chat with both participants
- Create if not exists: `addDoc(collection(db, 'chats'), { participants: [userId1, userId2], createdAt: serverTimestamp() })`

✅ **Get Chat Messages**
- Query: `where('chatId', '==', chatId)`, `orderBy('timestamp', 'desc')`, `limit(50)`
- Access control: User must be participant
- Reverse order: Show oldest first

✅ **Send Message**
- Create: `addDoc(collection(db, 'messages'), { chatId, senderId, receiverId, content, read: false, timestamp: serverTimestamp() })`
- Update chat: `updateDoc(doc(db, 'chats', chatId), { lastMessage: {...}, lastMessageTime: serverTimestamp() })`
- Create notification for receiver

✅ **Mark Messages as Read**
- Query: `where('chatId', '==', chatId)`, `where('receiverId', '==', userId)`, `where('read', '==', false)`
- Batch update: Set `read: true`

### Expected UI Output
- Chat list: Avatar, name, last message preview, timestamp, unread badge
- Chat detail: Message bubbles (sent/received), input field, send button
- Empty state: "No messages yet" or "Start the conversation!"
- Real-time updates: Messages appear instantly

### Error Handling
✅ Access denied → "Access denied. You are not a participant"
✅ Chat not found → Show error, navigate back
✅ Network error → Show error message, allow retry
✅ Message send failed → Show error, allow retry

---

## Summary: Firestore Collections Used

| Module | Collection | Key Queries |
|--------|-----------|-------------|
| **Authentication** | `users/{uid}` | `getDoc`, `setDoc` (create/update) |
| **Properties** | `properties` | `where('approved')`, `where('ownerId')`, `where('location.city')`, `where('location.state')`, `where('propertyType')`, `where('status')`, `orderBy('createdAt')` |
| **Service Requests** | `serviceRequests` | `where('requesterId')`, `where('providerId')`, `where('propertyId')`, `orderBy('createdAt')` |
| **Notifications** | `notifications` | `where('userId')`, `where('read')`, `orderBy('createdAt')` |
| **Chats** | `chats` | `where('participants', 'array-contains')`, `orderBy('lastMessageTime')` |
| **Messages** | `messages` | `where('chatId')`, `where('receiverId')`, `where('read')`, `orderBy('timestamp')` |
| **Users** | `users` | `getDoc`, `setDoc` (for providers list) |

## Key Mapping Rules

### Firestore → Mobile App
- Firestore `name` → Mobile `displayName`
- Firestore `users` collection → Mobile User type
- All timestamps: `serverTimestamp()` in Firestore, `.toDate()` when reading

### Access Control (Same as Web)
- Non-admins: Only see approved properties
- Users: Can only access their own data (requests, notifications, chats)
- Owners: Can manage their own properties
- Providers: Can see requests sent to them
- Admins: Can access all data

## Verification Checklist

- [ ] All Firestore collections match web app
- [ ] All query logic matches web app
- [ ] Field mappings are consistent (name ↔ displayName)
- [ ] Access control rules match web app
- [ ] Error handling matches web app
- [ ] UI output matches web app behavior
- [ ] Real-time subscriptions work correctly
- [ ] Data structures match web app exactly

---

**Note**: This checklist ensures mobile app behavior matches web app exactly. No new backend logic should be added. Mobile = Web behavior.
