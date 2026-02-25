import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Surface,
  Text,
  TextInput
} from 'react-native-paper';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { AuthStackParamList } from '../navigation/types';
import { authService } from '../services/auth.service';
import { LoginForm } from '../types';
import { validateEmail, validatePassword } from '../utils/validators';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { request, signInWithGoogle, loading: authLoading } = useGoogleAuth();

  const validateForm = (): boolean => {
    let isValid = true;

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

  const handleLogin = async () => {
    if (__DEV__) {
      console.log('[LoginScreen] 🔐 Login attempt started');
    }

    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const formData: LoginForm = {
        email: email.trim(),
        password: password,
      };

      // Call login from authService
      const user = await authService.login(formData);

      if (__DEV__) {
        console.log('[LoginScreen] ✅ Login successful:', user.email);
      }

      // The AuthContext's onAuthStateChanged listener will automatically
      // detect the auth state change and update the user state,
      // which will trigger RootNavigator to switch to AppStack
      // Navigation is handled automatically by RootNavigator based on auth state
    } catch (error: any) {
      if (__DEV__) {
        console.error('[LoginScreen] ❌ Login failed:', error.message);
      }

      // Show user-friendly error message
      let errorMessage = error.message || 'Login failed. Please try again.';

      // Handle specific error cases
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      if (__DEV__) {
        console.log('[LoginScreen] 🔐 Google Sign-In attempt started');
      }

      // Check if Google auth request is ready
      if (!request) {
        Alert.alert(
          'Google Sign-In Not Ready',
          'Google Sign-In is not ready yet. Please wait a moment and try again.',
          [{ text: 'OK' }]
        );
        setGoogleLoading(false);
        return;
      }

      // Sign in with Google using the hook (triggers promptAsync)
      // The actual sign-in happens in the useEffect of useGoogleAuth
      const result = await signInWithGoogle();

      if (result.type !== 'success') {
        // If cancelled or failed at the browser level
        setGoogleLoading(false);
        return;
      }

      if (__DEV__) {
        console.log('[LoginScreen] ✅ Google Sign-In initiated, waiting for response...');
      }

      // We rely on authLoading from the hook to keep the UI in loading state
      // until the auth state changes and navigation happens
    } catch (error: any) {
      if (__DEV__) {
        console.error('[LoginScreen] ❌ Google Sign-In failed:', error.message);
      }

      setGoogleLoading(false);

      // key-value pair for error code checks if object
      const errorCode = error?.code || error?.message || 'unknown';

      // Don't show error if user cancelled
      if (errorCode === 'ERR_CANCELED' || String(errorCode).includes('cancelled')) {
        return;
      }

      Alert.alert('Google Sign-In Failed', 'Please try again.');
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
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to continue
          </Text>

          <View style={styles.form}>
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

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading || googleLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
              disabled={loading || googleLoading || !request}
              icon="google"
              style={styles.googleButton}
              contentStyle={styles.buttonContent}
            >
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading || googleLoading}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>

            <View style={styles.registerContainer}>
              <Text variant="bodyMedium">Don't have an account? </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
                compact
              >
                Sign Up
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
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  forgotButton: {
    marginTop: 8,
  },
  registerContainer: {
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

