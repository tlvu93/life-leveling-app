import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, RoadmapLoading, SectionTitle, progressLabels } from '@/components/roadmap/pieces';
import { interestLabels } from '@/domain/roadmap/ids';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { buildView } from '@/domain/roadmap/selectors/build';
import { shareAudit, sharePreviewView } from '@/domain/roadmap/selectors/share-preview';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function SharePreviewScreen() {
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog, selectForShare, clearShare } = useRoadmap();

  if (!hydrated) return <RoadmapLoading />;

  const activeId = state.activeBuildId ?? state.builds[0]?.id ?? null;
  const journey = activeId ? buildView(catalog, state, activeId) : null;
  const preview = sharePreviewView(catalog, state);
  const audit = shareAudit(state);
  const selected = new Set(state.share.stepIds);
  const empty = preview.interests.length === 0 && preview.steps.length === 0 && preview.artifacts.length === 0 && !preview.build;

  return (
    <RoadmapScaffold title="Share preview">
      <Body>This page starts empty. Only what you tick below appears on it.</Body>

      <SectionTitle>Choose what to show</SectionTitle>
      {state.interests.map((interest) => {
        const on = state.share.interestIds.includes(interest);
        return (
          <Pressable
            key={interest}
            testID={`pick-interest-${interest}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => selectForShare({
              interestIds: on ? state.share.interestIds.filter((id) => id !== interest) : [...state.share.interestIds, interest],
            })}>
            <Text style={[styles.pick, { color: on ? theme.accent : theme.inkSecondary }]}>{`${on ? '☑' : '☐'} ${interestLabels[interest]}`}</Text>
          </Pressable>
        );
      })}
      {journey?.steps.map((step) => {
        const on = selected.has(step.stepId);
        return (
          <Pressable
            key={step.stepId}
            testID={`pick-step-${step.stepId}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => {
              if (!activeId) return;
              const next = on ? state.share.stepIds.filter((id) => id !== step.stepId) : [...state.share.stepIds, step.stepId];
              // The route only appears once a Step of it does, and unticking
              // the last Step takes the page back to genuinely empty.
              selectForShare({ buildId: next.length > 0 ? activeId : null, stepIds: next });
            }}>
            <Text style={[styles.pick, { color: on ? theme.accent : theme.inkSecondary }]}>{`${on ? '☑' : '☐'} ${step.nodeTitle}`}</Text>
          </Pressable>
        );
      })}
      <Pressable testID="clear-share" accessibilityRole="button" onPress={clearShare}>
        <Text style={[styles.pick, { color: theme.inkSecondary }]}>Clear everything</Text>
      </Pressable>

      <SectionTitle>What people would see</SectionTitle>
      <Card testID="share-output">
        {empty ? (
          <Body testID="share-empty">Nothing yet — this page is empty.</Body>
        ) : (
          <View style={styles.output}>
            {preview.build && <Text testID="shared-build" style={[styles.outputTitle, { color: theme.ink }]}>{preview.build.title}</Text>}
            {preview.interests.map((interest) => (
              <Text key={interest.id} testID={`shared-interest-${interest.id}`} style={{ color: theme.inkSecondary }}>{interest.label}</Text>
            ))}
            {preview.steps.map((step) => (
              <Text key={step.nodeTitle} testID="shared-step" style={{ color: theme.inkSecondary }}>
                {`${step.nodeTitle}${step.progressState ? ` — ${progressLabels[step.progressState]}` : ''}`}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <SectionTitle>What stays private</SectionTitle>
      <Body testID="share-audit">
        {`${audit.privateSteps} Steps, ${audit.privateArtifacts} pieces of evidence, and ${audit.privateInterests} interests are not on that page.`}
      </Body>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  pick: { fontSize: 14, paddingVertical: 4 },
  output: { gap: 4 },
  outputTitle: { fontSize: 16, fontWeight: '700' },
});
