import { Share2, Sparkles } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, CardCta, RoadmapLoading, RoleChip, SectionHeading, progressLabels } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
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
      <RoadmapScaffold
        eyebrow="LIVING UNIVERSE / YOUR ROUTE"
        title="Your Journey"
        subtitle="You have not adopted a route yet. Open a Path and choose a Guide that fits you — you can rewrite every Step of it afterwards.">
        <Card testID="journey-empty-cta" tone={theme.accent} onPress={() => router.push('/')}>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>Find a Path</Text>
          <Body>Guides are opinions, not syllabi. Adopting one copies its Steps into a route that belongs to you.</Body>
          <CardCta label="Browse the Paths" />
        </Card>
      </RoadmapScaffold>
    );
  }

  const build = state.builds.find((b) => b.id === activeId);
  const pathId = build?.pathId ?? '';
  const path = catalog.paths.find((p) => p.id === pathId);
  const tone = domainVisual(path?.interestIds[0] ?? '').core;
  const transfer = pathTransferView(catalog, state, pathId);
  const flags = framingFlagsFrom(params);

  return (
    <RoadmapScaffold
      eyebrow={path ? `${path.title.toUpperCase()} / YOUR ROUTE` : 'LIVING UNIVERSE / YOUR ROUTE'}
      title={vm.title}>
      <View style={styles.statusRow}>
        {vm.provenance && (
          <View style={[styles.pill, { borderColor: theme.panelBorder, backgroundColor: theme.surfaceMuted }]}>
            <Sparkles color={tone} size={13} />
            <Text testID="provenance" style={[styles.pillText, { color: theme.inkSecondary }]}>{vm.provenance}</Text>
          </View>
        )}
        {flags.marker && (
          <View style={[styles.pill, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
            <Text testID="identity-marker" style={[styles.pillText, { color: theme.accent }]}>Explorer 04</Text>
          </View>
        )}
        {transfer && (
          <View style={[styles.pill, { borderColor: tone, backgroundColor: `${tone}14` }]}>
            <Text testID="transfer-line" style={[styles.pillText, { color: theme.ink }]}>
              {progressLabel(flags, transfer.applyCount, transfer.totalNodes)}
            </Text>
          </View>
        )}
      </View>

      <SectionHeading
        index="01"
        title="Your route"
        subtitle="Each Step is yours to reorder, swap, or drop. Where you replaced something, the Step remembers what it came from."
      />

      {vm.steps.map((step, index) => (
        <Card key={step.stepId} testID={`step-${step.stepId}`} tone={tone} onPress={() => router.push(`/journey/step/${step.stepId}`)}>
          <View style={styles.stepHead}>
            <Text style={[styles.stepIndex, { color: tone }]}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={[styles.stepTitle, { color: theme.ink }]}>{step.nodeTitle}</Text>
            <RoleChip role={step.role} />
            {step.progressState && (
              <View style={[styles.statePill, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
                <Text testID={`state-${step.stepId}`} style={[styles.stateText, { color: theme.accent }]}>{progressLabels[step.progressState]}</Text>
              </View>
            )}
          </View>
          {step.originBadge && <Text testID={`origin-${step.stepId}`} style={[styles.origin, { color: theme.inkSecondary }]}>{step.originBadge}</Text>}
          {step.note.length > 0 && <Body>{step.note}</Body>}
        </Card>
      ))}

      <SectionHeading index="02" title="When you want to" subtitle="Nothing leaves this device until you choose it, piece by piece." />

      <Card testID="open-share" tone={theme.violet} onPress={() => router.push('/share')}>
        <View style={styles.shareHead}>
          <Share2 color={theme.violet} size={18} />
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>Share part of this</Text>
        </View>
        <Body>You pick each Step and interest that appears. Nothing is shared until you choose it.</Body>
        <CardCta label="Build a share page" tone={theme.violet} />
      </Card>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 6, paddingHorizontal: 11 },
  pillText: { fontSize: 10, fontWeight: '700' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' },
  stepIndex: { fontSize: 11, fontWeight: '900' },
  stepTitle: { fontSize: 16, fontWeight: '900' },
  statePill: { minHeight: 26, justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 9 },
  stateText: { fontSize: 9, fontWeight: '900' },
  origin: { fontSize: 11, fontStyle: 'italic' },
  emptyTitle: { fontSize: 19, fontWeight: '900' },
  shareHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
});
