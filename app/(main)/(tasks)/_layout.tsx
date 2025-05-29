import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@ui-kitten/components';
import { ArrowRightLeft, Gauge, Target, Edit } from 'lucide-react-native';
import TabOptionsSheet, { TabOptionsSheetRef } from '@/components/TabOptionsSheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
  const theme = useTheme();
  const sheetRef = useRef<TabOptionsSheetRef>(null);

  return (
      <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: { backgroundColor: theme['background-basic-color-1'] },
          ...Platform.select({
            ios: { position: 'absolute' },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Random Dot Motion',
            tabBarIcon: ({ color }) => <ArrowRightLeft color={color} />,
            // headerRight: () => (
            //   <TouchableOpacity
            //     onPress={() => sheetRef.current?.open()}
            //     style={{ marginRight: 16 }}
            //   >
            //     <Edit color="#007AFF" size={24} />
            //   </TouchableOpacity>
            // ),
          }}
        />
        {/* Add more Tabs.Screen as needed */}
      </Tabs>
      
      {/* Render the bottom sheet outside Tabs so it's always available */}
      <TabOptionsSheet ref={sheetRef} />
    </>
  );
}
