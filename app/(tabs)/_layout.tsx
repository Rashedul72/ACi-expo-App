import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? '#FFFFFF' : '#000000', // White in dark mode, black in light mode
        headerShown: false,
        tabBarShowLabel: false, // Hide text labels, show only icons
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
          paddingTop: spacing.md,
          ...shadows.md,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
      initialRouteName="scanner">
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="qr-code-scanner"
              size={focused ? 32 : 28}
              color={focused ? colors.primary : isDark ? '#FFFFFF' : '#000000'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="kanban"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="dashboard"
              size={focused ? 32 : 28}
              color={focused ? colors.primary : isDark ? '#FFFFFF' : '#000000'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
