import { useCallback, useRef } from 'react';
import { useLoading } from '../context/LoadingContext';
import { handleErrorWithAlert, getErrorMessage } from '../utils/errorHandler';
import { useNetworkStatus } from './use-network-status';

interface SafeAsyncOptions {
  showLoading?: boolean;
  loadingMessage?: string;
  showError?: boolean;
  errorMessage?: string;
  checkNetwork?: boolean;
}

/**
 * Hook for safe async operations with automatic error handling and loading states
 */
export function useSafeAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options?: SafeAsyncOptions
): [(...args: Parameters<T>) => Promise<ReturnType<T> | null>, boolean] {
  const { showLoading, loadingMessage, showError = true, errorMessage, checkNetwork = true } = options || {};
  const { showLoading: showGlobalLoading, hideLoading } = useLoading();
  const { isConnected } = useNetworkStatus();
  const isExecuting = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      // Prevent concurrent executions
      if (isExecuting.current) {
        if (__DEV__) {
          console.warn('[useSafeAsync] ⚠️ Operation already in progress, skipping');
        }
        return null;
      }

      // Check network connectivity (only if explicitly false, null means unknown/assume connected)
      if (checkNetwork && isConnected === false) {
        if (showError) {
          handleErrorWithAlert(
            { code: 'network-error', message: 'No internet connection' },
            errorMessage || 'Please check your internet connection and try again.'
          );
        }
        return null;
      }

      try {
        isExecuting.current = true;

        // Show loading
        if (showLoading) {
          if (loadingMessage) {
            showGlobalLoading(loadingMessage);
          } else {
            showGlobalLoading();
          }
        }

        // Execute async function
        const result = await asyncFn(...args);
        return result;
      } catch (error: any) {
        if (__DEV__) {
          console.error('[useSafeAsync] ❌ Error:', error);
        }

        // Handle error
        if (showError) {
          handleErrorWithAlert(error, errorMessage);
        }

        return null;
      } finally {
        isExecuting.current = false;

        // Hide loading
        if (showLoading) {
          hideLoading();
        }
      }
    },
    [asyncFn, showLoading, loadingMessage, showError, errorMessage, checkNetwork, isConnected, showGlobalLoading, hideLoading]
  );

  return [execute, isExecuting.current];
}

/**
 * Wrapper function for safe async operations
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  options?: {
    showError?: boolean;
    errorMessage?: string;
    onError?: (error: any) => void;
  }
): Promise<T | null> {
  const { showError = false, errorMessage, onError } = options || {};

  try {
    return await asyncFn();
  } catch (error: any) {
    if (__DEV__) {
      console.error('[safeAsync] ❌ Error:', error);
    }

    if (showError) {
      handleErrorWithAlert(error, errorMessage);
    }

    if (onError) {
      onError(error);
    }

    return null;
  }
}
