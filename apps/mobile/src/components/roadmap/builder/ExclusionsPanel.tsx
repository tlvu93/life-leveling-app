import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { BuilderNodeVm } from '@/domain/roadmap/selectors/guide-builder';
import type { NodeId } from '@/domain/roadmap/ids';
import { useLifeTheme } from '@/state/theme-context';

/**
 * Leaving something out is an authorial position, so it always carries a
 * reason: an Explorer comparing two Guides reads these side by side.
 */
export function ExclusionsPanel({
  stances, excludable, onExclude, onClear,
}: {
  stances: { nodeId: NodeId; nodeTitle: string; reason: string }[];
  excludable: BuilderNodeVm[];
  onExclude: (nodeId: NodeId, reason: string) => void;
  onClear: (nodeId: NodeId) => void;
}) {
  const { theme } = useLifeTheme();
  const [target, setTarget] = useState<NodeId | null>(null);
  const [reason, setReason] = useState('');

  return (
    <View style={styles.root}>
      {stances.map((stance) => (
        <View key={stance.nodeId} testID={`stance-${stance.nodeId}`} style={[styles.stance, { borderColor: theme.borderSoft }]}>
          <Text style={[styles.title, { color: theme.ink }]}>{stance.nodeTitle}</Text>
          <Text style={[styles.reason, { color: theme.inkSecondary }]}>{stance.reason}</Text>
          <Pressable testID={`unexclude-${stance.nodeId}`} accessibilityRole="button" onPress={() => onClear(stance.nodeId)}>
            <Text style={[styles.link, { color: theme.inkSecondary }]}>Put it back on the table</Text>
          </Pressable>
        </View>
      ))}

      {target === null ? (
        <View style={styles.choices}>
          {excludable.slice(0, 8).map((node) => (
            <Pressable
              key={node.id}
              testID={`exclude-${node.id}`}
              accessibilityRole="button"
              onPress={() => { setTarget(node.id); setReason(''); }}
              style={[styles.chip, { borderColor: theme.borderSoft }]}>
              <Text style={[styles.chipText, { color: theme.inkSecondary }]}>{`Leave out ${node.title}`}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.form, { borderColor: theme.accent }]}>
          <Text style={[styles.title, { color: theme.ink }]}>
            {excludable.find((n) => n.id === target)?.title ?? target}
          </Text>
          <TextInput
            testID="exclusion-reason"
            accessibilityLabel="Why you leave it out"
            value={reason}
            onChangeText={setReason}
            placeholder="Why does your route not need it?"
            placeholderTextColor={theme.inkSecondary}
            multiline
            style={[styles.input, { color: theme.ink, borderColor: theme.borderSoft }]}
          />
          <View style={styles.formActions}>
            <Pressable
              testID="save-exclusion"
              accessibilityRole="button"
              onPress={() => { onExclude(target, reason); setTarget(null); setReason(''); }}>
              <Text style={[styles.link, { color: theme.accent }]}>Save this position</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setTarget(null)}>
              <Text style={[styles.link, { color: theme.inkSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  stance: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 4 },
  title: { fontSize: 14, fontWeight: '700' },
  reason: { fontSize: 13, lineHeight: 19 },
  link: { fontSize: 12, fontWeight: '700' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12 },
  form: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, minHeight: 52, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 16 },
});
