import { AlertTriangle, CheckCircle2, Eye, Link2, Lock, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddStepPanel } from '@/components/roadmap/builder/AddStepPanel';
import { ExclusionsPanel } from '@/components/roadmap/builder/ExclusionsPanel';
import { PersonaFields } from '@/components/roadmap/builder/PersonaFields';
import { RouteStepRow } from '@/components/roadmap/builder/RouteStepRow';
import { Body, Card, NotFound, RoadmapLoading, SectionHeading } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { domainVisual } from '@/components/universe/universe-visuals';
import { draftBuilderView, searchDraftNodes } from '@/domain/roadmap/selectors/draft';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function GuideBuilderScreen() {
  const params = useLocalSearchParams<{ draftId?: string }>();
  const draftId = params.draftId ?? '';
  const { theme } = useLifeTheme();
  const roadmap = useRoadmap();
  const router = useRouter();

  if (!roadmap.hydrated) return <RoadmapLoading />;

  const vm = draftBuilderView(roadmap.catalog, roadmap.state, draftId);
  if (!vm) return <RoadmapScaffold title="Guide"><NotFound what="Guide draft" /></RoadmapScaffold>;

  const path = roadmap.catalog.paths.find((p) => p.id === vm.pathId);
  const domainId = path?.interestIds[0] ?? 'technology';
  const tone = domainVisual(domainId).core;
  const unlisted = vm.visibility === 'unlisted';
  const issues = [
    ...vm.issues.map((issue) => ({ testID: 'builder-issue', message: issue.message })),
    ...roadmap.lastIssues.map((issue) => ({ testID: 'builder-op-issue', message: issue.message })),
  ];

  return (
    <RoadmapScaffold
      eyebrow={`${vm.pathTitle.toUpperCase()} / DRAFT`}
      title={vm.title || 'Untitled route'}
      subtitle="Nothing here is published; an unlisted link is as far as it goes.">
      <SectionHeading index="01" title="Who this is for" subtitle="Naming who it is not for is what makes a Guide worth following." />
      <PersonaFields
        title={vm.title}
        persona={vm.persona}
        onChange={(patch) => roadmap.updateDraftPersona(draftId, patch)}
      />

      <SectionHeading index="02" title="The route" subtitle="Your order and your reasons. Steps can branch into alternatives." />
      {vm.route.length === 0 && <Body>Nothing placed yet. Add the first concept below.</Body>}
      {vm.route.map((step, index) => (
        <RouteStepRow
          key={step.stepId}
          step={step}
          previousStepId={index > 0 ? vm.route[index - 1].stepId : null}
          connectedToPrevious={index > 0 && vm.connections.some(
            (edge) => edge.from === vm.route[index - 1].stepId && edge.to === step.stepId,
          )}
          onSetRole={(role) => roadmap.setDraftStepRole(draftId, step.stepId, role)}
          onSetNote={(note) => roadmap.setDraftStepNote(draftId, step.stepId, note)}
          onRemove={() => roadmap.removeDraftStep(draftId, step.stepId)}
          onConnect={(from, kind) => roadmap.connectDraftSteps(draftId, from, step.stepId, kind)}
        />
      ))}

      <SectionHeading index="03" title="Add a Step" />
      <AddStepPanel
        available={vm.available}
        domainId={domainId}
        onSearch={(query) => searchDraftNodes(roadmap.catalog, roadmap.state, draftId, query)}
        onPlace={(nodeId) => roadmap.placeDraftStep(draftId, nodeId)}
        onPropose={(node) => roadmap.addProvisionalNode(draftId, node)}
      />

      <SectionHeading
        index="04"
        title="What this route leaves out"
        subtitle="Say what you deliberately skip and why. Explorers compare these across Guides."
      />
      <ExclusionsPanel
        stances={vm.stances}
        excludable={vm.excludable}
        onExclude={(nodeId, reason) => roadmap.setDraftStance(draftId, nodeId, reason)}
        onClear={(nodeId) => roadmap.clearDraftStance(draftId, nodeId)}
      />

      <SectionHeading index="05" title="Ready?" />
      {issues.length === 0 ? (
        <Card tone={theme.success}>
          <View style={styles.statusHead}>
            <CheckCircle2 color={theme.success} size={17} />
            <Text testID="builder-clean" style={[styles.statusText, { color: theme.ink }]}>Nothing is broken in this route.</Text>
          </View>
        </Card>
      ) : (
        <Card tone={theme.amber}>
          <View style={styles.statusHead}>
            <AlertTriangle color={theme.amber} size={17} />
            <Text style={[styles.statusLabel, { color: theme.amber }]}>WORTH FIXING BEFORE YOU SHARE</Text>
          </View>
          {issues.map((issue, index) => (
            <View key={`${issue.testID}-${index}`} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: theme.amber }]} />
              <Text testID={issue.testID} style={[styles.issue, { color: theme.ink }]}>{issue.message}</Text>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.actions}>
        <Pressable
          testID="preview-draft"
          accessibilityRole="button"
          onPress={() => router.push(`/guides/${draftId}`)}
          style={({ pressed }) => [styles.action, { borderColor: tone }, pressed && styles.pressed]}>
          <Eye color={tone} size={16} />
          <Text style={[styles.actionText, { color: tone }]}>PREVIEW IT AS AN EXPLORER WOULD SEE IT</Text>
        </Pressable>

        {/* Creating a link needs a finished draft; taking one back never does. */}
        {(vm.publishable || unlisted) && (
          <Pressable
            testID="toggle-unlisted"
            accessibilityRole="button"
            onPress={() => roadmap.setDraftVisibility(draftId, unlisted ? 'private' : 'unlisted')}
            style={({ pressed }) => [styles.action, { borderColor: theme.accent, backgroundColor: unlisted ? 'transparent' : theme.accentSoft }, pressed && styles.pressed]}>
            {unlisted ? <Lock color={theme.accent} size={16} /> : <Link2 color={theme.accent} size={16} />}
            <Text style={[styles.actionText, { color: theme.accent }]}>
              {unlisted ? 'MAKE IT PRIVATE AGAIN' : 'CREATE AN UNLISTED LINK'}
            </Text>
          </Pressable>
        )}
      </View>

      {!vm.publishable && (
        <Body testID="not-publishable">
          Add who it is for, where it starts, where it leads, and at least two Steps before sharing a link.
        </Body>
      )}

      {unlisted && (
        <Card testID="unlisted-banner" tone={theme.accent}>
          <View style={styles.statusHead}>
            <Link2 color={theme.accent} size={16} />
            <Text style={[styles.statusLabel, { color: theme.accent }]}>ANYONE WITH THE LINK CAN READ THIS</Text>
          </View>
          <Text style={[styles.link, { color: theme.ink }]}>{`/guides/${draftId}`}</Text>
        </Card>
      )}

      <Pressable
        testID="delete-draft"
        accessibilityRole="button"
        onPress={() => { roadmap.deleteDraft(draftId); router.replace('/create'); }}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
        <Trash2 color={theme.inkSecondary} size={14} />
        <Text style={[styles.deleteText, { color: theme.inkSecondary }]}>Delete this draft</Text>
      </Pressable>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  statusText: { fontSize: 14, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', gap: 9 },
  bullet: { width: 5, height: 5, marginTop: 7, borderRadius: 3 },
  issue: { flex: 1, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 6, paddingHorizontal: 14 },
  actionText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  link: { fontSize: 13, fontWeight: '700' },
  delete: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, paddingVertical: 8 },
  deleteText: { fontSize: 12, textDecorationLine: 'underline' },
  pressed: { opacity: 0.72 },
});
