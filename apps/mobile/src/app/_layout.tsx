import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { JourneyProvider } from '@/state/journey-context';
import { RoadmapProvider } from '@/state/roadmap-context';
import { LifeThemeProvider, useLifeTheme } from '@/state/theme-context';

function RootNavigation() {
  const { mode } = useLifeTheme();
  return (
    <>
      <StatusBar style={mode === 'night' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LifeThemeProvider>
          <JourneyProvider>
            <RoadmapProvider>
              <RootNavigation />
            </RoadmapProvider>
          </JourneyProvider>
        </LifeThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
