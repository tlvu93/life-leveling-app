import { Circle, CircleCheck, CircleDot, Diamond, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useLifeTheme } from '@/state/theme-context';

// Bottom-left map legend card (wide viewports only), mirroring the mock's
// glyph rows plus the glowing journey-line and dashed navigator samples.
export function AtlasLegend() {
  const { theme } = useLifeTheme();
  const rows = [
    { icon: <Star color={theme.navInk} fill={theme.navInk} size={13} />, label: 'Interest (Constellation)' },
    { icon: <Circle color={theme.navInk} size={12} strokeWidth={2.2} />, label: 'Path (Route)' },
    { icon: <CircleDot color={theme.navInk} size={13} strokeWidth={2} />, label: 'Skill / Practice' },
    { icon: <Diamond color={theme.navInk} size={12} strokeWidth={2.1} />, label: 'Quest / Milestone' },
    { icon: <CircleCheck color={theme.success} size={13} strokeWidth={2.2} />, label: 'Completed' },
  ];

  return (
    <View pointerEvents="none" style={[styles.card, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]} testID="atlas-legend">
      <Text style={[styles.title, { color: theme.accent }]}>LEGEND</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={styles.glyph}>{row.icon}</View>
          <Text style={[styles.label, { color: theme.navInk }]}>{row.label}</Text>
        </View>
      ))}
      <View style={[styles.divider, { backgroundColor: theme.panelBorder }]} />
      <View style={styles.row}>
        <View style={styles.glyph}>
          <View style={styles.journeyLine} />
        </View>
        <Text style={[styles.label, { color: theme.navInk }]}>Your Journey</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.glyph, styles.dashes]}>
          {[0, 1, 2].map((index) => <View key={index} style={[styles.dash, { backgroundColor: theme.amber }]} />)}
        </View>
        <Text style={[styles.label, { color: theme.navInk }]}>Navigator Route</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    zIndex: 30,
    left: 24,
    gap: 9,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    minWidth: 172,
    bottom: 100,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  glyph: { width: 24, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, marginVertical: 2 },
  journeyLine: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C9BCF7',
    shadowColor: '#8F76F0',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  dashes: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  dash: { width: 6, height: 2.4, borderRadius: 2 },
});
