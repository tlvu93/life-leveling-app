import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { pathOverviewView } from '@/domain/roadmap/selectors/path-overview';
import { pathTransferView } from '@/domain/roadmap/selectors/path-transfer';
import { framingFlagsFrom, progressLabel } from '@/lib/framing-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function PathOverviewScreen() {
  const params = useLocalSearchParams<{ pathId?: string; framing?: string; marker?: string }>();
  const pathId = params.pathId ?? '';
  const { theme } = useLifeTheme();
  const { state, catalog, adoptGuide } = useRoadmap();
  const router = useRouter();

  const vm = pathOverviewView(catalog, pathId);
  if (!vm) return <RoadmapScaffold title="Path"><NotFound what="Path" /></RoadmapScaffold>;

  const transfer = pathTransferView(catalog, state, pathId);
  const flags = framingFlagsFrom(params);
  const featuredGuideId = catalog.paths.find((p) => p.id === pathId)?.featuredGuideId;

  return (
    <RoadmapScaffold title={vm.title}>
      {transfer && (
        <Text testID="transfer-line" style={[styles.transfer, { color: theme.accent }]}>
          {progressLabel(flags, transfer.applyCount, transfer.totalNodes)}
        </Text>
      )}

      <Body>{vm.overview.whatItIs}</Body>

      <SectionTitle>Where it happens</SectionTitle>
      {vm.overview.settings.map((line) => <Body key={line}>{`• ${line}`}</Body>)}

      <SectionTitle>Variants</SectionTitle>
      {vm.overview.variants.map((line) => <Body key={line}>{`• ${line}`}</Body>)}

      <SectionTitle>Realities</SectionTitle>
      {vm.overview.realities.map((line) => <Body key={line}>{`• ${line}`}</Body>)}

      <SectionTitle>Common ground, and what is contested</SectionTitle>
      <Body>{vm.overview.foundations}</Body>

      <SectionTitle>Guides through this Path</SectionTitle>
      {vm.guides.length >= 2 && (
        <Card testID="compare-guides" onPress={() => router.push(`/compare?a=${vm.guides[0].id}&b=${vm.guides[1].id}`)}>
          <Text style={[styles.action, { color: theme.accent }]}>Compare these two routes</Text>
          <Body>They disagree in ways worth seeing before you pick one.</Body>
        </Card>
      )}
      {vm.guides.map((guide) => (
        <Card key={guide.id} testID={`guide-${guide.id}`}>
          <View style={styles.guideHead}>
            <Text style={[styles.guideTitle, { color: theme.ink }]}>{guide.title}</Text>
            {guide.id === featuredGuideId && (
              <Text testID={`featured-${guide.id}`} style={[styles.featured, { color: theme.accent, borderColor: theme.accent }]}>FEATURED</Text>
            )}
          </View>
          <Body>{`For: ${guide.audience}`}</Body>
          <Body>{`Outcome: ${guide.outcome}`}</Body>
          <Pressable
            testID={`adopt-${guide.id}`}
            accessibilityRole="button"
            onPress={() => { adoptGuide(guide.id); router.push('/journey'); }}>
            <Text style={[styles.action, { color: theme.accent }]}>Make this my Journey</Text>
          </Pressable>
        </Card>
      ))}

      {vm.neighbors.length > 0 && <SectionTitle>Nearby Paths</SectionTitle>}
      {vm.neighbors.map((neighbor) => (
        <Card key={neighbor.id} testID={`neighbor-${neighbor.id}`} onPress={() => router.push(`/paths/${neighbor.id}`)}>
          <Text style={[styles.guideTitle, { color: theme.ink }]}>{neighbor.title}</Text>
          {neighbor.via === 'bridge' && neighbor.bridgeNote && (
            <Text testID={`bridge-${neighbor.id}`} style={[styles.bridge, { color: theme.accent }]}>{neighbor.bridgeNote}</Text>
          )}
          <Body>{neighbor.whatItIs}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  transfer: { fontSize: 14, fontWeight: '700' },
  guideHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  guideTitle: { fontSize: 16, fontWeight: '700' },
  featured: { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  bridge: { fontSize: 13, fontStyle: 'italic' },
  action: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
