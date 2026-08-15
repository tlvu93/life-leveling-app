import { BadgeCheck, CircleCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { atlasVisual } from '@/theme/atlas-style';
import { useLifeTheme } from '@/state/theme-context';

const VERIFIED_BLUE = '#3B7DE8';

// Top-right community routes card (wide viewports only): one dashed color
// sample per navigator route family, matching the map's dashed overlays.
export function NavigatorRoutesCard({ top }: { top: number }) {
  const { theme, mode } = useLifeTheme();
  const palette = atlasVisual[mode].navigatorPalette;
  const routes = [
    { name: 'Sound to Screen', color: palette['live-av'], verified: true },
    { name: 'Sports Storyteller', color: palette['sports-storyteller'], verified: true },
    { name: 'Movement Pattern Maker', color: palette['movement-maker'], verified: false },
  ];

  return (
    <View pointerEvents="none" style={[styles.card, { top, borderColor: theme.panelBorder, backgroundColor: theme.panel }]} testID="atlas-navigator-routes">
      <Text style={[styles.title, { color: theme.ink }]}>
        Navigator Routes <Text style={[styles.titleSoft, { color: theme.inkSecondary }]}>(Community Guides)</Text>
      </Text>
      {routes.map((route) => (
        <View key={route.name} style={styles.row}>
          <View style={styles.dashes}>
            {[0, 1, 2].map((index) => <View key={index} style={[styles.dash, { backgroundColor: route.color }]} />)}
          </View>
          <Text style={[styles.name, { color: theme.ink }]}>{route.name}</Text>
          {route.verified && <BadgeCheck color="#FFFFFF" fill={VERIFIED_BLUE} size={15} />}
        </View>
      ))}
      <View style={styles.row}>
        <View style={styles.dashes}>
          <CircleCheck color={theme.success} size={13} strokeWidth={2.2} />
        </View>
        <Text style={[styles.footer, { color: theme.inkSecondary }]}>Validated by experienced explorers</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    zIndex: 30,
    right: 24,
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minWidth: 250,
    shadowColor: '#2A2C55',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  titleSoft: { fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dashes: { width: 30, flexDirection: 'row', alignItems: 'center', gap: 3 },
  dash: { width: 7, height: 2.6, borderRadius: 2 },
  name: { flex: 1, fontSize: 11, fontWeight: '700' },
  footer: { flex: 1, fontSize: 10, fontWeight: '500' },
});
