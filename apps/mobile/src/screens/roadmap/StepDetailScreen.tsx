import { Quote, Repeat2, Target } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, ProgressStatePicker, RoadmapLoading, RoleChip, SectionHeading } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
import { stepDetailView } from '@/domain/roadmap/selectors/step-detail';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function StepDetailScreen() {
  const params = useLocalSearchParams<{ stepId?: string }>();
  const stepId = params.stepId ?? '';
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog, setProgress, replaceStep } = useRoadmap();
  const router = useRouter();
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!hydrated) return <RoadmapLoading />;

  const build = state.builds.find((b) => b.steps.some((s) => s.id === stepId));
  const vm = build ? stepDetailView(catalog, state, build.id, stepId) : null;
  if (!build || !vm) return <RoadmapScaffold title="Step"><NotFound what="Step" /></RoadmapScaffold>;

  const path = catalog.paths.find((p) => p.id === build.pathId);
  const tone = domainVisual(path?.interestIds[0] ?? '').core;
  const placed = new Set(build.steps.map((s) => s.nodeId));
  const nearby = new Set(path?.nodeIds ?? []);
  // Anything in the shared Universe can take this Step's place — a Guide that
  // already places every concept on its own Path would otherwise offer nothing.
  const alternatives = catalog.nodes
    .filter((node) => !node.provisional && !placed.has(node.id))
    .sort((a, b) => {
      const near = Number(nearby.has(b.id)) - Number(nearby.has(a.id));
      return near !== 0 ? near : a.title.localeCompare(b.title);
    });

  return (
    <RoadmapScaffold
      eyebrow={path ? `${path.title.toUpperCase()} / STEP` : 'LIVING UNIVERSE / STEP'}
      title={vm.nodeTitle}
      subtitle={vm.nodeDescription}>
      <View style={styles.head}>
        <RoleChip role={vm.role} />
        <View style={[styles.typePill, { borderColor: tone, backgroundColor: `${tone}14` }]}>
          <Text style={[styles.typeText, { color: tone }]}>{vm.nodeType.toUpperCase()}</Text>
        </View>
      </View>

      {vm.note.length > 0 && (
        <Card testID="author-note" tone={theme.inkSecondary}>
          <View style={styles.cardHead}>
            <Quote color={theme.inkSecondary} size={15} />
            <Text style={[styles.cardLabel, { color: theme.inkSecondary }]}>THE AUTHOR&apos;S NOTE</Text>
          </View>
          <Body>{vm.note}</Body>
        </Card>
      )}

      {vm.quest && (
        <Card testID="quest" tone={tone}>
          <View style={styles.cardHead}>
            <Target color={tone} size={16} />
            <Text style={[styles.cardLabel, { color: tone }]}>SOMETHING YOU COULD TRY</Text>
          </View>
          <Body>{vm.quest.prompt}</Body>
        </Card>
      )}

      <SectionHeading
        index="01"
        title="Where are you with this?"
        subtitle="Only you see this. Pausing and skipping are real answers, not failures."
      />
      <ProgressStatePicker value={vm.progress?.state ?? null} onChange={(next) => setProgress(stepId, next)} />

      <SectionHeading index="02" title="Change this Step" subtitle="Your route is yours. Swapping remembers what the Step came from." />
      <Pressable
        testID="show-alternatives"
        accessibilityRole="button"
        onPress={() => setShowAlternatives((open) => !open)}
        style={({ pressed }) => [styles.swapToggle, { borderColor: tone, backgroundColor: showAlternatives ? `${tone}14` : 'transparent' }, pressed && styles.pressed]}>
        <Repeat2 color={tone} size={16} />
        <Text style={[styles.swapToggleText, { color: tone }]}>
          {showAlternatives ? 'NEVER MIND' : 'SWAP THIS FOR SOMETHING ELSE'}
        </Text>
      </Pressable>

      {showAlternatives && alternatives.map((node) => (
        <Card
          key={node.id}
          testID={`swap-${node.id}`}
          tone={domainVisual(node.domainId).core}
          onPress={() => { replaceStep(build.id, stepId, node.id); router.replace('/journey'); }}>
          <Text style={[styles.swapTitle, { color: theme.ink }]}>{node.title}</Text>
          <Body>{node.description}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typePill: { minHeight: 28, justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 9 },
  typeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  swapToggle: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 6, paddingHorizontal: 14 },
  swapToggleText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  swapTitle: { fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
