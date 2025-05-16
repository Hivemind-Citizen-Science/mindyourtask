import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@ui-kitten/components'; // Assuming you use UI Kitten for theming
import { Drawer } from 'expo-router/drawer';
import { ArrowRightLeft, Gauge, Settings } from 'lucide-react-native';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerStyle: {
          backgroundColor: theme['background-basic-color-1'],
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: theme['text-primary-color'],
        drawerStyle: {
          backgroundColor: theme['background-basic-color-1'],
          width: 240,
        },
        drawerActiveTintColor: theme['text-primary-color'],
        drawerInactiveTintColor: theme['text-hint-color'],
      }}>
      <Drawer.Screen
        name="(tasks)"
        options={{
          drawerLabel: 'Tasks',
          drawerIcon: ({ color, size }: { color: string, size: number }) => <Gauge color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="settings" // This will look for app/(tasks)/settings.tsx
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }: { color: string, size: number }) => <Settings color={color} size={size} />,
        }}
      />

    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
}); 