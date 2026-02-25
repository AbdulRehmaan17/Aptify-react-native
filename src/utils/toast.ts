import { Platform, ToastAndroid, Alert } from 'react-native';

/**
 * Lightweight, cross-platform toast helpers.
 * - Android: native Toast
 * - iOS: falls back to a small Alert (no raw error details)
 */

export const showSuccessToast = (message: string) => {
  if (!message) return;

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Success', message);
  }
};

export const showInfoToast = (message: string) => {
  if (!message) return;

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Info', message);
  }
};

