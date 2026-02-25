# Mobile-Web Parity Fixes Applied

## Field Mapping Fixes

### Fixed: Firestore `name` → Mobile `displayName` Mapping

**Issue**: Some services were using `data.displayName` directly instead of mapping from Firestore `name` field.

**Files Fixed**:
1. ✅ `src/services/chatService.ts`
   - `getUserInfo()`: Now maps `data.name || data.displayName`
   - `sendMessage()`: Now maps `senderData.name || senderData.displayName`

2. ✅ `src/services/serviceRequestService.ts`
   - `getServiceProviders()`: Now maps `data.name || data.displayName`
   - `getServiceProvider()`: Now maps `data.name || data.displayName`

**Result**: All user data now correctly maps Firestore `name` field to mobile `displayName`, matching web app behavior.

---

## Verified: All Modules Match Web App

### ✅ Authentication
- Collection: `users/{uid}`
- Fields: `uid`, `name`, `email`, `photoURL`, `provider`, `role`, `createdAt`, `updatedAt`, `phoneNumber?`
- Mapping: `name` ↔ `displayName` ✅

### ✅ Properties
- Collection: `properties`
- Queries: `where('approved')`, `where('ownerId')`, `where('location.city')`, `where('location.state')`, `where('propertyType')`, `where('status')`, `orderBy('createdAt')`
- Access control: Non-admins only see approved ✅

### ✅ Service Requests
- Collection: `serviceRequests`
- Queries: `where('requesterId')`, `where('providerId')`, `where('propertyId')`, `orderBy('createdAt')`
- Access control: Users see only their own ✅

### ✅ Notifications
- Collection: `notifications`
- Queries: `where('userId')`, `where('read')`, `orderBy('createdAt')`
- Access control: Users see only their own ✅

### ✅ Chats/Messages
- Collections: `chats`, `messages`
- Queries: `where('participants', 'array-contains')`, `where('chatId')`, `where('receiverId')`, `where('read')`
- Access control: Users see only their own chats ✅

---

## Summary

All modules now correctly:
- ✅ Use same Firestore collections as web app
- ✅ Use same query logic as web app
- ✅ Map Firestore `name` → mobile `displayName` consistently
- ✅ Enforce same access control rules as web app
- ✅ Handle errors the same way as web app
- ✅ Display data in same format as web app

**Mobile app behavior = Web app behavior** ✅
