import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RouteRole } from '@/domain/roadmap/catalog';
import type { BuilderStepVm } from '@/domain/roadmap/selectors/guide-builder';
import type { StepId } from '@/domain/roadmap/ids';
import { useLifeTheme } from '@/state/theme-context';

const roles: { role: RouteRole; label: string }[] = [
  { role: 'required', label: 'Required' },
  { role: 'recommended', label: 'Recommended' },
  { role: 'optional-depth', label: 'Optional depth' },
  { role: 'alternative', label: 'Alternative' },
  { role: 'checkpoint', label: 'Checkpoint' },
];

export function RouteStepRow({
  step, previousStepId, connectedToPrevious, onSetRole, onSetNote, onRemove, onConnect,
}: {
  step: BuilderStepVm;
  previousStepId: StepId | null;
  connectedToPrevious: boolean;
  onSetRole: (role: RouteRole) => void;
  onSetNote: (note: string) => void;
  onRemove: () => void;
  onConnect: (from: StepId, kind: 'next' | 'alternative') => void;
}) {
  const { theme } = useLifeTheme();

  return (
    <View testID={`route-step-${step.stepId}`} style={[styles.root, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: theme.ink }]}>{step.nodeTitle}</Text>
        {step.branchOf && (
          <Text testID={`branch-${step.stepId}`} style={[styles.branch, { color: theme.accent }]}>ON A BRANCH</Text>
        )}
        <Pressable testID={`remove-${step.stepId}`} accessibilityRole="button" onPress={onRemove}>
          <Text style={[styles.remove, { color: theme.inkSecondary }]}>Remove</Text>
        </Pressable>
      </View>

      <View style={styles.roles}>
        {roles.map(({ role, label }) => {
          const active = step.role === role;
          return (
            <Pressable
              key={role}
              testID={`role-${step.stepId}-${role}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSetRole(role)}
              style={[styles.chip, { borderColor: active ? theme.accent : theme.panelBorder, backgroundColor: active ? theme.accentSoft : 'transparent' }]}>
              <Text style={[styles.chipText, { color: active ? theme.accent : theme.inkSecondary }]}>{label.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        testID={`note-${step.stepId}`}
        accessibilityLabel={`Why ${step.nodeTitle} is here`}
        value={step.note}
        onChangeText={onSetNote}
        placeholder="Why is this here, in your words?"
        placeholderTextColor={theme.inkSecondary}
        multiline
        style={[styles.note, { color: theme.ink, borderColor: theme.panelBorder }]}
      />

      {/* Once connected the buttons state the fact instead of inviting a second
          tap, which would append a duplicate edge. */}
      {previousStepId && (connectedToPrevious || step.branchOf ? (
        <Text testID={`connected-${step.stepId}`} style={[styles.connected, { color: theme.inkSecondary }]}>
          {step.branchOf ? 'Branches from the Step above' : 'Follows the Step above'}
        </Text>
      ) : (
        <View style={styles.connect}>
          <Pressable
            testID={`connect-next-${step.stepId}`}
            accessibilityRole="button"
            onPress={() => onConnect(previousStepId, 'next')}>
            <Text style={[styles.connectText, { color: theme.accent }]}>Follows the Step above</Text>
          </Pressable>
          <Pressable
            testID={`connect-alt-${step.stepId}`}
            accessibilityRole="button"
            onPress={() => onConnect(previousStepId, 'alternative')}>
            <Text style={[styles.connectText, { color: theme.accent }]}>Is an alternative to it</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { flex: 1, fontSize: 16, fontWeight: '900' },
  branch: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
  remove: { fontSize: 12, textDecorationLine: 'underline' },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 28, justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 9 },
  chipText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  note: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, minHeight: 44, textAlignVertical: 'top' },
  connect: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  connectText: { fontSize: 12, fontWeight: '700' },
  connected: { fontSize: 12 },
});
