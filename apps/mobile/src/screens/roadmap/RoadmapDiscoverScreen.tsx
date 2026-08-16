import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, RoadmapLoading, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { discoverView } from '@/domain/roadmap/selectors/discover';
import type { InterestId } from '@/domain/roadmap/ids';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function RoadmapDiscoverScreen() {
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog, setInterests } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const vm = discoverView(catalog, state);
  const toggle = (id: InterestId) => {
    setInterests(state.interests.includes(id) ? state.interests.filter((x) => x !== id) : [...state.interests, id]);
  };

  return (
    <RoadmapScaffold title="Discover">
      <Body>Pick what you are drawn to. Nothing here is a commitment, and undiscovered territory is not a gap.</Body>
      <View style={styles.interests}>
        {vm.interests.map((interest) => (
          <Pressable
            key={interest.id}
            testID={`interest-${interest.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected: interest.selected }}
            onPress={() => toggle(interest.id)}
            style={[styles.chip, { borderColor: interest.selected ? theme.accent : theme.borderSoft, backgroundColor: interest.selected ? `${theme.accent}18` : 'transparent' }]}>
            <Text style={[styles.chipText, { color: interest.selected ? theme.accent : theme.inkSecondary }]}>{interest.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Paths</SectionTitle>
      {vm.paths.map((path) => (
        <Card key={path.id} testID={`path-${path.id}`} onPress={() => router.push(`/paths/${path.id}`)}>
          <View style={styles.pathHead}>
            <Text style={[styles.pathTitle, { color: theme.ink }]}>{path.title}</Text>
            {path.status === 'stub' && (
              <Text testID={`stub-${path.id}`} style={[styles.stub, { color: theme.inkSecondary, borderColor: theme.borderSoft }]}>OUTLINE ONLY</Text>
            )}
          </View>
          <Body>{path.whatItIs}</Body>
          {path.matchedInterests.length > 0 && (
            <Text style={[styles.match, { color: theme.accent }]}>{`Matches ${path.matchedInterests.join(' + ')}`}</Text>
          )}
        </Card>
      ))}

      <Pressable testID="open-legacy" accessibilityRole="link" onPress={() => router.push('/discover')} style={styles.legacy}>
        <Text style={[styles.legacyText, { color: theme.inkSecondary }]}>Open the earlier prototype — it asks its own questions first</Text>
      </Pressable>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '700' },
  pathHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pathTitle: { fontSize: 17, fontWeight: '700' },
  stub: { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  match: { fontSize: 12, fontWeight: '700' },
  legacy: { marginTop: 20, alignItems: 'center' },
  legacyText: { fontSize: 12, textDecorationLine: 'underline' },
});
