import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@ui-kitten/components'; // Assuming you use UI Kitten for theming

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
      <Text style={[styles.title, { color: theme['text-basic-color'] }]}>Settings Panel</Text>
      <Text style={{ color: theme['text-hint-color'] }}>Add your task settings here.</Text>
      {/* Example: <Switch checked={true} onChange={() => console.log('Setting changed')}>Enable Feature X</Switch> */}
    </View>
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