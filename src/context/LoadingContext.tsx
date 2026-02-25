import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Modal } from 'react-native';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius } from '@/constants/ui';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
  loadingMessage: string | null;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const showLoading = useCallback((loadingMessage?: string) => {
    setLoading(true);
    setMessage(loadingMessage || null);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
    setMessage(null);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        showLoading,
        hideLoading,
        isLoading: loading,
        loadingMessage: message,
      }}>
      {children}
      <GlobalLoadingOverlay visible={loading} message={message} colors={colors} />
    </LoadingContext.Provider>
  );
};

interface GlobalLoadingOverlayProps {
  visible: boolean;
  message: string | null;
  colors: typeof Colors.light;
}

function GlobalLoadingOverlay({ visible, message, colors }: GlobalLoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Prevent closing by back button during critical operations
      }}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 120,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  message: {
    ...Typography.body,
    marginTop: Spacing.base,
    textAlign: 'center',
    maxWidth: 200,
  },
});
