import { Check, EyeOff, Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, RoadmapLoading, SectionHeading, progressLabels } from '@/components/roadmap/pieces';
import { interestLabels } from '@/domain/roadmap/ids';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { buildView } from '@/domain/roadmap/selectors/build';
import { shareAudit, sharePreviewView } from '@/domain/roadmap/selectors/share-preview';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

/** A ticked row. The box is drawn rather than typed, so no glyph can go missing. */
function PickRow({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID: string }) {
  const { theme } = useLifeTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pick,
        { borderColor: on ? theme.accent : theme.panelBorder, backgroundColor: on ? theme.accentSoft : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.box, { borderColor: on ? theme.accent : theme.panelBorder, backgroundColor: on ? theme.accent : 'transparent' }]}>
        {on && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
      </View>
      <Text style={[styles.pickText, { color: on ? theme.ink : theme.inkSecondary }]}>{label}</Text>
    </Pressable>
  );
}

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
    <RoadmapScaffold
      eyebrow="LIVING UNIVERSE / SHARING"
      title="Share preview"
      subtitle="This page starts empty. Only what you tick below ever appears on it, and nothing leaves this device until you say so.">
      <SectionHeading index="01" title="Choose what to show" />

      <View style={styles.picks}>
        {state.interests.map((interest) => {
          const on = state.share.interestIds.includes(interest);
          return (
            <PickRow
              key={interest}
              testID={`pick-interest-${interest}`}
              label={interestLabels[interest]}
              on={on}
              onPress={() => selectForShare({
                interestIds: on ? state.share.interestIds.filter((id) => id !== interest) : [...state.share.interestIds, interest],
              })}
            />
          );
        })}
        {journey?.steps.map((step) => {
          const on = selected.has(step.stepId);
          return (
            <PickRow
              key={step.stepId}
              testID={`pick-step-${step.stepId}`}
              label={step.nodeTitle}
              on={on}
              onPress={() => {
                if (!activeId) return;
                const next = on ? state.share.stepIds.filter((id) => id !== step.stepId) : [...state.share.stepIds, step.stepId];
                // The route only appears once a Step of it does, and unticking
                // the last Step takes the page back to genuinely empty.
                selectForShare({ buildId: next.length > 0 ? activeId : null, stepIds: next });
              }}
            />
          );
        })}
      </View>

      <Pressable
        testID="clear-share"
        accessibilityRole="button"
        onPress={clearShare}
        style={({ pressed }) => [styles.clear, { borderColor: theme.panelBorder }, pressed && styles.pressed]}>
        <EyeOff color={theme.inkSecondary} size={15} />
        <Text style={[styles.clearText, { color: theme.inkSecondary }]}>CLEAR EVERYTHING</Text>
      </Pressable>

      <SectionHeading index="02" title="What people would see" subtitle="The whole page, exactly as it would read to someone with the link." />

      <Card testID="share-output" tone={theme.accent}>
        {empty ? (
          <Body testID="share-empty">Nothing yet — this page is empty.</Body>
        ) : (
          <View style={styles.output}>
            {preview.build && <Text testID="shared-build" style={[styles.outputTitle, { color: theme.ink }]}>{preview.build.title}</Text>}
            {preview.interests.length > 0 && (
              <View style={styles.tagRow}>
                {preview.interests.map((interest) => (
                  <View key={interest.id} style={[styles.tag, { borderColor: theme.panelBorder, backgroundColor: theme.surfaceMuted }]}>
                    <Text testID={`shared-interest-${interest.id}`} style={[styles.tagText, { color: theme.inkSecondary }]}>{interest.label}</Text>
                  </View>
                ))}
              </View>
            )}
            {preview.steps.map((step) => (
              <View key={step.nodeTitle} style={[styles.outputStep, { borderTopColor: theme.panelBorder }]}>
                <Text testID="shared-step" style={[styles.outputStepText, { color: theme.ink }]}>
                  {`${step.nodeTitle}${step.progressState ? ` — ${progressLabels[step.progressState]}` : ''}`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <SectionHeading index="03" title="What stays private" />

      <Card tone={theme.inkSecondary}>
        <View style={styles.privateHead}>
          <Lock color={theme.inkSecondary} size={15} />
          <Text style={[styles.privateLabel, { color: theme.inkSecondary }]}>NOT ON THAT PAGE</Text>
        </View>
        <Body testID="share-audit">
          {`${audit.privateSteps} Steps, ${audit.privateArtifacts} pieces of evidence, and ${audit.privateInterests} interests are not on that page.`}
        </Body>
      </Card>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  picks: { gap: 8 },
  pick: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12 },
  box: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 4 },
  pickText: { flex: 1, fontSize: 13, fontWeight: '600' },
  clear: { minHeight: 40, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 6, paddingHorizontal: 13 },
  clearText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
  output: { gap: 8 },
  outputTitle: { fontSize: 18, fontWeight: '900' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { fontSize: 10, fontWeight: '700' },
  outputStep: { borderTopWidth: 1, paddingTop: 8 },
  outputStepText: { fontSize: 13, lineHeight: 19 },
  privateHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privateLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  pressed: { opacity: 0.72 },
});
