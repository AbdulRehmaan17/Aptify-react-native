import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AuthProvider } from '../src/context/AuthContext';
import { AppProvider } from '../src/context/AppContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { LoadingProvider } from '../src/context/LoadingContext';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppProvider>
                <LoadingProvider>
                  <PaperProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                        animationDuration: 200,
                      }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(guest)" />
                      <Stack.Screen name="(tabs)" />
                    </Stack>
                    <StatusBar style="auto" />
                  </PaperProvider>
                </LoadingProvider>
              </AppProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
