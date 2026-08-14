import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useLifeTheme } from '@/state/theme-context';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

export function ScreenScaffold({ children, showNavigation = true }: { children: ReactNode; showNavigation?: boolean }) {
  const { theme } = useLifeTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.surfaceStrong }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={[styles.content, !showNavigation && styles.contentWithoutNavigation]}>{children}</ScrollView>
      {showNavigation && <BottomNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 18, paddingBottom: 110 },
  contentWithoutNavigation: { paddingBottom: 40 },
});
