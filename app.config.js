require('dotenv').config();

/**
 * Production Environment Validation
 */
function validateEnv() {
  const required = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  const missing = required.filter(key => !process.env[key] || process.env[key].includes('your-') || process.env[key].includes('example'));

  if (missing.length > 0) {
    console.warn('⚠️  Missing or invalid environment variables:', missing.join(', '));
    console.warn('⚠️  App may not function correctly in production without these variables.');
  }
}

// Validate on load
validateEnv();

module.exports = {
  expo: {
    name: 'Aptify',
    slug: 'aptify-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'aptify',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
      dark: {
        backgroundColor: '#000000',
      },
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.aptify.mobile',
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'Aptify needs your location to show nearby properties.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'Aptify needs your location to show nearby properties.',
        NSCameraUsageDescription: 'Aptify needs access to your camera to take photos of properties.',
        NSPhotoLibraryUsageDescription: 'Aptify needs access to your photo library to select property images.',
        NSPhotoLibraryAddUsageDescription: 'Aptify needs access to save photos to your library.',
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
        backgroundColor: '#E6F4FE',
      },
      package: 'com.aptify.mobile',
      versionCode: 1,
      permissions: [
        'RECEIVE_BOOT_COMPLETED',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    extra: {
      // Expose environment variables to the app
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      eas: {
        projectId: '3fec2f63-a057-41b7-973e-94cef3566342',
      },
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID || ''}`,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};
