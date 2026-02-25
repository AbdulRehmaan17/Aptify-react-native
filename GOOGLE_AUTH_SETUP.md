# Google Authentication Setup Guide

This guide explains how to set up Google Sign-In for the Aptify Mobile App.

## Prerequisites

- Firebase project with Authentication enabled
- Google Cloud Console account
- Expo development environment

## Step 1: Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable** to ON
6. Enter your **Web client ID** (from Google Cloud Console - see Step 2)
7. Click **Save**

## Step 2: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application** as the application type
6. Configure OAuth consent screen if prompted:
   - User Type: External (for testing) or Internal (for organization)
   - App name: Aptify
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
7. Add **Authorized redirect URIs**:
   - For Expo Go: `https://auth.expo.io/@your-username/aptify-mobile`
   - For production: `aptify://auth` (matches app.json scheme)
8. Click **Create**
9. **Copy the Client ID** (you'll need this for Step 3)

## Step 3: Environment Variables

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add the following line:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
   ```
3. Replace `your-client-id-here` with the Client ID from Step 2
4. **Important**: Restart your Expo development server after adding the environment variable

## Step 4: Verify app.json Configuration

Ensure your `app.json` has the correct scheme:
```json
{
  "expo": {
    "scheme": "aptify"
  }
}
```

This scheme is used for OAuth redirects.

## Step 5: Test Google Sign-In

1. Start your Expo development server
2. Open the app in Expo Go
3. Navigate to Login or Register screen
4. Click "Continue with Google"
5. Select your Google account
6. Grant permissions
7. You should be redirected back to the app and logged in

## Troubleshooting

### Error: "Google Client ID is not configured"
- Ensure `.env` file exists in project root
- Verify `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Restart Expo development server
- Clear Expo cache: `expo start -c`

### Error: "Invalid redirect URI"
- Verify redirect URI in Google Cloud Console matches:
  - Expo Go: `https://auth.expo.io/@your-username/aptify-mobile`
  - Production: `aptify://auth`
- Check `app.json` scheme matches redirect URI scheme

### Error: "Google provider not enabled"
- Go to Firebase Console → Authentication → Sign-in method
- Enable Google provider
- Add Web client ID from Google Cloud Console

### OAuth popup closes immediately
- Check internet connection
- Verify Google Client ID is correct
- Check browser console for errors (if testing on web)

## Production Deployment

For production builds:

1. Update authorized redirect URIs in Google Cloud Console:
   - Add your production app's redirect URI
   - Format: `your-app-scheme://auth`

2. Update environment variables in your build system:
   - Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in your CI/CD pipeline
   - Or use Expo's environment variable system

3. Test on a production build before release

## Security Notes

- Never commit `.env` file to version control
- Use different OAuth Client IDs for development and production
- Regularly rotate OAuth credentials
- Monitor Firebase Authentication logs for suspicious activity

## Support

If you encounter issues:
1. Check Firebase Authentication logs
2. Check Google Cloud Console → APIs & Services → OAuth consent screen
3. Verify all redirect URIs are correctly configured
4. Ensure Firebase project has Google provider enabled





