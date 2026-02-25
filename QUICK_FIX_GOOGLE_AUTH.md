# Quick Fix: Google Sign-In Error

## The Error You're Seeing

```
ERROR [LoginScreen] ❌ Google Sign-In failed: Google Client ID is not configured.
```

## This is Expected Behavior

This error appears because Google Sign-In is not yet configured. The app will show you a friendly alert dialog with setup instructions.

## Quick Solution

### Option 1: Set Up Google Sign-In (Recommended for Full Features)

1. **Create `.env` file** in project root (same folder as `package.json`)

2. **Add your Google Client ID:**
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id-here
   ```

3. **Get your Client ID:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: **APIs & Services** → **Credentials**
   - Create or find your **OAuth 2.0 Client ID** (Web application type)
   - Copy the Client ID

4. **Restart Expo:**
   - Stop your dev server (Ctrl+C)
   - Run `npm start` or `expo start` again

5. **See detailed setup:** Check `GOOGLE_AUTH_SETUP.md`

### Option 2: Disable Google Sign-In (Use Email/Password Only)

If you don't want to set up Google Sign-In right now:

- The app works perfectly with **Email/Password** authentication
- Google Sign-In button will show a helpful message if clicked
- You can set it up later when needed

## Why You See the Console Error

The console error is **intentional** for debugging. The app also shows a **user-friendly alert** with setup instructions when you click the Google Sign-In button.

## Verification

After adding the Client ID and restarting:

1. Click "Continue with Google" button
2. You should see Google's OAuth screen (not an error)
3. Sign in with your Google account
4. You'll be redirected back to the app, logged in

## Still Having Issues?

1. **Verify `.env` file exists** in project root
2. **Check variable name** is exactly: `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
3. **Restart Expo** after creating/updating `.env`
4. **Clear cache:** `expo start -c`
5. **Check `GOOGLE_AUTH_SETUP.md`** for complete setup guide

## Note

- The console error is **normal** and helps with debugging
- The app shows a **friendly alert** to users
- Email/Password authentication works **without** Google setup
- Google Sign-In is **optional** but recommended for better UX





