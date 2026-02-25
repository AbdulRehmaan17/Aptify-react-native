import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/**
 * Google OAuth Authentication Utility
 * 
 * Uses expo-auth-session/providers/google for Google Sign-In
 * Supports Expo Go, Android, iOS, and Web
 * 
 * SETUP REQUIRED:
 * 
 * 1. GOOGLE CLOUD CONSOLE:
 *    - Create OAuth 2.0 Client IDs for:
 *      - Web application (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
 *      - Android (EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)
 *      - iOS (EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
 *      - Expo Go (EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID - same as Web)
 * 
 * 2. FIREBASE CONSOLE:
 *    - Enable Google provider
 *    - Add Web OAuth Client ID
 * 
 * 3. ENVIRONMENT VARIABLES (.env):
 *    - EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-expo-client-id
 *    - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
 *    - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
 *    - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
 */

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

// Get appropriate client ID based on platform and app ownership
const getClientId = (): string => {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    return process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  }

  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  }

  // Web or fallback
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
};

// Validate Google Client ID configuration
export const isGoogleAuthConfigured = (): boolean => {
  const clientId = getClientId();
  return !!(
    clientId &&
    clientId.trim() !== '' &&
    !clientId.includes('your-') &&
    !clientId.includes('example')
  );
};

// Get user-friendly error message if Google Auth is not configured
export const getGoogleAuthConfigError = (): string | null => {
  if (isGoogleAuthConfigured()) {
    return null;
  }

  const platform = Platform.OS;
  const isExpoGo = Constants.appOwnership === 'expo';
  const requiredVar = isExpoGo
    ? 'EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID'
    : platform === 'android'
      ? 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
      : platform === 'ios'
        ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
        : 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID';

  return (
    `Google Sign-In is not configured for ${platform}${isExpoGo ? ' (Expo Go)' : ''}.\n\n` +
    `To enable Google Sign-In:\n` +
    `1. Create a .env file in the project root\n` +
    `2. Add: ${requiredVar}=your-client-id\n` +
    `3. Get your Client ID from Google Cloud Console → APIs & Services → Credentials\n` +
    `4. Create OAuth 2.0 Client ID for ${platform === 'web' ? 'Web' : platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : 'Expo'}\n` +
    `5. Restart your Expo development server\n\n` +
    `See .env.example for reference.`
  );
};

/**
 * Request Google OAuth tokens using expo-auth-session/providers/google
 * 
 * This function:
 * 1. Uses expo-auth-session/providers/google (recommended for Expo)
 * 2. Handles redirect URI automatically for Expo Go, Android, iOS, and Web
 * 3. Returns idToken for Firebase authentication
 * 
 * @returns {Promise<{idToken: string} | null>} idToken or null if cancelled
 */
/**
 * @deprecated Use src/hooks/useGoogleAuth.ts instead
 * This utility now only provides configuration validation.
 */
export async function requestGoogleAuthWithCode(): Promise<{ idToken: string } | null> {
  console.warn('requestGoogleAuthWithCode is deprecated. Use useGoogleAuth hook.');
  return null;
}

