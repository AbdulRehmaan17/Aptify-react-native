# Expo Push Notifications Setup

## Dependencies Required

Install the following packages:

```bash
npm install expo-notifications expo-device
```

## Configuration

### 1. app.json
- ✅ Notification plugin configured
- ✅ iOS background modes enabled
- ✅ Android permissions added

### 2. App.tsx
- ✅ PushNotificationProvider wrapped around app

### 3. Services
- ✅ `pushNotificationService.ts` - Core notification service
- ✅ `PushNotificationContext.tsx` - React context for notifications

## Features Implemented

### ✅ Permission Management
- Request notification permissions
- Check permission status
- Handle permission denial gracefully

### ✅ Token Management
- Generate Expo Push Token
- Save token to Firestore (`users/{userId}/pushTokens/{deviceId}`)
- Auto-register on login
- Clean up on logout

### ✅ Notification Handling
- Foreground notifications (while app is open)
- Background notifications (when app is closed)
- Notification tapped handling
- Deep linking support

### ✅ Test Notifications
- Send test notification locally
- Verify notification system is working

### ✅ Badge Management
- Set badge count (iOS)
- Clear badge count
- Auto-clear on app open

## Usage

### In Components

```typescript
import { usePushNotifications } from '../context/PushNotificationContext';

function MyComponent() {
  const { token, permissionsGranted, requestPermissions, sendTestNotification } = usePushNotifications();
  
  // Request permissions
  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      console.log('Permissions granted!');
    }
  };
  
  // Send test notification
  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };
  
  return (
    <View>
      <Text>Token: {token || 'Not registered'}</Text>
      <Text>Permissions: {permissionsGranted ? 'Granted' : 'Not granted'}</Text>
      <Button onPress={handleRequestPermissions} title="Request Permissions" />
      <Button onPress={handleTestNotification} title="Send Test Notification" />
    </View>
  );
}
```

## Sending Push Notifications from Backend

To send push notifications to users, use Expo's Push Notification API:

```javascript
// Example: Send notification to a user
const pushTokens = await getUserPushTokens(userId);
const messages = pushTokens.map(token => ({
  to: token.token,
  sound: 'default',
  title: 'New Message',
  body: 'You have a new message',
  data: { type: 'message', chatId: '123' },
}));

const response = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(messages),
});
```

## Firestore Structure

```
users/
  {userId}/
    pushTokens/
      {deviceId}/
        token: string
        userId: string
        deviceId: string
        platform: 'ios' | 'android' | 'web'
        createdAt: Timestamp
        updatedAt: Timestamp
```

## Testing

### On Physical Device
1. Request permissions
2. Verify token is generated
3. Check token saved in Firestore
4. Send test notification
5. Test foreground notification
6. Test background notification
7. Test notification tap handling

### Notes
- Push notifications only work on physical devices (not simulators/emulators)
- iOS requires proper APNs certificates for production
- Android requires Firebase Cloud Messaging (FCM) for production
- Development tokens work in Expo Go app

## Next Steps

1. Set up EAS (Expo Application Services) for production builds
2. Configure APNs for iOS production
3. Configure FCM for Android production
4. Implement server-side notification sending
5. Add notification preferences/settings
