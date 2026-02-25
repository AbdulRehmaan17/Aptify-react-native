import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { HapticTab } from '@/components/haptic-tab';
import { colors, radius, shadows } from '../../src/theme';

export default function TabLayout() {
  // All hooks must be called unconditionally at the top level
  const { loading, user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding: minimum 12px + safe area inset
  const bottomPadding = Math.max(12, insets.bottom);

  // Don't show tabs if not authenticated - check after hooks
  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomPadding, // Minimum 12px + safe area
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: colors.white,
          borderRadius: radius.lg, // Rounded top corners
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderBottomLeftRadius: radius.lg,
          borderBottomRightRadius: radius.lg,
          borderWidth: 0,
          paddingTop: 8,
          paddingBottom: 0, // Handled by bottom padding
          paddingHorizontal: 4,
          // Subtle shadow
          ...shadows.md,
          shadowOffset: { width: 0, height: -2 },
          // Android elevation
          elevation: Platform.OS === 'android' ? 8 : 0,
        },
        tabBarActiveTintColor: colors.primary, // Teal active color
        tabBarInactiveTintColor: colors.textSecondary, // Visible gray for inactive
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: false,
      }}>
      {/* Only 4 visible tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'construct' : 'construct-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="account"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
