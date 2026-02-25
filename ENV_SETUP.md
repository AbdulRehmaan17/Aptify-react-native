# Environment Variables Setup

This guide explains how to set up environment variables for the Aptify Mobile App.

## Quick Setup

1. **Create a `.env` file** in the project root directory (same level as `package.json`)

2. **Add the following variables:**

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google OAuth Configuration (Optional - only needed for Google Sign-In)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

3. **Replace placeholder values** with your actual credentials

4. **Restart your Expo development server** after creating/updating `.env`

## Getting Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → **Web** (</> icon)
6. Copy the config values from the Firebase SDK snippet

## Getting Your Google Client ID (Optional)

Google Sign-In is optional. If you want to enable it:

1. See `GOOGLE_AUTH_SETUP.md` for detailed instructions
2. Get your Web OAuth Client ID from Google Cloud Console
3. Add it to `.env` as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

**Note:** If Google Client ID is not set, the Google Sign-In button will show a helpful error message when clicked.

## Important Notes

- ✅ The `.env` file is already in `.gitignore` - it won't be committed to version control
- ✅ Never commit your `.env` file with real credentials
- ✅ Restart Expo dev server after changing `.env` values
- ✅ All environment variables must start with `EXPO_PUBLIC_` to be accessible in the app

## Troubleshooting

### "Google Client ID is not configured" Error

This error appears when:
- `.env` file doesn't exist
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is not set in `.env`
- Expo dev server wasn't restarted after adding the variable

**Solution:**
1. Create `.env` file in project root
2. Add `EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id`
3. Restart Expo: Stop the server (Ctrl+C) and run `npm start` again

### Firebase Config Errors

If you see Firebase initialization errors:
1. Verify all Firebase variables are set in `.env`
2. Check that values match your Firebase project settings
3. Ensure variable names start with `EXPO_PUBLIC_`
4. Restart Expo dev server

## Example .env File

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyExample123456789
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=aptify-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=aptify-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=aptify-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Google OAuth (Optional)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```





