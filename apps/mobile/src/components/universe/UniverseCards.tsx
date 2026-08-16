import { BadgeCheck, Circle, CircleCheck, Hexagon, Octagon, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { UniverseVm } from '@/domain/roadmap/selectors/universe';
import { useLifeTheme } from '@/state/theme-context';
import { domainVisual } from './universe-visuals';

const VERIFIED_BLUE = '#3B82F6';

/** Bottom-left legend, in the Atlas card style, for the roadmap's own vocabulary. */
export function UniverseLegend() {
  const { theme } = useLifeTheme();
  const rows = [
    { icon: <Octagon color={theme.ink} size={13} strokeWidth={2} />, label: 'Foundation' },
    { icon: <Circle color={theme.ink} size={12} strokeWidth={2.2} />, label: 'Skill / Practice' },
    { icon: <Hexagon color={theme.ink} size={12} strokeWidth={2.1} />, label: 'Project' },
    { icon: <Star color={theme.ink} fill={theme.ink} size={13} />, label: 'Milestone' },
    { icon: <CircleCheck color={theme.success} size={13} strokeWidth={2.2} />, label: 'You have practised it' },
  ];

  return (
    <View pointerEvents="none" style={[styles.card, styles.legend, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]} testID="universe-legend">
      <Text style={[styles.cardTitle, { color: theme.accent }]}>LEGEND</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={styles.glyph}>{row.icon}</View>
          <Text style={[styles.label, { color: theme.ink }]}>{row.label}</Text>
        </View>
      ))}
      <View style={[styles.divider, { backgroundColor: theme.panelBorder }]} />
      <View style={styles.row}>
        <View style={styles.glyph}><View style={styles.journeyLine} /></View>
        <Text style={[styles.label, { color: theme.ink }]}>Your Journey</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.glyph, styles.dashes]}>
          {[0, 1, 2].map((index) => <View key={index} style={[styles.dash, { backgroundColor: theme.inkSecondary }]} />)}
        </View>
        <Text style={[styles.label, { color: theme.ink }]}>Depends on / related</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.glyph, styles.dashes]}>
          {[0, 1, 2].map((index) => <View key={index} style={[styles.dash, styles.bridgeDash, { backgroundColor: theme.amber }]} />)}
        </View>
        <Text style={[styles.label, { color: theme.ink }]}>Bridge to another world</Text>
      </View>
    </View>
  );
}

/** Top-right card: the Guides that run through the Paths in view. */
export function UniverseGuidesCard({ paths, guides, top }: {
  paths: UniverseVm['paths'];
  guides: { id: string; title: string; pathId: string; featured: boolean }[];
  top: number;
}) {
  const { theme } = useLifeTheme();
  const shown = guides.slice(0, 4);
  const domainOf = (pathId: string) => paths.find((p) => p.id === pathId);

  return (
    <View pointerEvents="none" style={[styles.card, styles.guides, { top, borderColor: theme.panelBorder, backgroundColor: theme.panel }]} testID="universe-guides">
      <Text style={[styles.cardTitle, { color: theme.ink }]}>
        Navigator Routes <Text style={{ color: theme.inkSecondary }}>(Community Guides)</Text>
      </Text>
      {shown.map((guide) => (
        <View key={guide.id} style={styles.row}>
          <View style={[styles.dashes, styles.guideDashes]}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[styles.dash, { backgroundColor: domainVisual(domainOf(guide.pathId)?.id === 'djvj' ? 'music' : 'technology').core }]} />
            ))}
          </View>
          <Text numberOfLines={1} style={[styles.guideLabel, { color: theme.ink }]}>{guide.title}</Text>
          {guide.featured && <BadgeCheck color="#FFFFFF" fill={VERIFIED_BLUE} size={15} />}
        </View>
      ))}
      <View style={styles.row}>
        <CircleCheck color={theme.success} size={14} strokeWidth={2.2} />
        <Text style={[styles.label, { color: theme.inkSecondary }]}>Featured routes are marked</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    zIndex: 30,
    gap: 9,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  legend: { left: 24, bottom: 108, minWidth: 196 },
  guides: { right: 24, minWidth: 250, maxWidth: 300 },
  cardTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4, marginBottom: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  glyph: { width: 24, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600' },
  guideLabel: { flex: 1, fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginVertical: 2 },
  journeyLine: {
    width: 24, height: 5, borderRadius: 3, backgroundColor: '#C9BCF7',
    shadowColor: '#8F76F0', shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
  },
  dashes: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  guideDashes: { width: 24 },
  dash: { width: 6, height: 2.4, borderRadius: 2 },
  bridgeDash: { width: 5 },
});
