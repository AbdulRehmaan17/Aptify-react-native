/**
 * Environment Variables Validator
 * Validates all required environment variables for production
 */

interface EnvConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  google: {
    clientId: string;
  };
}

/**
 * Validate all environment variables required for production
 */
export function validateProductionEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = {
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    },
  };

  // Validate Firebase config
  for (const [key, value] of Object.entries(required.firebase)) {
    if (!value || value.trim() === '') {
      errors.push(`Missing EXPO_PUBLIC_FIREBASE_${key.toUpperCase()}`);
    } else if (
      value.includes('your-') ||
      value.includes('example') ||
      value.includes('placeholder') ||
      value === 'undefined'
    ) {
      errors.push(`Invalid placeholder value for EXPO_PUBLIC_FIREBASE_${key.toUpperCase()}`);
    }
  }

  // Validate Google Client ID (optional but recommended)
  if (!required.google.clientId || 
      required.google.clientId.includes('your-') ||
      required.google.clientId.includes('example')) {
    errors.push('EXPO_PUBLIC_GOOGLE_CLIENT_ID is missing or invalid (Google Sign-In will not work)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get validated environment config
 * Throws error if validation fails in production
 */
export function getValidatedEnv(): EnvConfig {
  const validation = validateProductionEnv();
  
  if (!validation.valid) {
    const errorMessage = 
      `Environment validation failed:\n${validation.errors.join('\n')}\n\n` +
      `Please ensure all required environment variables are set correctly.`;
    
    throw new Error(errorMessage);
  }

  return {
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    },
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  };
}
