import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { authService } from '../services/auth.service';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators';
import { RegisterForm, UserRole } from '../types';
import { requestGoogleAuthWithCode } from '../utils/googleAuth';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Buyer');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [displayNameError, setDisplayNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate name
    if (!validateRequired(displayName)) {
      setDisplayNameError('Name is required');
      isValid = false;
    } else {
      setDisplayNameError('');
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setPasswordError(passwordValidation.message || 'Invalid password');
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (__DEV__) {
      console.log('[RegisterScreen] 📝 Registration attempt started');
    }

    // Clear previous errors
    setDisplayNameError('');
    setEmailError('');
    setPasswordError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const formData: RegisterForm = {
        email: email.trim(),
        password: password,
        confirmPassword: password, // For compatibility with RegisterForm type
        displayName: displayName.trim(),
        role: role,
      };

      // Call register from authService
      const user = await authService.register(formData);

      if (__DEV__) {
        console.log('[RegisterScreen] ✅ Registration successful:', user.email);
      }

      // The AuthContext's onAuthStateChanged listener will automatically
      // detect the auth state change and update the user state,
      // which will trigger RootNavigator to switch to AppStack
      // Navigation is handled automatically by RootNavigator based on auth state
    } catch (error: any) {
      if (__DEV__) {
        console.error('[RegisterScreen] ❌ Registration failed:', error.message);
      }

      // Show user-friendly error message
      let errorMessage = error.message || 'Registration failed. Please try again.';

      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or sign in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      if (__DEV__) {
        console.log('[RegisterScreen] 🔐 Google Sign-In attempt started');
      }

      // Check if Google Client ID is configured
      // Validate Google auth configuration
      if (!isGoogleAuthConfigured()) {
        Alert.alert(
          'Google Sign-In Not Configured',
          getGoogleAuthConfigError() ||
          'Google Sign-In is not set up yet.\n\n' +
          'To enable Google Sign-In:\n' +
          '1. Create a .env file in the project root\n' +
          '2. Add the required EXPO_PUBLIC_GOOGLE_* client IDs for your platform\n' +
          '3. Get your Client IDs from Google Cloud Console\n' +
          '4. Restart your Expo development server\n\n' +
          'See GOOGLE_AUTH_SETUP.md for detailed instructions.',
          [{ text: 'OK' }]
        );
        setGoogleLoading(false);
        return;
      }

      // Request Google OAuth idToken via expo-auth-session
      const tokens = await requestGoogleAuthWithCode();
      
      // Handle user cancellation or missing tokens
      if (!tokens || !tokens.idToken) {
        if (__DEV__) {
          console.log('[RegisterScreen] ⚠️ Google Sign-In cancelled or failed to get tokens');
        }
        // Don't show error if user cancelled
        return;
      }

      // Authenticate with Firebase using Google idToken
      // authService.signInWithGoogle will create Firestore document if first login
      const user = await authService.signInWithGoogle(tokens.idToken);
      
      if (__DEV__) {
        console.log('[RegisterScreen] ✅ Google Sign-In successful:', user.email);
      }

      // The AuthContext's onAuthStateChanged listener will automatically
      // detect the auth state change and update the user state,
      // which will trigger RootNavigator to switch to AppStack
      // Navigation is handled automatically by RootNavigator based on auth state
    } catch (error: any) {
      if (__DEV__) {
        console.error('[RegisterScreen] ❌ Google Sign-In failed:', error.message);
      }
      
      // Show user-friendly error message
      let errorMessage = error.message || 'An error occurred during Google sign-in. Please try again.';
      
      // Provide helpful guidance for common errors
      if (errorMessage.includes('Client ID') || errorMessage.includes('not configured')) {
        errorMessage = 
          'Google Sign-In is not configured.\n\n' +
          'To enable Google Sign-In:\n' +
          '1. Create a .env file in the project root\n' +
          '2. Add: EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id\n' +
          '3. Get your Client ID from Google Cloud Console → APIs & Services → Credentials\n' +
          '4. Restart your Expo development server\n\n' +
          'See GOOGLE_AUTH_SETUP.md for detailed instructions.';
      }
      
      Alert.alert('Google Sign-In Failed', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.card}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign up to get started
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (displayNameError) setDisplayNameError('');
              }}
              mode="outlined"
              autoCapitalize="words"
              error={!!displayNameError}
              disabled={loading}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            {displayNameError ? (
              <Text variant="bodySmall" style={styles.errorText}>
                {displayNameError}
              </Text>
            ) : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!emailError}
              disabled={loading}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            {emailError ? (
              <Text variant="bodySmall" style={styles.errorText}>
                {emailError}
              </Text>
            ) : null}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              error={!!passwordError}
              disabled={loading}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {passwordError ? (
              <Text variant="bodySmall" style={styles.errorText}>
                {passwordError}
              </Text>
            ) : null}

            <View style={styles.roleContainer}>
              <Text variant="bodyLarge" style={styles.roleLabel}>
                I am a:
              </Text>
              <SegmentedButtons
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                buttons={[
                  {
                    value: 'Buyer',
                    label: 'Tenant',
                    icon: 'home',
                  },
                  {
                    value: 'Owner',
                    label: 'Owner',
                    icon: 'key',
                  },
                ]}
                style={styles.roleButtons}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading || googleLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text variant="bodySmall" style={styles.dividerText}>
                OR
              </Text>
              <View style={styles.divider} />
            </View>

            <Button
              mode="outlined"
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading || googleLoading}
              icon="google"
              style={styles.googleButton}
              contentStyle={styles.buttonContent}
            >
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium">Already have an account? </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                disabled={loading || googleLoading}
                compact
              >
                Sign In
              </Button>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 8,
    marginLeft: 12,
  },
  roleContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  roleLabel: {
    marginBottom: 12,
    fontWeight: '500',
  },
  roleButtons: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.6,
  },
  googleButton: {
    marginTop: 8,
    marginBottom: 8,
  },
});

