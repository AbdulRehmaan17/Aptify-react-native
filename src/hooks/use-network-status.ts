import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * Hook to monitor network status using Expo Network API
 */
export function useNetworkStatus(options?: {
  showAlertOnDisconnect?: boolean;
  showAlertOnReconnect?: boolean;
}): NetworkState {
  const { showAlertOnDisconnect = false, showAlertOnReconnect = false } = options || {};
  
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown',
  });

  useEffect(() => {
    let isMounted = true;
    let previousConnected = true;
    let intervalId: NodeJS.Timeout | null = null;

    const checkNetwork = async () => {
      if (!isMounted) return;

      try {
        // Try to use expo-network if available
        let networkState: any = null;
        try {
          const Network = await import('expo-network');
          networkState = await Network.getNetworkStateAsync();
        } catch (importError) {
          // expo-network not available, use fetch-based detection
          try {
            const response = await fetch('https://www.google.com', { 
              method: 'HEAD', 
              mode: 'no-cors',
              cache: 'no-store'
            });
            networkState = { isConnected: true, isInternetReachable: true, type: 'unknown' };
          } catch {
            networkState = { isConnected: false, isInternetReachable: false, type: 'unknown' };
          }
        }
        
        const newState: NetworkState = {
          isConnected: networkState?.isConnected ?? true, // Default to true to avoid blocking
          isInternetReachable: networkState?.isInternetReachable ?? true,
          type: networkState?.type || 'unknown',
        };

        setNetworkState(newState);

        // Show alerts if configured
        if (previousConnected && !newState.isConnected && showAlertOnDisconnect) {
          Alert.alert(
            'No Internet Connection',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }

        if (!previousConnected && newState.isConnected && showAlertOnReconnect) {
          Alert.alert(
            'Connection Restored',
            'Your internet connection has been restored.',
            [{ text: 'OK' }]
          );
        }

        previousConnected = newState.isConnected ?? false;
      } catch (error) {
        if (__DEV__) {
          console.error('[useNetworkStatus] ❌ Error checking network:', error);
        }
        // Assume connected on error to avoid blocking operations
        if (isMounted) {
          setNetworkState({
            isConnected: true,
            isInternetReachable: true,
            type: 'unknown',
          });
        }
      }
    };

    // Initial check
    checkNetwork();

    // Poll network status every 5 seconds
    intervalId = setInterval(checkNetwork, 5000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showAlertOnDisconnect, showAlertOnReconnect]);

  return networkState;
}
