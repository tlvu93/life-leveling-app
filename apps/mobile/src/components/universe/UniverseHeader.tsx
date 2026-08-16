import { Compass, Hexagon, Moon, Orbit, Sun } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLifeTheme } from '@/state/theme-context';

/**
 * The Atlas app header, wired to the roadmap instead of the Alpha journey.
 * The Alpha's own header stays untouched so its screens and e2e keep working.
 */
export function UniverseHeader({
  journeyLabel, marker, floating = true,
}: {
  journeyLabel: string;
  /** Level-style pips: an open assumption (decision A-009), not a commitment. */
  marker?: { label: string; filled: number; segments: number } | null;
  /** The canvas floats the header over the world; scrolling screens dock it. */
  floating?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { mode, theme, toggleMode } = useLifeTheme();
  const wide = Platform.OS === 'web' && width >= 1100;
  const showJourney = width >= 860;
  const compact = width < 420;

  return (
    <View
      testID="universe-header"
      style={[styles.header, floating && styles.floating, {
        height: 64 + insets.top,
        paddingTop: insets.top,
        borderBottomColor: theme.panelBorder,
        backgroundColor: theme.nav,
      }]}>
      <View style={[styles.brand, compact && styles.brandCompact]}>
        <View style={styles.brandMark}>
          <Hexagon color={theme.accent} size={30} strokeWidth={1.8} />
          <View style={styles.brandMarkInner}><Compass color={theme.accent} size={13} strokeWidth={2.2} /></View>
        </View>
        <Text style={[styles.brandName, { color: theme.navInk }]}>Life Leveling</Text>
      </View>

      {wide && (
        <View style={[styles.universeTab, { borderLeftColor: theme.panelBorder }]}>
          <View style={[styles.universeIcon, { backgroundColor: theme.accentSoft }]}>
            <Orbit color={theme.accent} size={16} strokeWidth={2.1} />
          </View>
          <Text style={[styles.universeLabel, { color: theme.navInk }]}>
            {mode === 'living' ? 'Living Universe' : 'Night Universe'}
          </Text>
          <View style={[styles.universeUnderline, { backgroundColor: theme.accent }]} />
        </View>
      )}

      <View style={styles.centerCluster}>
        {showJourney && (
          <View style={styles.journey}>
            <Compass color={theme.navInk} size={17} strokeWidth={1.8} />
            <Text testID="universe-header-journey" style={[styles.journeyLabel, { color: theme.navInk }]}>{journeyLabel}</Text>
          </View>
        )}
        {showJourney && marker && (
          <View style={styles.level}>
            <Text testID="universe-header-marker" style={[styles.levelLabel, { color: theme.navInk }]}>{marker.label}</Text>
            <View style={styles.levelSegments}>
              {Array.from({ length: marker.segments }, (_, index) => (
                <View
                  key={index}
                  style={[styles.levelSegment, { backgroundColor: index < marker.filled ? theme.accent : theme.panelBorder }]}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.profile, compact && styles.profileCompact]}>
        <Pressable
          accessibilityLabel={mode === 'living' ? 'Switch to Night Universe' : 'Switch to Living Universe'}
          accessibilityRole="button"
          hitSlop={6}
          onPress={toggleMode}
          style={({ pressed }) => [styles.themePill, { borderColor: theme.panelBorder, backgroundColor: theme.surface }, pressed && styles.pressed]}>
          <View style={[styles.themeDisc, mode === 'night' && { backgroundColor: '#2A2C3E' }]}>
            <Sun color={mode === 'night' ? '#FFFFFF' : theme.navInk} size={14} />
          </View>
          <View style={[styles.themeDisc, mode === 'living' && { backgroundColor: '#2A2C3E' }]}>
            <Moon color={mode === 'living' ? '#FFFFFF' : theme.navInk} size={14} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { zIndex: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  floating: { position: 'absolute', top: 0, right: 0, left: 0 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22 },
  brandCompact: { gap: 8, paddingHorizontal: 10 },
  brandMark: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  brandMarkInner: { position: 'absolute' },
  brandName: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  universeTab: { height: '100%', flexDirection: 'row', alignItems: 'center', gap: 9, borderLeftWidth: 1, paddingHorizontal: 24 },
  universeIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  universeLabel: { fontSize: 14, fontWeight: '700' },
  universeUnderline: { position: 'absolute', right: 16, bottom: 0, left: 16, height: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  centerCluster: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 },
  journey: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  journeyLabel: { fontSize: 13, fontWeight: '600' },
  level: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelLabel: { fontSize: 13, fontWeight: '600' },
  levelSegments: { flexDirection: 'row', gap: 3 },
  levelSegment: { width: 17, height: 7, borderRadius: 4 },
  profile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 22 },
  profileCompact: { paddingHorizontal: 10 },
  themePill: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 999, padding: 3 },
  themeDisc: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  pressed: { opacity: 0.62 },
});
