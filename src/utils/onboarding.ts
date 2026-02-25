/**
 * Onboarding State Management
 * Handles first launch and onboarding completion tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@aptify_onboarding_complete';
const FIRST_LAUNCH_KEY = '@aptify_first_launch';

/**
 * Check if onboarding has been completed
 */
export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (error) {
    if (__DEV__) {
      console.error('[Onboarding] Error checking onboarding status:', error);
    }
    return false;
  }
};

/**
 * Mark onboarding as complete
 */
export const completeOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    if (__DEV__) {
      console.log('[Onboarding] ✅ Onboarding marked as complete');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Onboarding] ❌ Error completing onboarding:', error);
    }
    throw error;
  }
};

/**
 * Check if this is the first launch
 */
export const isFirstLaunch = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (value === null) {
      // First launch - mark it
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      return true;
    }
    return false;
  } catch (error) {
    if (__DEV__) {
      console.error('[Onboarding] Error checking first launch:', error);
    }
    return false;
  }
};

/**
 * Reset onboarding (for testing)
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
    if (__DEV__) {
      console.log('[Onboarding] ✅ Onboarding reset');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Onboarding] ❌ Error resetting onboarding:', error);
    }
  }
};
