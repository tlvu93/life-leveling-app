import { AlertTriangle, Compass, MonitorPlay, Moon, RotateCcw, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clearEvidenceArtifacts } from '@/lib/evidence-storage';
import { useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';

export function AppHeader({ transparent = false }: { transparent?: boolean }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { mode, theme, toggleMode } = useLifeTheme();
  const { state, resetJourney } = useJourney();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const showExpedition = Platform.OS === 'web' && width >= 1100;
  const showLevel = width >= 460;
  const compact = width < 420;
  const headerHeight = showExpedition ? 72 : 60;

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
        borderBottomColor: transparent ? 'rgba(255,255,255,0.2)' : theme.borderSoft,
        backgroundColor: transparent ? theme.surface : theme.surfaceStrong,
      },
    ]} testID="app-header">
      <View style={[styles.brand, { height: headerHeight }, compact && styles.brandCompact]}>
        <View style={[styles.brandMark, compact && styles.brandMarkCompact, { borderColor: theme.green }]}>
          <Compass color={theme.green} size={21} strokeWidth={2.1} />
        </View>
        <View>
          <Text style={[styles.brandName, { color: theme.ink }]}>Life Leveling</Text>
          {!compact && <Text style={[styles.brandMode, { color: theme.green }]}>{mode === 'living' ? 'LIVING ATLAS' : 'NIGHT ATLAS'} / JOURNEY 01</Text>}
        </View>
      </View>

      {showExpedition && <View style={[styles.expedition, { borderLeftColor: theme.borderSoft, borderRightColor: theme.borderSoft }]}>
        <View style={[styles.expeditionMark, { borderColor: theme.coral, backgroundColor: `${theme.coral}12` }]}>
          <MonitorPlay color={theme.coral} size={18} strokeWidth={2} />
        </View>
        <View>
          <Text style={[styles.expeditionLabel, { color: theme.inkSecondary }]}>ACTIVE EXPEDITION</Text>
          <Text style={[styles.expeditionName, { color: theme.ink }]}>AV SIGNAL // FIELD TEST 01</Text>
        </View>
        <View style={[styles.artifactBadge, { borderColor: `${theme.green}70`, backgroundColor: `${theme.green}12` }]}>
          <Text style={[styles.artifactText, { color: theme.green }]}>ARTIFACT FOUND</Text>
        </View>
      </View>}

      <View style={[styles.profile, { height: headerHeight }, compact && styles.profileCompact]}>
        {showLevel && <View style={styles.level}>
          <Text style={[styles.levelLabel, { color: theme.inkSecondary }]}>LVL</Text>
          <Text style={[styles.levelValue, { color: theme.green }]}>04</Text>
        </View>}
        {showExpedition && <View style={[styles.levelTrack, { backgroundColor: theme.borderSoft }]}><View style={[styles.levelProgress, { backgroundColor: theme.green }]} /></View>}
        {showExpedition && <View style={[styles.avatar, { backgroundColor: `${theme.teal}18` }]}><Text style={[styles.avatarText, { color: theme.teal }]}>AK</Text></View>}
        <Pressable
          accessibilityLabel={mode === 'living' ? 'Switch to Night Atlas' : 'Switch to Living Atlas'}
          accessibilityRole="button"
          hitSlop={6}
          onPress={toggleMode}
          style={({ pressed }) => [styles.headerButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
          {mode === 'living' ? <Moon color={theme.ink} size={18} /> : <Sun color={theme.ink} size={18} />}
        </Pressable>
        {state.profile.completed && (
          <Pressable
            accessibilityLabel="Start over"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => setResetOpen(true)}
            style={({ pressed }) => [styles.headerButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
            <RotateCcw color={theme.ink} size={18} />
          </Pressable>
        )}
      </View>

      <Modal animationType={Platform.OS === 'web' ? 'none' : 'fade'} onRequestClose={() => !resetting && setResetOpen(false)} transparent visible={resetOpen}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Keep current journey" onPress={() => !resetting && setResetOpen(false)} style={StyleSheet.absoluteFill} />
          <View accessibilityRole="alert" style={[styles.resetDialog, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceStrong }]} testID="reset-dialog">
            <View style={[styles.resetIcon, { backgroundColor: `${theme.coral}14` }]}><AlertTriangle color={theme.coral} size={23} /></View>
            <Text style={[styles.resetTitle, { color: theme.ink }]}>Start over?</Text>
            <Text style={[styles.resetText, { color: theme.inkSecondary }]}>This permanently removes your profile, active Path, Quest reflection, Atlas unlocks, and attached evidence from this device.</Text>
            {resetError && <Text accessibilityRole="alert" style={[styles.resetError, { color: theme.coral }]}>{resetError}</Text>}
            <View style={styles.resetActions}>
              <Pressable accessibilityRole="button" disabled={resetting} onPress={() => setResetOpen(false)} style={({ pressed }) => [styles.cancelButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
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
  brand: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22 },
  brandCompact: { gap: 8, paddingHorizontal: 10 },
  brandMark: { width: 36, height: 36, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  brandMarkCompact: { width: 32, height: 32, borderRadius: 16 },
  brandName: { fontSize: 15, fontWeight: '700', letterSpacing: 0 },
  brandMode: { marginTop: 3, fontSize: 7, fontWeight: '600', letterSpacing: 0 },
  expedition: { width: 540, height: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 1, borderRightWidth: 1, paddingHorizontal: 22 },
  expeditionMark: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 4 },
  expeditionLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 0 },
  expeditionName: { marginTop: 3, fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  artifactBadge: { marginLeft: 'auto', borderWidth: 1, borderRadius: 0, paddingHorizontal: 9, paddingVertical: 6 },
  artifactText: { fontSize: 7, fontWeight: '900' },
  profile: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 22 },
  profileCompact: { paddingHorizontal: 10 },
  level: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginRight: 8 },
  levelLabel: { fontSize: 7, fontWeight: '700' },
  levelValue: { fontSize: 18, fontWeight: '800' },
  levelTrack: { width: 96, height: 4, marginRight: 4 },
  levelProgress: { width: '68%', height: 4 },
  avatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginRight: 3 },
  avatarText: { fontSize: 11, fontWeight: '900' },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 7 },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8, 18, 12, 0.52)', padding: 18 },
  resetDialog: { width: '100%', maxWidth: 440, borderWidth: 1, borderRadius: 8, padding: 20, shadowColor: '#101A14', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  resetIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  resetTitle: { marginTop: 15, fontSize: 23, fontWeight: '900' },
  resetText: { marginTop: 8, fontSize: 11, lineHeight: 17 },
  resetError: { marginTop: 10, fontSize: 9, lineHeight: 14 },
  resetActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5, paddingHorizontal: 15 },
  cancelText: { fontSize: 8, fontWeight: '900' },
  resetButton: { minWidth: 150, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5, paddingHorizontal: 15 },
  resetButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  pressed: { opacity: 0.62 },
});
