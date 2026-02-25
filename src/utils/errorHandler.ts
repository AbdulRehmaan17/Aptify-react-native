/**
 * Global Error Handler
 * Centralizes error handling, mapping, and reporting
 */

import { FirebaseError } from 'firebase/app';
import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  originalError?: any;
  severity: 'error' | 'warning' | 'info';
  category: 'auth' | 'network' | 'firestore' | 'storage' | 'unknown';
}

/**
 * Map Firebase error codes to user-friendly messages
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/email-already-in-use': 'An account with this email already exists. Please use a different email.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please register first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/requires-recent-login': 'For security, please log out and log back in to continue.',
  'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email. Please sign in with your original method.',
  'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
  'auth/invalid-api-key': 'Configuration error. Please restart the app.',
  'auth/quota-exceeded': 'Service temporarily unavailable. Please try again later.',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  'auth/app-deleted': 'The app instance has been deleted. Please restart the app.',
  'auth/invalid-user-token': 'Your session has expired. Please log in again.',
  'auth/user-token-expired': 'Your session has expired. Please log in again.',
  
  // Firestore errors
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested item was not found.',
  'already-exists': 'This item already exists.',
  'failed-precondition': 'This operation cannot be completed in the current state.',
  'aborted': 'The operation was aborted. Please try again.',
  'out-of-range': 'The operation was out of range.',
  'unimplemented': 'This feature is not yet implemented.',
  'internal': 'An internal error occurred. Please try again later.',
  'unavailable': 'Service is currently unavailable. Please try again later.',
  'deadline-exceeded': 'The operation timed out. Please try again.',
  'cancelled': 'The operation was cancelled.',
  'unauthenticated': 'Please log in to continue.',
  'resource-exhausted': 'Service quota exceeded. Please try again later.',
  'data-loss': 'Data loss occurred. Please try again.',
  
  // Storage errors
  'storage/unauthorized': 'You do not have permission to access this file.',
  'storage/canceled': 'Upload was cancelled.',
  'storage/unknown': 'An unknown error occurred with file storage.',
  'storage/invalid-checksum': 'File upload failed. Please try again.',
  'storage/invalid-format': 'Invalid file format.',
  'storage/invalid-event-name': 'Invalid event name.',
  'storage/invalid-url': 'Invalid file URL.',
  'storage/invalid-argument': 'Invalid argument provided.',
  'storage/no-default-bucket': 'Storage bucket not configured.',
  'storage/cannot-slice-blob': 'Cannot slice file. Please try a different file.',
  'storage/server-file-wrong-size': 'File size mismatch. Please try again.',
  'storage/quota-exceeded': 'Storage quota exceeded.',
  'storage/unauthenticated': 'Please log in to upload files.',
};

/**
 * Network error detection
 */
function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('internet') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('timeout') ||
    errorCode === 'network-request-failed' ||
    errorCode === 'auth/network-request-failed' ||
    error?.networkError ||
    error?.status === 0 ||
    error?.statusCode === 0
  );
}

/**
 * Parse Firebase error
 */
function parseFirebaseError(error: any): AppError {
  if (!error) {
    return {
      code: 'unknown',
      message: 'An unknown error occurred.',
      severity: 'error',
      category: 'unknown',
    };
  }

  // Check if it's a Firebase error
  if (error.code || (error as FirebaseError).code) {
    const code = error.code || (error as FirebaseError).code;
    const category = code.startsWith('auth/') ? 'auth' : code.startsWith('storage/') ? 'storage' : 'firestore';
    
    return {
      code,
      message: FIREBASE_ERROR_MESSAGES[code] || error.message || 'An error occurred. Please try again.',
      originalError: error,
      severity: 'error',
      category,
    };
  }

  // Check if it's a network error
  if (isNetworkError(error)) {
    return {
      code: 'network-error',
      message: 'Network error. Please check your internet connection and try again.',
      originalError: error,
      severity: 'error',
      category: 'network',
    };
  }

  // Generic error
  return {
    code: error.code || 'unknown',
    message: error.message || 'An error occurred. Please try again.',
    originalError: error,
    severity: 'error',
    category: 'unknown',
  };
}

/**
 * Handle error and return user-friendly message
 */
export function handleError(error: any, options?: {
  showAlert?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}): AppError {
  const { showAlert = false, logError = true, fallbackMessage } = options || {};
  
  const appError = parseFirebaseError(error);

  // Override message if fallback provided
  if (fallbackMessage) {
    appError.message = fallbackMessage;
  }

  // Log error in development
  if (logError && __DEV__) {
    console.error('[ErrorHandler] ❌ Error:', {
      code: appError.code,
      message: appError.message,
      category: appError.category,
      originalError: appError.originalError,
    });
  }

  // Show alert if requested
  if (showAlert) {
    Alert.alert('Error', appError.message, [{ text: 'OK' }]);
  }

  return appError;
}

/**
 * Handle error with alert
 */
export function handleErrorWithAlert(error: any, fallbackMessage?: string): AppError {
  return handleError(error, { showAlert: true, logError: true, fallbackMessage });
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any, fallbackMessage?: string): string {
  const appError = handleError(error, { showAlert: false, logError: false, fallbackMessage });
  return appError.message;
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  const appError = parseFirebaseError(error);
  
  // Network errors are usually recoverable
  if (appError.category === 'network') {
    return true;
  }

  // Some Firebase errors are recoverable
  const recoverableCodes = [
    'auth/network-request-failed',
    'auth/too-many-requests',
    'deadline-exceeded',
    'unavailable',
    'cancelled',
  ];

  return recoverableCodes.includes(appError.code);
}

/**
 * Error logging service (can be extended to send to analytics/crash reporting)
 */
export function logError(error: AppError, context?: Record<string, any>): void {
  if (__DEV__) {
    console.error('[ErrorLogger]', {
      ...error,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // In production, send to crash reporting service (e.g., Sentry, Crashlytics)
  // Example:
  // if (!__DEV__) {
  //   Sentry.captureException(error.originalError || new Error(error.message), {
  //     tags: { category: error.category, code: error.code },
  //     extra: context,
  //   });
  // }
}
