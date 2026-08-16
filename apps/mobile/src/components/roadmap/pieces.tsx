import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RouteRole } from '@/domain/roadmap/catalog';
import { progressStates, type ProgressState } from '@/domain/roadmap/state';
import { useLifeTheme } from '@/state/theme-context';

const roleLabels: Record<RouteRole, string> = {
  required: 'Required',
  recommended: 'Recommended',
  'optional-depth': 'Optional depth',
  alternative: 'Alternative',
  checkpoint: 'Checkpoint',
};

export const progressLabels: Record<ProgressState, string> = {
  interested: 'Interested',
  tried: 'Tried',
  practicing: 'Practising',
  demonstrated: 'Demonstrated',
  paused: 'Paused',
  skipped: 'Skipped',
  'not-for-me': 'Not for me',
};

export function RoleChip({ role }: { role: RouteRole }) {
  const { theme } = useLifeTheme();
  return (
    <View style={[styles.chip, { borderColor: theme.borderSoft }]}>
      <Text style={[styles.chipText, { color: theme.inkSecondary }]}>{roleLabels[role]}</Text>
    </View>
  );
}

export function Card({ children, onPress, testID }: { children: ReactNode; onPress?: () => void; testID?: string }) {
  const { theme } = useLifeTheme();
  const base = [styles.card, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }];
  if (!onPress) return <View testID={testID} style={base}>{children}</View>;
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { theme } = useLifeTheme();
  return <Text style={[styles.sectionTitle, { color: theme.ink }]}>{children}</Text>;
}

export function Body({ children, testID }: { children: ReactNode; testID?: string }) {
  const { theme } = useLifeTheme();
  return <Text testID={testID} style={[styles.body, { color: theme.inkSecondary }]}>{children}</Text>;
}

export function ProgressStatePicker({ value, onChange }: { value: ProgressState | null; onChange: (next: ProgressState) => void }) {
  const { theme } = useLifeTheme();
  return (
    <View style={styles.picker}>
      {progressStates.map((candidate) => {
        const active = candidate === value;
        return (
          <Pressable
            key={candidate}
            testID={`progress-${candidate}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(candidate)}
            style={[styles.chip, { borderColor: active ? theme.accent : theme.borderSoft, backgroundColor: active ? `${theme.accent}18` : 'transparent' }]}>
            <Text style={[styles.chipText, { color: active ? theme.accent : theme.inkSecondary }]}>{progressLabels[candidate]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Every roadmap screen waits for storage before drawing: rendering the default
 * state first would tell a returning person they have no Journey.
 */
export function RoadmapLoading() {
  const { theme } = useLifeTheme();
  return (
    <View testID="roadmap-loading" style={[styles.loading, { backgroundColor: theme.surfaceStrong }]}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

export function NotFound({ what }: { what: string }) {
  const { theme } = useLifeTheme();
  return <Text testID="not-found" style={[styles.body, { color: theme.ink }]}>{`We could not find that ${what}.`}</Text>;
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  pressed: { opacity: 0.75 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  body: { fontSize: 14, lineHeight: 20 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
