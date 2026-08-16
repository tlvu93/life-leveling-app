import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { UniverseHeader } from '@/components/universe/UniverseHeader';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';
import { RoadmapNav } from './RoadmapNav';

/**
 * Every roadmap list surface wears the same chrome as the Universe canvas:
 * the app header on top, the Alpha's eyebrow / display title / subtitle
 * intro, and the docked nav. Only the middle changes between screens.
 */
export function RoadmapScaffold({ children, title, eyebrow, subtitle }: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  const { theme } = useLifeTheme();
  const { persistenceError, state } = useRoadmap();
  const { width } = useWindowDimensions();
  const compact = width < 720;

  const active = state.builds.find((build) => build.id === state.activeBuildId) ?? state.builds[0];

  return (
    <View testID="roadmap-screen" style={[styles.root, { backgroundColor: theme.surfaceStrong }]}>
      <UniverseHeader floating={false} journeyLabel={active ? active.title : 'No Journey yet'} />

      {persistenceError && (
        <View testID="persistence-error" style={[styles.banner, { backgroundColor: `${theme.amber}22`, borderColor: theme.amber }]}>
          <Text style={{ color: theme.ink }}>{persistenceError}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <View testID="roadmap-content" style={styles.inner}>
          <View style={styles.intro}>
            {eyebrow && <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>}
            <Text style={[styles.title, compact && styles.titleCompact, { color: theme.ink }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: theme.inkSecondary }]}>{subtitle}</Text>}
          </View>
          {children}
        </View>
      </ScrollView>

      <RoadmapNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { marginHorizontal: 18, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 18, paddingBottom: 40 },
  inner: { gap: 14 },
  intro: { maxWidth: 760, marginBottom: 4 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  title: { marginTop: 8, fontSize: 44, fontWeight: '900', lineHeight: 47 },
  titleCompact: { fontSize: 32, lineHeight: 35 },
  subtitle: { maxWidth: 680, marginTop: 12, fontSize: 14, lineHeight: 21 },
});
