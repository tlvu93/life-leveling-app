import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, RoadmapLoading, RoleChip, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { draftPreviewView } from '@/domain/roadmap/selectors/draft';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function DraftPreviewScreen() {
  const params = useLocalSearchParams<{ draftId?: string }>();
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog } = useRoadmap();

  if (!hydrated) return <RoadmapLoading />;

  const vm = draftPreviewView(catalog, state, params.draftId ?? '');
  if (!vm) return <RoadmapScaffold title="Guide"><NotFound what="Guide" /></RoadmapScaffold>;

  return (
    <RoadmapScaffold title={vm.title || 'Untitled route'}>
      <Text testID="preview-visibility" style={[styles.eyebrow, { color: theme.inkSecondary }]}>
        {vm.visibility === 'unlisted' ? 'UNLISTED — anyone with the link can read this' : 'PRIVATE DRAFT — only you can see this'}
      </Text>
      <Body>{`A route through ${vm.pathTitle}.`}</Body>

      <SectionTitle>Who this is for</SectionTitle>
      <Body>{vm.persona.audience || 'Not stated yet.'}</Body>
      <SectionTitle>Starting from</SectionTitle>
      <Body>{vm.persona.startingPoint || 'Not stated yet.'}</Body>
      <SectionTitle>Where it leads</SectionTitle>
      <Body>{vm.persona.outcome || 'Not stated yet.'}</Body>

      <SectionTitle>The route</SectionTitle>
      {vm.steps.length === 0 && <Body>No Steps placed yet.</Body>}
      {vm.steps.map((step) => (
        <Card key={step.stepId} testID={`preview-step-${step.stepId}`}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: theme.ink }]}>{step.nodeTitle}</Text>
            <RoleChip role={step.role} />
            {step.branchOf && <Text style={[styles.branch, { color: theme.accent }]}>an alternative</Text>}
          </View>
          <Body>{step.nodeDescription}</Body>
          {step.note.length > 0 && <Body>{`The author's note: ${step.note}`}</Body>}
        </Card>
      ))}

      {vm.stances.length > 0 && <SectionTitle>What this route leaves out</SectionTitle>}
      {vm.stances.map((stance) => (
        <Card key={stance.nodeTitle} testID="preview-stance">
          <Text style={[styles.title, { color: theme.ink }]}>{stance.nodeTitle}</Text>
          <Body>{stance.reason}</Body>
        </Card>
      ))}

      {vm.rationale.length > 0 && (
        <>
          <SectionTitle>Why this route</SectionTitle>
          <Body>{vm.rationale}</Body>
        </>
      )}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '700' },
  branch: { fontSize: 11, fontWeight: '700' },
});
