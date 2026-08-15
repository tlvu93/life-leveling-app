import { AlertTriangle, Compass, Hexagon, Moon, Orbit, RotateCcw, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clearEvidenceArtifacts } from '@/lib/evidence-storage';
import { useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

const LEVEL_SEGMENTS = 8;
const LEVEL_FILLED = 5;

export function AppHeader({ transparent = false }: { transparent?: boolean }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { mode, theme, toggleMode } = useLifeTheme();
  const { state, resetJourney } = useJourney();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const wide = Platform.OS === 'web' && width >= 1100;
  const showJourney = width >= 860;
  const compact = width < 420;
  const headerHeight = 64;

  const startOver = async () => {
    setResetting(true);
    setResetError(null);
    try {
      await clearEvidenceArtifacts();
      await resetJourney();
      setResetOpen(false);
      router.replace('/onboarding');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'The local journey could not be cleared.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <View style={[
      styles.header,
      transparent && styles.headerOverlay,
      {
        height: headerHeight + insets.top,
        paddingTop: insets.top,
        borderBottomColor: theme.panelBorder,
        backgroundColor: theme.nav,
      },
    ]} testID="app-header">
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
          <Text style={[styles.universeLabel, { color: theme.navInk }]}>{mode === 'living' ? 'Living Universe' : 'Night Universe'}</Text>
          <View style={[styles.universeUnderline, { backgroundColor: theme.accent }]} />
        </View>
      )}

      <View style={styles.centerCluster}>
        {showJourney && (
          <View style={styles.journey}>
            <Compass color={theme.navInk} size={17} strokeWidth={1.8} />
            <Text style={[styles.journeyLabel, { color: theme.navInk }]}>Journey 01</Text>
          </View>
        )}
        {showJourney && (
          <View style={styles.level}>
            <Text style={[styles.levelLabel, { color: theme.navInk }]}>Level 04</Text>
            <View style={styles.levelSegments}>
              {Array.from({ length: LEVEL_SEGMENTS }, (_, index) => (
                <View
                  key={index}
                  style={[styles.levelSegment, { backgroundColor: index < LEVEL_FILLED ? theme.accent : theme.panelBorder }]}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.profile, compact && styles.profileCompact]}>
        <Pressable
          accessibilityLabel={mode === 'living' ? 'Switch to Night Atlas' : 'Switch to Living Atlas'}
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
        {state.profile.completed && (
          <Pressable
            accessibilityLabel="Start over"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => setResetOpen(true)}
            style={({ pressed }) => [styles.headerButton, { borderColor: theme.panelBorder, backgroundColor: theme.surface }, pressed && styles.pressed]}>
            <RotateCcw color={theme.navInk} size={16} />
          </Pressable>
        )}
      </View>

      <Modal animationType={Platform.OS === 'web' ? 'none' : 'fade'} onRequestClose={() => !resetting && setResetOpen(false)} transparent visible={resetOpen}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Keep current journey" onPress={() => !resetting && setResetOpen(false)} style={StyleSheet.absoluteFill} />
          <View accessibilityRole="alert" style={[styles.resetDialog, { borderColor: theme.panelBorder, backgroundColor: theme.surfaceStrong }]} testID="reset-dialog">
            <View style={[styles.resetIcon, { backgroundColor: `${theme.coral}14` }]}><AlertTriangle color={theme.coral} size={23} /></View>
            <Text style={[styles.resetTitle, { color: theme.ink }]}>Start over?</Text>
            <Text style={[styles.resetText, { color: theme.inkSecondary }]}>This permanently removes your profile, active Path, Quest reflection, Atlas unlocks, and attached evidence from this device.</Text>
            {resetError && <Text accessibilityRole="alert" style={[styles.resetError, { color: theme.coral }]}>{resetError}</Text>}
            <View style={styles.resetActions}>
              <Pressable accessibilityRole="button" disabled={resetting} onPress={() => setResetOpen(false)} style={({ pressed }) => [styles.cancelButton, { borderColor: theme.panelBorder }, pressed && styles.pressed]}>
                <Text style={[styles.cancelText, { color: theme.ink }]}>KEEP JOURNEY</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={resetting} onPress={() => void startOver()} style={({ pressed }) => [styles.resetButton, { backgroundColor: theme.coral }, pressed && styles.pressed]}>
                {resetting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.resetButtonText}>DELETE & START OVER</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerOverlay: { position: 'absolute', top: 0, right: 0, left: 0 },
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
  headerButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 17 },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8, 18, 12, 0.52)', padding: 18 },
  resetDialog: { width: '100%', maxWidth: 440, borderWidth: 1, borderRadius: 14, padding: 20, shadowColor: '#101A14', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  resetIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  resetTitle: { marginTop: 15, fontSize: 23, fontWeight: '900' },
  resetText: { marginTop: 8, fontSize: 11, lineHeight: 17 },
  resetError: { marginTop: 10, fontSize: 9, lineHeight: 14 },
  resetActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15 },
  cancelText: { fontSize: 8, fontWeight: '900' },
  resetButton: { minWidth: 150, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 15 },
  resetButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  pressed: { opacity: 0.62 },
});
