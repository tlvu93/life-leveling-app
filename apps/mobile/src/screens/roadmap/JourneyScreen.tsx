import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, RoadmapLoading, RoleChip, SectionTitle, progressLabels } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { buildView } from '@/domain/roadmap/selectors/build';
import { pathTransferView } from '@/domain/roadmap/selectors/path-transfer';
import { framingFlagsFrom, progressLabel } from '@/lib/framing-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function JourneyScreen() {
  const params = useLocalSearchParams<{ framing?: string; marker?: string }>();
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <RoadmapLoading />;

  const activeId = state.activeBuildId ?? state.builds[0]?.id ?? null;
  const vm = activeId ? buildView(catalog, state, activeId) : null;

  if (!vm) {
    return (
      <RoadmapScaffold title="Your Journey">
        <Body>You have not adopted a route yet. Open a Path and choose a Guide that fits you.</Body>
        <Card testID="journey-empty-cta" onPress={() => router.push('/')}>
          <Text style={[styles.action, { color: theme.accent }]}>Find a Path</Text>
        </Card>
      </RoadmapScaffold>
    );
  }

  const pathId = state.builds.find((b) => b.id === activeId)?.pathId ?? '';
  const transfer = pathTransferView(catalog, state, pathId);
  const flags = framingFlagsFrom(params);

  return (
    <RoadmapScaffold title={vm.title}>
      {vm.provenance && <Text testID="provenance" style={[styles.provenance, { color: theme.inkSecondary }]}>{vm.provenance}</Text>}
      {flags.marker && <Text testID="identity-marker" style={[styles.marker, { color: theme.accent }]}>Explorer 04</Text>}
      {transfer && (
        <Text testID="transfer-line" style={[styles.transfer, { color: theme.accent }]}>
          {progressLabel(flags, transfer.applyCount, transfer.totalNodes)}
        </Text>
      )}

      <SectionTitle>Your route</SectionTitle>
      {vm.steps.map((step) => (
        <Card key={step.stepId} testID={`step-${step.stepId}`} onPress={() => router.push(`/journey/step/${step.stepId}`)}>
          <View style={styles.stepHead}>
            <Text style={[styles.stepTitle, { color: theme.ink }]}>{step.nodeTitle}</Text>
            <RoleChip role={step.role} />
            {step.progressState && (
              <Text testID={`state-${step.stepId}`} style={[styles.state, { color: theme.accent }]}>{progressLabels[step.progressState]}</Text>
            )}
          </View>
          {step.originBadge && <Text testID={`origin-${step.stepId}`} style={[styles.origin, { color: theme.inkSecondary }]}>{step.originBadge}</Text>}
          {step.note.length > 0 && <Body>{step.note}</Body>}
        </Card>
      ))}

      <Card testID="open-share" onPress={() => router.push('/share')}>
        <Text style={[styles.action, { color: theme.accent }]}>Share part of this</Text>
        <Body>Nothing is shared until you choose it.</Body>
      </Card>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  provenance: { fontSize: 13 },
  marker: { fontSize: 13, fontWeight: '700' },
  transfer: { fontSize: 14, fontWeight: '700' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  state: { fontSize: 12, fontWeight: '700' },
  origin: { fontSize: 12, fontStyle: 'italic' },
  action: { fontSize: 14, fontWeight: '700' },
});
