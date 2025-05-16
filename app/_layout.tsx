import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
// import { IconSymbol } from '@/components/ui/IconSymbol'; // Not used currently
// import TabBarBackground from '@/components/ui/TabBarBackground'; // Not used currently
// import { Colors } from '@/constants/Colors'; // Not used currently
// import { useColorScheme } from '@/hooks/useColorScheme'; // Not used currently
import { ApplicationProvider, useTheme } from '@ui-kitten/components';
import { ArrowRightLeft, Gauge, Settings } from 'lucide-react-native'; // Removed Target as it's not used
import { Tabs } from 'expo-router';
import * as eva from '@eva-design/eva'; 

// // This component will now house your Tab Navigator
// // It will be rendered by app/(tasks)/tasksRoot.tsx
// export function TaskTabsLayout() { // Exporting this so tasksRoot.tsx can use it
//   const theme = useTheme();
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarButton: HapticTab,
//         tabBarStyle: { backgroundColor: theme['background-basic-color-1'] },
//         ...Platform.select({
//           ios: {
//             position: 'absolute',
//           },
//           default: {},
//         }),
//       }}>
//       <Tabs.Screen
//         name="direction" // This should match a file like app/(tasks)/direction.tsx
//         options={{
//           title: 'Direction',
//           tabBarIcon: ({ color }: { color: string }) => <ArrowRightLeft color={color} />,
//         }}
//       />
//       {/* Add other tab screens here. They will be resolved relative to the (tasks) group  */}
//       {/* e.g. if you have app/(tasks)/anotherTab.tsx, you can add <Tabs.Screen name="anotherTab" /> */}
//     </Tabs>
//   );
// }

export default function TasksGroupLayout() { // Renamed to avoid conflict and be more descriptive
  const theme = useTheme();

  return (
    <ApplicationProvider {...eva} theme={eva.dark}>
    <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(main)" options={{ headerShown: false }}/>
    <Stack.Screen name="+not-found" />
    </Stack>
    </ApplicationProvider>
  );
}
