import { ArrowRight } from 'lucide-react-native';
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
    <View style={[styles.chip, { borderColor: theme.panelBorder, backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.chipText, { color: theme.inkSecondary }]}>{roleLabels[role].toUpperCase()}</Text>
    </View>
  );
}

/**
 * The Atlas panel, reused as a content card: a floating panel with a soft
 * border, and an optional left accent bar in the Path's own colour.
 */
export function Card({ children, onPress, testID, tone, grow = false }: {
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
  tone?: string;
  /** Sizes the card as a grid tile rather than a full-width row. */
  grow?: boolean;
}) {
  const { theme } = useLifeTheme();
  const base = [styles.card, grow && styles.cardGrow, { borderColor: theme.panelBorder, backgroundColor: theme.panel }];
  const accent = tone ? <View style={[styles.cardAccent, { backgroundColor: tone }]} /> : null;
  if (!onPress) return <View testID={testID} style={base}>{accent}{children}</View>;
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...base, pressed && styles.pressed]}>
      {accent}
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { theme } = useLifeTheme();
  return <Text style={[styles.sectionTitle, { color: theme.ink }]}>{children}</Text>;
}

/** The Alpha's numbered section heading, so long screens stay navigable. */
export function SectionHeading({ index, title, subtitle }: { index: string; title: string; subtitle?: string }) {
  const { theme } = useLifeTheme();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionIndex, { color: theme.accent }]}>{index}</Text>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text>
        {subtitle && <Text style={[styles.sectionSubtitle, { color: theme.inkSecondary }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function Eyebrow({ children, tone }: { children: ReactNode; tone?: string }) {
  const { theme } = useLifeTheme();
  return <Text style={[styles.eyebrow, { color: tone ?? theme.accent }]}>{children}</Text>;
}

/** The Alpha call to action: filled in the surface's own tone, arrow trailing. */
export function PrimaryButton({ label, onPress, tone, testID }: {
  label: string;
  onPress: () => void;
  tone?: string;
  testID?: string;
}) {
  const { theme } = useLifeTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, { backgroundColor: tone ?? theme.accent }, pressed && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{label.toUpperCase()}</Text>
      <ArrowRight color="#FFFFFF" size={16} />
    </Pressable>
  );
}

/**
 * The call-to-action bar inside a card that is itself the button. Decorative
 * on purpose: nesting a real button would give the row two focus stops.
 */
export function CardCta({ label, tone, quiet = false }: { label: string; tone?: string; quiet?: boolean }) {
  const { theme } = useLifeTheme();
  const color = tone ?? theme.accent;
  if (quiet) {
    return (
      <View style={[styles.primaryButton, styles.cardCta, styles.quietCta, { borderColor: theme.border }]}>
        <Text style={[styles.primaryButtonText, { color: theme.inkSecondary }]}>{label.toUpperCase()}</Text>
        <ArrowRight color={theme.inkSecondary} size={16} />
      </View>
    );
  }
  return (
    <View style={[styles.primaryButton, styles.cardCta, { backgroundColor: color }]}>
      <Text style={styles.primaryButtonText}>{label.toUpperCase()}</Text>
      <ArrowRight color="#FFFFFF" size={16} />
    </View>
  );
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
            style={[styles.chip, { borderColor: active ? theme.accent : theme.panelBorder, backgroundColor: active ? theme.accentSoft : 'transparent' }]}>
            <Text style={[styles.chipText, { color: active ? theme.accent : theme.inkSecondary }]}>{progressLabels[candidate].toUpperCase()}</Text>
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
  chip: { minHeight: 28, justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 9 },
  chipText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  card: {
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 18,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardGrow: { minWidth: 280, flexBasis: 340, flexGrow: 1 },
  cardAccent: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4 },
  pressed: { opacity: 0.75 },
  sectionHeading: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 2 },
  sectionIndex: { fontSize: 11, fontWeight: '900' },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { maxWidth: 760, marginTop: 3, fontSize: 11, lineHeight: 16 },
  eyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  primaryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 6,
    paddingHorizontal: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  cardCta: { marginTop: 4 },
  quietCta: { borderWidth: 1 },
  body: { fontSize: 13, lineHeight: 19 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
