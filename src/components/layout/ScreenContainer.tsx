/**
 * ScreenContainer
 * Base container component for all screens
 * - Handles SafeArea automatically
 * - Provides consistent scroll behavior
 * - Applies theme background color
 * - Supports custom padding and scrollable content
 */

import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  padding?: boolean;
  paddingHorizontal?: boolean;
  paddingVertical?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: ScrollViewProps;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  scrollable = true,
  padding = true,
  paddingHorizontal,
  paddingVertical,
  backgroundColor,
  style,
  contentContainerStyle,
  scrollViewProps,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  const bgColor = backgroundColor || colors.background;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: bgColor,
    ...style,
  };

  const contentPadding: ViewStyle = {
    paddingHorizontal: padding || paddingHorizontal ? spacing.lg : 0,
    paddingVertical: padding || paddingVertical ? spacing.md : 0,
  };

  if (!scrollable) {
    return (
      <SafeAreaView style={containerStyle} edges={edges}>
        <View style={[styles.content, contentPadding, contentContainerStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={edges}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          contentPadding,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollViewProps}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
