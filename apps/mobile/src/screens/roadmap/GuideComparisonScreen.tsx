import { Scale } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Body, Card, NotFound, PrimaryButton, RoadmapLoading, SectionHeading } from '@/components/roadmap/pieces';
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
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { hydrated, catalog, adoptGuide } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const vm = compareGuides(catalog, params.a ?? '', params.b ?? '');
  if (!vm) return <RoadmapScaffold title="Compare"><NotFound what="pair of Guides" /></RoadmapScaffold>;

  const titleOf = (guideId: string) => catalog.guides.find((g) => g.id === guideId)?.title ?? guideId;
  const tones = [theme.accent, theme.teal];

  return (
    <RoadmapScaffold
      eyebrow="LIVING UNIVERSE / TWO OPINIONS"
      title="Compare routes"
      subtitle="Two people who know this Path disagree about it. Seeing where is more useful than being told which one is right.">
      <View style={[styles.grid, compact && styles.gridCompact]}>
        {[vm.a, vm.b].map((guide, index) => (
          <Card key={guide.id} grow testID={`compare-head-${guide.id}`} tone={tones[index]}>
            <Text style={[styles.title, { color: theme.ink }]}>{guide.title}</Text>
            <View style={[styles.personaRow, { borderTopColor: theme.panelBorder }]}>
              <Text style={[styles.personaLabel, { color: theme.inkSecondary }]}>FOR</Text>
              <Text style={[styles.personaText, { color: theme.ink }]}>{guide.persona.audience}</Text>
            </View>
            <View style={styles.personaRowPlain}>
              <Text style={[styles.personaLabel, { color: theme.inkSecondary }]}>OUTCOME</Text>
              <Text style={[styles.personaText, { color: theme.ink }]}>{guide.persona.outcome}</Text>
            </View>
            <View style={styles.spacer} />
            <PrimaryButton
              testID={`adopt-${guide.id}`}
              label="Make this my Journey"
              tone={tones[index]}
              onPress={() => { adoptGuide(guide.id); router.push('/journey'); }}
            />
          </Card>
        ))}
      </View>

      <SectionHeading index="01" title="What actually differs" subtitle="Ordering alone is not a difference worth arguing about — these are." />
      <Card tone={theme.amber}>
        {vm.materialDifferences.map((difference) => (
          <View key={difference} style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: theme.amber }]} />
            <Text testID="material-difference" style={[styles.bulletText, { color: theme.ink }]}>{difference}</Text>
          </View>
        ))}
      </Card>

      {vm.stanceDisagreements.length > 0 && (
        <SectionHeading index="02" title="Where the authors disagree" subtitle="One keeps a concept the other deliberately leaves out, and says why." />
      )}
      {vm.stanceDisagreements.map((disagreement) => (
        <Card key={disagreement.nodeId} testID={`disagreement-${disagreement.nodeId}`} tone={theme.coral}>
          <View style={styles.disagreeHead}>
            <Scale color={theme.coral} size={16} />
            <Text style={[styles.title, { color: theme.ink }]}>{disagreement.nodeTitle}</Text>
          </View>
          <Body>{`${titleOf(disagreement.placedIn)} keeps it (${roleWords[disagreement.role]}).`}</Body>
          <Body>{`${titleOf(disagreement.excludedIn)} leaves it out: “${disagreement.reason}”`}</Body>
        </Card>
      ))}

      <SectionHeading
        index={vm.stanceDisagreements.length > 0 ? '03' : '02'}
        title="Every concept, side by side"
      />
      <Card>
        <View style={[styles.tableHead, { borderBottomColor: theme.panelBorder }]}>
          <Text style={[styles.tableHeadCell, styles.rowTitleCell, { color: theme.inkSecondary }]}>CONCEPT</Text>
          <Text style={[styles.tableHeadCell, { color: tones[0] }]}>{vm.a.title.toUpperCase()}</Text>
          <Text style={[styles.tableHeadCell, { color: tones[1] }]}>{vm.b.title.toUpperCase()}</Text>
        </View>
        {vm.rows.map((row) => (
          <View key={row.nodeId} testID={`row-${row.nodeId}`} style={[styles.row, { borderBottomColor: theme.panelBorder }]}>
            <Text style={[styles.rowTitle, styles.rowTitleCell, { color: theme.ink }]}>{row.nodeTitle}</Text>
            <Text style={[styles.rowSide, { color: theme.inkSecondary }]}>{sideText(row.a)}</Text>
            <Text style={[styles.rowSide, { color: theme.inkSecondary }]}>{sideText(row.b)}</Text>
          </View>
        ))}
      </Card>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCompact: { flexDirection: 'column' },
  title: { fontSize: 17, fontWeight: '900' },
  personaRow: { gap: 3, marginTop: 4, borderTopWidth: 1, paddingTop: 12 },
  personaRowPlain: { gap: 3, paddingTop: 8 },
  personaLabel: { fontSize: 7, fontWeight: '900' },
  personaText: { fontSize: 12, lineHeight: 17 },
  spacer: { flex: 1, minHeight: 4 },
  bulletRow: { flexDirection: 'row', gap: 9 },
  bullet: { width: 5, height: 5, marginTop: 7, borderRadius: 3 },
  bulletText: { flex: 1, fontSize: 12, lineHeight: 18 },
  disagreeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tableHead: { flexDirection: 'row', gap: 12, borderBottomWidth: 1, paddingBottom: 8 },
  tableHeadCell: { flex: 1, fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  row: { flexDirection: 'row', gap: 12, borderBottomWidth: 1, paddingVertical: 9 },
  rowTitleCell: { flex: 1.4 },
  rowTitle: { fontSize: 12, fontWeight: '800' },
  rowSide: { flex: 1, fontSize: 11, lineHeight: 16 },
});
