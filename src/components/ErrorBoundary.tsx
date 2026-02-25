import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/ui';
import { logError } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    logError(
      {
        code: 'error-boundary',
        message: error.message || 'An unexpected error occurred',
        originalError: error,
        severity: 'error',
        category: 'unknown',
      },
      {
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
      }
    );

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
          <MaterialIcons name="error-outline" size={64} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: colors.icon }]}>
          An unexpected error occurred. Please try again or restart the app.
        </Text>

        {__DEV__ && error && (
          <View style={[styles.errorDetails, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>Error Details (Dev Only)</Text>
            <Text style={[styles.errorText, { color: colors.text }]}>{error.message}</Text>
            {error.stack && (
              <Text style={[styles.errorStack, { color: colors.icon }]}>{error.stack}</Text>
            )}
            {errorInfo?.componentStack && (
              <Text style={[styles.errorStack, { color: colors.icon }]}>
                    Component Stack:{'\n'}
                    {errorInfo.componentStack}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, Shadows.sm]}
          onPress={onReset}
          activeOpacity={0.8}>
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonSecondary, { borderColor: colors.border }]}
          onPress={() => {
            // Reset error boundary state to allow retry
            onReset();
          }}
          activeOpacity={0.8}>
          <MaterialIcons name="restart-alt" size={20} color={colors.text} />
          <Text style={[styles.buttonTextSecondary, { color: colors.text }]}>Reset</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    minHeight: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  errorDetails: {
    width: '100%',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    maxHeight: 300,
  },
  errorTitle: {
    ...Typography.bodyBold,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.small,
    fontFamily: 'monospace',
    marginBottom: Spacing.sm,
  },
  errorStack: {
    ...Typography.small,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    ...Typography.bodyBold,
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    minWidth: 200,
  },
  buttonTextSecondary: {
    ...Typography.bodyBold,
  },
});
