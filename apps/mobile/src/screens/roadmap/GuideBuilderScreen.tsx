import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddStepPanel } from '@/components/roadmap/builder/AddStepPanel';
import { ExclusionsPanel } from '@/components/roadmap/builder/ExclusionsPanel';
import { PersonaFields } from '@/components/roadmap/builder/PersonaFields';
import { RouteStepRow } from '@/components/roadmap/builder/RouteStepRow';
import { Body, NotFound, RoadmapLoading, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
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

  return (
    <RoadmapScaffold title={vm.title || 'Untitled route'}>
      <Body>{`A route through ${vm.pathTitle}. Nothing here is published; an unlisted link is as far as it goes.`}</Body>

      <SectionTitle>Who this is for</SectionTitle>
      <PersonaFields
        title={vm.title}
        persona={vm.persona}
        onChange={(patch) => roadmap.updateDraftPersona(draftId, patch)}
      />

      <SectionTitle>The route</SectionTitle>
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

      <SectionTitle>Add a Step</SectionTitle>
      <AddStepPanel
        available={vm.available}
        domainId={domainId}
        onSearch={(query) => searchDraftNodes(roadmap.catalog, roadmap.state, draftId, query)}
        onPlace={(nodeId) => roadmap.placeDraftStep(draftId, nodeId)}
        onPropose={(node) => roadmap.addProvisionalNode(draftId, node)}
      />

      <SectionTitle>What this route leaves out</SectionTitle>
      <Body>Say what you deliberately skip and why. Explorers compare these across Guides.</Body>
      <ExclusionsPanel
        stances={vm.stances}
        excludable={vm.excludable}
        onExclude={(nodeId, reason) => roadmap.setDraftStance(draftId, nodeId, reason)}
        onClear={(nodeId) => roadmap.clearDraftStance(draftId, nodeId)}
      />

      <SectionTitle>Ready?</SectionTitle>
      {vm.issues.length === 0 ? (
        <Body testID="builder-clean">Nothing is broken in this route.</Body>
      ) : (
        vm.issues.map((issue, index) => (
          <Text key={`${issue.code}-${index}`} testID="builder-issue" style={[styles.issue, { color: theme.amber }]}>
            {`• ${issue.message}`}
          </Text>
        ))
      )}
      {roadmap.lastIssues.map((issue, index) => (
        <Text key={`op-${index}`} testID="builder-op-issue" style={[styles.issue, { color: theme.amber }]}>
          {`• ${issue.message}`}
        </Text>
      ))}

      <Pressable testID="preview-draft" accessibilityRole="button" onPress={() => router.push(`/guides/${draftId}`)}>
        <Text style={[styles.action, { color: theme.accent }]}>Preview it as an Explorer would see it</Text>
      </Pressable>

      {/* Creating a link needs a finished draft; taking one back never does. */}
      {(vm.publishable || vm.visibility === 'unlisted') && (
        <Pressable
          testID="toggle-unlisted"
          accessibilityRole="button"
          onPress={() => roadmap.setDraftVisibility(draftId, vm.visibility === 'unlisted' ? 'private' : 'unlisted')}>
          <Text style={[styles.action, { color: theme.accent }]}>
            {vm.visibility === 'unlisted' ? 'Make it private again' : 'Create an unlisted link'}
          </Text>
        </Pressable>
      )}
      {!vm.publishable && (
        <Body testID="not-publishable">
          Add who it is for, where it starts, where it leads, and at least two Steps before sharing a link.
        </Body>
      )}
      {vm.visibility === 'unlisted' && (
        <View testID="unlisted-banner" style={[styles.banner, { borderColor: theme.accent }]}>
          <Text style={{ color: theme.ink }}>{`Anyone with the link can read this: /guides/${draftId}`}</Text>
        </View>
      )}

      <Pressable testID="delete-draft" accessibilityRole="button" onPress={() => { roadmap.deleteDraft(draftId); router.replace('/create'); }}>
        <Text style={[styles.danger, { color: theme.inkSecondary }]}>Delete this draft</Text>
      </Pressable>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  issue: { fontSize: 13, lineHeight: 19 },
  action: { fontSize: 14, fontWeight: '700', paddingVertical: 6 },
  banner: { borderWidth: 1, borderRadius: 10, padding: 10 },
  danger: { fontSize: 12, textDecorationLine: 'underline', paddingTop: 12 },
});
