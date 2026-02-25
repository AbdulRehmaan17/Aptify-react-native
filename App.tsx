import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { logError, handleError } from './src/utils/errorHandler';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  NavigationContainer,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LoadingProvider } from './src/context/LoadingContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';

// Enhanced theme with smooth transitions
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0a7ea4',
  },
  animation: {
    ...DefaultTheme.animation,
    scale: 1,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#0a7ea4',
  },
  animation: {
    ...DarkTheme.animation,
    scale: 1,
  },
};

function AppContent() {
  const { activeTheme } = useTheme();

  return (
    <NavigationThemeProvider value={activeTheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

function App() {
  // React Native handles unhandled promise rejections automatically
  // No need for window-based event listeners

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <ThemeProvider>
            <LoadingProvider>
              <AuthProvider>
                <AppProvider>
                  <AppContent />
                </AppProvider>
              </AuthProvider>
            </LoadingProvider>
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default registerRootComponent(App);
