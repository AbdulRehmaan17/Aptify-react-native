# Firestore Security Rules

## Overview
Production-ready Firestore security rules for the Aptify mobile app. These rules ensure:
- ✅ Only authenticated users can access data
- ✅ Users can only access their own data
- ✅ Admin override for all operations
- ✅ Secure user profile updates
- ✅ Proper field validation
- ✅ Protection against data tampering

## Rules Structure

### Helper Functions
- `isAuthenticated()` - Checks if user is logged in
- `isOwner(userId)` - Checks if user owns the resource
- `getUserData()` - Gets current user's data from Firestore
- `isAdmin()` - Checks if user has admin role
- `hasRole(role)` - Checks if user has specific role

### Collections Protected

#### 1. Users (`/users/{userId}`)
**Rules:**
- ✅ Users can read their own profile
- ✅ Admins can read any profile
- ✅ Users can create their own profile on registration (with validation)
- ✅ Users can update their own profile (restrictions: cannot change uid, email, or escalate to admin)
- ✅ Admins can update any profile (including role changes)
- ✅ Admins can delete user profiles
- ✅ Users cannot delete their own profile via Firestore (must use deleteAccount function)

**Push Tokens Subcollection (`/users/{userId}/pushTokens/{deviceId}`):**
- ✅ Users can manage their own push tokens
- ✅ Admins can access any push tokens

#### 2. Properties (`/properties/{propertyId}`)
**Rules:**
- ✅ Anyone can read approved properties
- ✅ Property owners can read their own (unapproved) properties
- ✅ Admins can read all properties
- ✅ Authenticated users can create properties (must set ownerId to their uid)
- ✅ New properties are created as `approved: false` (pending admin approval)
- ✅ Property owners can update their own properties (cannot change ownerId or approval status)
- ✅ Admins can update any property (including approval status)
- ✅ Property owners and admins can delete

#### 3. Service Requests (`/serviceRequests/{requestId}`)
**Rules:**
- ✅ Requesters can read their own requests
- ✅ Providers can read requests assigned to them
- ✅ Property owners can read requests for their properties
- ✅ Admins can read all requests
- ✅ Authenticated users can create requests (must set requesterId to their uid)
- ✅ Requesters can fully update their own requests
- ✅ Providers can only update status of assigned requests
- ✅ Admins can update any request
- ✅ Requesters and admins can delete

#### 4. Notifications (`/notifications/{notificationId}`)
**Rules:**
- ✅ Users can only read their own notifications
- ✅ Admins can read all notifications
- ✅ Authenticated users can create notifications (server-side validation recommended)
- ✅ Users can only update their own notifications (mainly read status)
- ✅ Admins can update any notification
- ✅ Users can delete their own notifications
- ✅ Admins can delete any notification

#### 5. Chats (`/chats/{chatId}`)
**Rules:**
- ✅ Only participants can read their chats
- ✅ Admins can read all chats
- ✅ Authenticated users can create chats (must include themselves in participants)
- ✅ Participants can update chats (cannot change participants)
- ✅ Participants can delete chats
- ✅ Admins can manage any chat

#### 6. Messages (`/messages/{messageId}`)
**Rules:**
- ✅ Senders and receivers can read messages
- ✅ Chat participants can read messages in their chats
- ✅ Admins can read all messages
- ✅ Users can create messages (must be sender, must be in chat)
- ✅ Receivers can update read status
- ✅ Senders can update their own messages
- ✅ Admins can update any message
- ✅ Senders and admins can delete

## Security Features

### 1. Authentication Required
All operations (except reading approved properties) require authentication.

### 2. Ownership Validation
- Users can only access resources they own
- Field-level validation ensures users cannot change ownership fields

### 3. Admin Override
- Admins can read/write/delete any document
- Admin role is checked from user document in Firestore

### 4. Field Validation
- Required fields are validated on create
- Immutable fields (uid, ownerId, etc.) are protected on update
- Enum values are validated (status, role, etc.)

### 5. Role Protection
- Users cannot escalate themselves to admin
- Only existing admins can assign admin role
- Default roles are validated

### 6. Data Integrity
- Cannot change ownership fields
- Cannot remove required fields
- Timestamps and IDs are validated

## Deployment

### Using Firebase Console
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the contents of `firestore.rules`
3. Paste into the rules editor
4. Click "Publish"

### Using Firebase CLI
```bash
firebase deploy --only firestore:rules
```

### Testing Rules
Use Firebase Console → Firestore Database → Rules → Rules Playground to test:

**Test Cases:**
1. User reading own profile ✅
2. User reading other user's profile ❌
3. Admin reading any profile ✅
4. User creating property with own ownerId ✅
5. User creating property with different ownerId ❌
6. Property owner updating approval status ❌
7. Admin updating approval status ✅
8. User reading own notifications ✅
9. User reading other user's notifications ❌
10. Chat participant reading chat ✅
11. Non-participant reading chat ❌

## Important Notes

1. **User Profile Deletion**: Users cannot delete their own profiles via Firestore rules. Use the `deleteAccount` function in `authService.ts` which handles Firebase Auth deletion and all Firestore cleanup.

2. **Notification Creation**: While rules allow authenticated users to create notifications, it's recommended to create notifications server-side (via Cloud Functions) to prevent abuse.

3. **Admin Role Assignment**: Only existing admins can assign admin roles. Users cannot escalate themselves.

4. **Approval Workflow**: New properties start as `approved: false`. Only admins can approve them via the admin dashboard.

5. **Index Requirements**: Some queries may require composite indexes. Create them as needed:
   - `notifications`: userId + createdAt
   - `properties`: approved + createdAt
   - `serviceRequests`: requesterId + createdAt
   - `serviceRequests`: providerId + createdAt

## Maintenance

### Adding New Collections
1. Add match block for new collection
2. Define read/write rules with ownership checks
3. Add admin override
4. Test rules in Rules Playground
5. Update this documentation

### Updating Existing Rules
1. Test changes in Rules Playground first
2. Deploy to staging/test project
3. Verify all operations work correctly
4. Deploy to production
5. Monitor for rule violations in Firebase Console

## Monitoring

Check rule violations in Firebase Console:
- Firestore Database → Usage → Rules tab
- Monitor for denied reads/writes
- Review security incidents

## Best Practices

1. ✅ Always validate required fields
2. ✅ Protect immutable fields (IDs, ownership)
3. ✅ Validate enum values
4. ✅ Use admin override sparingly (only when necessary)
5. ✅ Test rules before deploying
6. ✅ Monitor rule violations
7. ✅ Document any rule changes
8. ✅ Use server-side validation for sensitive operations when possible
