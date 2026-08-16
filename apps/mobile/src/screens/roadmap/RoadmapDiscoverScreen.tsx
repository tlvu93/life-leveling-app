import { Code2, Dumbbell, Hammer, type LucideIcon, MessagesSquare, Music2, Palette } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Body, Card, CardCta, RoadmapLoading, SectionHeading } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
import { discoverView } from '@/domain/roadmap/selectors/discover';
import { interestLabels, type InterestId } from '@/domain/roadmap/ids';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

const interestIcons: Record<InterestId, LucideIcon> = {
  music: Music2,
  technology: Code2,
  design: Palette,
  making: Hammer,
  movement: Dumbbell,
  language: MessagesSquare,
};

export default function RoadmapDiscoverScreen() {
  const { theme } = useLifeTheme();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { hydrated, state, catalog, setInterests } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const vm = discoverView(catalog, state);
  const toneOf = (pathId: string) => {
    const path = catalog.paths.find((p) => p.id === pathId);
    return domainVisual(path?.interestIds[0] ?? '').core;
  };
  const toggle = (id: InterestId) => {
    setInterests(state.interests.includes(id) ? state.interests.filter((x) => x !== id) : [...state.interests, id]);
  };

  return (
    <RoadmapScaffold
      eyebrow="LIVING UNIVERSE / PERSONAL SIGNALS"
      title="Paths worth exploring"
      subtitle="Pick what you are drawn to. Nothing here is a commitment, and undiscovered territory is not a gap.">
      <View style={styles.interests}>
        {vm.interests.map((interest) => {
          const tone = domainVisual(interest.id).core;
          const Icon = interestIcons[interest.id];
          return (
            <Pressable
              key={interest.id}
              testID={`interest-${interest.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: interest.selected }}
              onPress={() => toggle(interest.id)}
              style={({ pressed }) => [
                styles.interest,
                { borderColor: interest.selected ? tone : theme.panelBorder, backgroundColor: interest.selected ? `${tone}18` : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <Icon color={interest.selected ? tone : theme.inkSecondary} size={17} />
              <Text style={[styles.interestLabel, { color: interest.selected ? theme.ink : theme.inkSecondary }]}>{interest.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeading
        index="01"
        title="Paths"
        subtitle="Ordered by the interests you picked. An outline is an honest state, not a lesser one — it means nobody has charted it in depth yet."
      />

      <View style={[styles.grid, compact && styles.gridCompact]}>
        {vm.paths.map((path) => {
          const tone = toneOf(path.id);
          const stub = path.status === 'stub';
          return (
            <Card key={path.id} grow testID={`path-${path.id}`} tone={stub ? theme.border : tone} onPress={() => router.push(`/paths/${path.id}`)}>
              <View style={styles.pathHead}>
                <Text style={[styles.pathTitle, { color: theme.ink }]}>{path.title}</Text>
                {stub && (
                  <Text testID={`stub-${path.id}`} style={[styles.stub, { color: theme.inkSecondary, borderColor: theme.panelBorder }]}>OUTLINE ONLY</Text>
                )}
              </View>
              <Body>{path.whatItIs}</Body>
              {path.matchedInterests.length > 0 && (
                <View style={[styles.matchRow, { borderTopColor: theme.panelBorder }]}>
                  <Text style={[styles.matchLabel, { color: tone }]}>WHY IT MATCHES</Text>
                  <Text style={[styles.matchText, { color: theme.inkSecondary }]}>
                    {`You picked ${path.matchedInterests.map((id) => interestLabels[id]).join(' and ')}.`}
                  </Text>
                </View>
              )}
              <View style={styles.spacer} />
              <CardCta label={stub ? 'See the outline' : 'Explore this Path'} tone={tone} quiet={stub} />
            </Card>
          );
        })}
      </View>

      <Pressable testID="open-legacy" accessibilityRole="link" onPress={() => router.push('/discover')} style={styles.legacy}>
        <Text style={[styles.legacyText, { color: theme.inkSecondary }]}>Open the earlier prototype — it asks its own questions first</Text>
      </Pressable>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interest: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12 },
  interestLabel: { fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCompact: { flexDirection: 'column' },
  pathHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pathTitle: { fontSize: 19, fontWeight: '900', lineHeight: 22 },
  stub: { fontSize: 7, fontWeight: '900', borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4 },
  matchRow: { marginTop: 4, borderTopWidth: 1, paddingTop: 11 },
  matchLabel: { fontSize: 7, fontWeight: '900' },
  matchText: { marginTop: 5, fontSize: 10, lineHeight: 15 },
  spacer: { flex: 1 },
  legacy: { marginTop: 24, alignItems: 'center' },
  legacyText: { fontSize: 12, textDecorationLine: 'underline' },
  pressed: { opacity: 0.72 },
});
