import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { NodeType } from '@/domain/roadmap/catalog';
import type { BuilderNodeVm } from '@/domain/roadmap/selectors/guide-builder';
import type { InterestId, NodeId } from '@/domain/roadmap/ids';
import { useLifeTheme } from '@/state/theme-context';

export function AddStepPanel({
  available, domainId, onSearch, onPlace, onPropose,
}: {
  available: BuilderNodeVm[];
  domainId: InterestId;
  /** Searches titles AND descriptions, so "camelot" finds Harmonic Mixing. */
  onSearch: (query: string) => BuilderNodeVm[];
  onPlace: (nodeId: NodeId) => void;
  onPropose: (node: { title: string; description: string; type: NodeType; domainId: InterestId }) => boolean;
}) {
  const { theme } = useLifeTheme();
  const [query, setQuery] = useState('');
  const [proposing, setProposing] = useState(false);
  const [proposedTitle, setProposedTitle] = useState('');
  const [proposedDescription, setProposedDescription] = useState('');

  const needle = query.trim();
  const found = needle ? onSearch(needle) : available;
  const matches = found.slice(0, 8);
  const hidden = found.length - matches.length;

  return (
    <View style={styles.root}>
      <TextInput
        testID="node-search"
        accessibilityLabel="Search concepts"
        value={query}
        onChangeText={setQuery}
        placeholder="Search the shared concepts"
        placeholderTextColor={theme.inkSecondary}
        style={[styles.input, { color: theme.ink, borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }]}
      />
      {matches.map((node) => (
        <Pressable
          key={node.id}
          testID={`place-${node.id}`}
          accessibilityRole="button"
          onPress={() => { onPlace(node.id); setQuery(''); }}
          style={[styles.row, { borderColor: theme.borderSoft }]}>
          <Text style={[styles.rowTitle, { color: theme.ink }]}>{node.title}</Text>
          {node.provisional && <Text style={[styles.flag, { color: theme.amber }]}>YOUR PROPOSAL</Text>}
        </Pressable>
      ))}
      {needle.length > 0 && matches.length === 0 && (
        <Text testID="no-matches" style={[styles.empty, { color: theme.inkSecondary }]}>
          Nothing shared matches that. You can propose it below.
        </Text>
      )}
      {hidden > 0 && (
        <Text testID="more-matches" style={[styles.empty, { color: theme.inkSecondary }]}>
          {`${hidden} more match${hidden === 1 ? 'es' : 'es'} — keep typing to narrow it down.`}
        </Text>
      )}

      <Pressable testID="toggle-propose" accessibilityRole="button" onPress={() => setProposing((open) => !open)}>
        <Text style={[styles.action, { color: theme.accent }]}>
          {proposing ? 'Never mind' : 'Propose a concept the Universe is missing'}
        </Text>
      </Pressable>
      {proposing && (
        <View style={[styles.proposal, { borderColor: theme.borderSoft }]}>
          <TextInput
            testID="proposal-title"
            accessibilityLabel="Name of the concept you are proposing"
            value={proposedTitle}
            onChangeText={setProposedTitle}
            placeholder="Open-decks etiquette"
            placeholderTextColor={theme.inkSecondary}
            style={[styles.input, { color: theme.ink, borderColor: theme.borderSoft }]}
          />
          <TextInput
            testID="proposal-description"
            accessibilityLabel="What it means"
            value={proposedDescription}
            onChangeText={setProposedDescription}
            placeholder="What does it mean, in one or two sentences?"
            placeholderTextColor={theme.inkSecondary}
            multiline
            style={[styles.input, styles.multiline, { color: theme.ink, borderColor: theme.borderSoft }]}
          />
          <Text style={[styles.note, { color: theme.inkSecondary }]}>
            It stays yours until review decides whether it belongs to everyone.
          </Text>
          <Pressable
            testID="submit-proposal"
            accessibilityRole="button"
            onPress={() => {
              // Keep what the author typed unless the proposal actually landed.
              if (!onPropose({ title: proposedTitle, description: proposedDescription, type: 'skill', domainId })) return;
              setProposedTitle('');
              setProposedDescription('');
              setProposing(false);
            }}>
            <Text style={[styles.action, { color: theme.accent }]}>Add it to my route</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  multiline: { minHeight: 56, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingVertical: 8 },
  rowTitle: { flex: 1, fontSize: 14 },
  flag: { fontSize: 10, fontWeight: '700' },
  empty: { fontSize: 13 },
  action: { fontSize: 14, fontWeight: '700', paddingVertical: 4 },
  proposal: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  note: { fontSize: 12 },
});
