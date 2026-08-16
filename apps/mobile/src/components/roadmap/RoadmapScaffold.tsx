import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';
import { RoadmapNav } from './RoadmapNav';

export function RoadmapScaffold({ children, title }: { children: ReactNode; title: string }) {
  const { theme } = useLifeTheme();
  const { persistenceError } = useRoadmap();
  const insets = useSafeAreaInsets();

  return (
    <View testID="roadmap-screen" style={[styles.root, { backgroundColor: theme.surfaceStrong }]}>
      <View style={[styles.header, { borderBottomColor: theme.borderSoft, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      </View>
      {persistenceError && (
        <View testID="persistence-error" style={[styles.banner, { backgroundColor: `${theme.amber}22`, borderColor: theme.amber }]}>
          <Text style={{ color: theme.ink }}>{persistenceError}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      <RoadmapNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  banner: { marginHorizontal: 18, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 18, paddingBottom: 120, gap: 14 },
});
