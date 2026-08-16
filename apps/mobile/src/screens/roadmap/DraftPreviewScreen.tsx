import { Eye, Lock, Quote } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, RoadmapLoading, RoleChip, SectionHeading } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
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

  const unlisted = vm.visibility === 'unlisted';
  const tone = domainVisual(catalog.paths.find((p) => p.id === vm.pathId)?.interestIds[0] ?? '').core;
  const persona: { label: string; value: string }[] = [
    { label: 'WHO THIS IS FOR', value: vm.persona.audience || 'Not stated yet.' },
    { label: 'STARTING FROM', value: vm.persona.startingPoint || 'Not stated yet.' },
    { label: 'WHERE IT LEADS', value: vm.persona.outcome || 'Not stated yet.' },
  ];

  return (
    <RoadmapScaffold
      eyebrow={`${vm.pathTitle.toUpperCase()} / A NAVIGATOR ROUTE`}
      title={vm.title || 'Untitled route'}
      subtitle={`A route through ${vm.pathTitle}.`}>
      <View style={styles.statusRow}>
        <View style={[styles.pill, { borderColor: unlisted ? theme.accent : theme.panelBorder, backgroundColor: unlisted ? theme.accentSoft : 'transparent' }]}>
          {unlisted ? <Eye color={theme.accent} size={13} /> : <Lock color={theme.inkSecondary} size={13} />}
          <Text testID="preview-visibility" style={[styles.pillText, { color: unlisted ? theme.accent : theme.inkSecondary }]}>
            {unlisted ? 'UNLISTED — anyone with the link can read this' : 'PRIVATE DRAFT — only you can see this'}
          </Text>
        </View>
      </View>

      <SectionHeading index="01" title="Who it is written for" subtitle="A Guide that says who it is not for is more useful than one that claims to fit everyone." />
      <View style={styles.personaGrid}>
        {persona.map(({ label, value }) => (
          <Card key={label} grow tone={tone}>
            <Text style={[styles.cardLabel, { color: tone }]}>{label}</Text>
            <Body>{value}</Body>
          </Card>
        ))}
      </View>

      <SectionHeading index="02" title="The route" />
      {vm.steps.length === 0 && <Body>No Steps placed yet.</Body>}
      {vm.steps.map((step, index) => (
        <Card key={step.stepId} testID={`preview-step-${step.stepId}`} tone={tone}>
          <View style={styles.head}>
            <Text style={[styles.stepIndex, { color: tone }]}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={[styles.title, { color: theme.ink }]}>{step.nodeTitle}</Text>
            <RoleChip role={step.role} />
            {step.branchOf && (
              <View style={[styles.branch, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.branchText, { color: theme.accent }]}>AN ALTERNATIVE</Text>
              </View>
            )}
          </View>
          <Body>{step.nodeDescription}</Body>
          {step.note.length > 0 && (
            <View style={[styles.note, { borderTopColor: theme.panelBorder }]}>
              <Quote color={theme.inkSecondary} size={13} />
              <Text style={[styles.noteText, { color: theme.inkSecondary }]}>{step.note}</Text>
            </View>
          )}
        </Card>
      ))}

      {vm.stances.length > 0 && (
        <SectionHeading index="03" title="What this route leaves out" subtitle="Left out on purpose, with the reason attached — not an oversight." />
      )}
      {vm.stances.map((stance) => (
        <Card key={stance.nodeTitle} testID="preview-stance" tone={theme.coral}>
          <Text style={[styles.title, { color: theme.ink }]}>{stance.nodeTitle}</Text>
          <Body>{stance.reason}</Body>
        </Card>
      ))}

      {vm.rationale.length > 0 && (
        <>
          <SectionHeading index={vm.stances.length > 0 ? '04' : '03'} title="Why this route" />
          <Card tone={theme.violet}><Body>{vm.rationale}</Body></Card>
        </>
      )}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 6, paddingHorizontal: 11 },
  pillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  personaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' },
  stepIndex: { fontSize: 11, fontWeight: '900' },
  title: { fontSize: 16, fontWeight: '900' },
  branch: { minHeight: 26, justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 9 },
  branchText: { fontSize: 8, fontWeight: '900' },
  note: { flexDirection: 'row', gap: 8, marginTop: 4, borderTopWidth: 1, paddingTop: 11 },
  noteText: { flex: 1, fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
});
