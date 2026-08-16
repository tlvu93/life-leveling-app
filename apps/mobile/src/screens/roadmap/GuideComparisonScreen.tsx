import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import type { RouteRole } from '@/domain/roadmap/catalog';
import { compareGuides, type ComparisonSide } from '@/domain/roadmap/selectors/guide-comparison';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

const roleWords: Record<RouteRole, string> = {
  required: 'Required',
  recommended: 'Recommended',
  'optional-depth': 'Optional depth',
  alternative: 'Alternative',
  checkpoint: 'Checkpoint',
};

function sideText(side: ComparisonSide) {
  if (side.kind === 'placed') return roleWords[side.role];
  if (side.kind === 'excluded') return 'Left out on purpose';
  return 'Not on this route';
}

export default function GuideComparisonScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const { theme } = useLifeTheme();
  const { catalog, adoptGuide } = useRoadmap();
  const router = useRouter();

  const vm = compareGuides(catalog, params.a ?? '', params.b ?? '');
  if (!vm) return <RoadmapScaffold title="Compare"><NotFound what="pair of Guides" /></RoadmapScaffold>;

  const titleOf = (guideId: string) => catalog.guides.find((g) => g.id === guideId)?.title ?? guideId;

  return (
    <RoadmapScaffold title="Compare routes">
      {[vm.a, vm.b].map((guide) => (
        <Card key={guide.id} testID={`compare-head-${guide.id}`}>
          <Text style={[styles.title, { color: theme.ink }]}>{guide.title}</Text>
          <Body>{`For: ${guide.persona.audience}`}</Body>
          <Body>{`Outcome: ${guide.persona.outcome}`}</Body>
          <Pressable
            testID={`adopt-${guide.id}`}
            accessibilityRole="button"
            onPress={() => { adoptGuide(guide.id); router.push('/journey'); }}>
            <Text style={[styles.action, { color: theme.accent }]}>Make this my Journey</Text>
          </Pressable>
        </Card>
      ))}

      <SectionTitle>What actually differs</SectionTitle>
      {vm.materialDifferences.map((difference) => (
        <Text key={difference} testID="material-difference" style={[styles.difference, { color: theme.ink }]}>{`• ${difference}`}</Text>
      ))}

      {vm.stanceDisagreements.length > 0 && <SectionTitle>Where the authors disagree</SectionTitle>}
      {vm.stanceDisagreements.map((disagreement) => (
        <Card key={disagreement.nodeId} testID={`disagreement-${disagreement.nodeId}`}>
          <Text style={[styles.title, { color: theme.ink }]}>{disagreement.nodeTitle}</Text>
          <Body>{`${titleOf(disagreement.placedIn)} keeps it (${roleWords[disagreement.role]}).`}</Body>
          <Body>{`${titleOf(disagreement.excludedIn)} leaves it out: “${disagreement.reason}”`}</Body>
        </Card>
      ))}

      <SectionTitle>Every concept, side by side</SectionTitle>
      {vm.rows.map((row) => (
        <View key={row.nodeId} testID={`row-${row.nodeId}`} style={[styles.row, { borderColor: theme.borderSoft }]}>
          <Text style={[styles.rowTitle, { color: theme.ink }]}>{row.nodeTitle}</Text>
          <View style={styles.rowSides}>
            <Text style={[styles.rowSide, { color: theme.inkSecondary }]}>{sideText(row.a)}</Text>
            <Text style={[styles.rowSide, { color: theme.inkSecondary }]}>{sideText(row.b)}</Text>
          </View>
        </View>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700' },
  action: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  difference: { fontSize: 14, lineHeight: 20 },
  row: { borderBottomWidth: 1, paddingVertical: 8, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSides: { flexDirection: 'row', gap: 12 },
  rowSide: { flex: 1, fontSize: 13 },
});
