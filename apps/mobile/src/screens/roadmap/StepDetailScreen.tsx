import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, ProgressStatePicker, RoleChip, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { stepDetailView } from '@/domain/roadmap/selectors/step-detail';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function StepDetailScreen() {
  const params = useLocalSearchParams<{ stepId?: string }>();
  const stepId = params.stepId ?? '';
  const { theme } = useLifeTheme();
  const { state, catalog, setProgress, replaceStep } = useRoadmap();
  const router = useRouter();
  const [showAlternatives, setShowAlternatives] = useState(false);

  const build = state.builds.find((b) => b.steps.some((s) => s.id === stepId));
  const vm = build ? stepDetailView(catalog, state, build.id, stepId) : null;
  if (!build || !vm) return <RoadmapScaffold title="Step"><NotFound what="Step" /></RoadmapScaffold>;

  const path = catalog.paths.find((p) => p.id === build.pathId);
  const placed = new Set(build.steps.map((s) => s.nodeId));
  const alternatives = (path?.nodeIds ?? [])
    .filter((id) => !placed.has(id))
    .map((id) => catalog.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  return (
    <RoadmapScaffold title={vm.nodeTitle}>
      <View style={styles.head}>
        <RoleChip role={vm.role} />
        <Text style={[styles.type, { color: theme.inkSecondary }]}>{vm.nodeType}</Text>
      </View>
      <Body>{vm.nodeDescription}</Body>
      {vm.note.length > 0 && (
        <Card testID="author-note"><Body>{`The author's note: ${vm.note}`}</Body></Card>
      )}

      {vm.quest && (
        <Card testID="quest">
          <SectionTitle>Something you could try</SectionTitle>
          <Body>{vm.quest.prompt}</Body>
        </Card>
      )}

      <SectionTitle>Where are you with this?</SectionTitle>
      <ProgressStatePicker value={vm.progress?.state ?? null} onChange={(next) => setProgress(stepId, next)} />

      <SectionTitle>Change this Step</SectionTitle>
      <Pressable testID="show-alternatives" accessibilityRole="button" onPress={() => setShowAlternatives((open) => !open)}>
        <Text style={[styles.action, { color: theme.accent }]}>{showAlternatives ? 'Never mind' : 'Swap this for something else'}</Text>
      </Pressable>
      {showAlternatives && alternatives.map((node) => (
        <Card
          key={node.id}
          testID={`swap-${node.id}`}
          onPress={() => { replaceStep(build.id, stepId, node.id); router.replace('/journey'); }}>
          <Text style={[styles.swapTitle, { color: theme.ink }]}>{node.title}</Text>
          <Body>{node.description}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  type: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  action: { fontSize: 14, fontWeight: '700' },
  swapTitle: { fontSize: 15, fontWeight: '700' },
});
