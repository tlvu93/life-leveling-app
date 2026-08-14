import * as Haptics from 'expo-haptics';
import { ArrowRight, Check, Sparkles } from 'lucide-react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { AtlasHud } from '@/components/atlas/AtlasHud';
import AtlasScene from '@/components/atlas/AtlasScene';
import { useAtlasCamera } from '@/components/atlas/use-atlas-camera';
import { atlasNodesForProgress, type AtlasGraphNode, type AtlasProgress, type AtlasZoom } from '@/domain/atlas';
import { getPathExperience } from '@/domain/path-experiences';
import { useJourney } from '@/state/journey-context';
import { useLifeTheme } from '@/state/theme-context';
import atlasBackground from '@/assets/images/atlas-celestial-bg.png';

function AtlasExperience() {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const { state } = useJourney();
  const { reveal } = useLocalSearchParams<{ reveal?: string }>();
  const router = useRouter();
  const { theme } = useLifeTheme();
  const recommendation = state.branchRecommendation;
  const activePathId = state.selectedPathId ?? 'live-av';
  const firstQuestNodeId = state.selectedPathId ? getPathExperience(state.selectedPathId).quest.nodeId : 'make-track-visible';
  const stopped = state.quest.status === 'stopped';
  const resolved = state.quest.status === 'completed' || stopped;
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [semanticZoom, setSemanticZoom] = useState<AtlasZoom>(1);
  const [selectedId, setSelectedId] = useState(recommendation?.nodeId ?? activePathId);
  const [showGuide, setShowGuide] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [revealOpen, setRevealOpen] = useState(reveal === '1' && resolved);
  const camera = useAtlasCamera(viewport.width, viewport.height, setSemanticZoom, activePathId);
  const progress = useMemo<AtlasProgress>(() => ({
    pathStarted: state.selectedPathId !== null,
    activePathId: state.selectedPathId,
    firstQuestNodeId,
    questStatus: state.quest.status,
    unlockedNodeIds: state.unlockedNodeIds,
  }), [firstQuestNodeId, state.quest.status, state.selectedPathId, state.unlockedNodeIds]);
  const atlasNodes = useMemo(() => atlasNodesForProgress(progress), [progress]);
  const selectedNode = atlasNodes.find((node) => node.id === selectedId) ?? atlasNodes.find((node) => node.id === activePathId) ?? atlasNodes.find((node) => node.id === 'live-av')!;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: layoutWidth, height } = event.nativeEvent.layout;
    setViewport((current) => current.width === layoutWidth && current.height === height ? current : { width: layoutWidth, height });
  }, []);

  const selectNode = useCallback((node: AtlasGraphNode) => {
    setSelectedId(node.id);
    setPanelOpen(true);
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  }, []);

  return (
    <View onLayout={onLayout} style={styles.root} testID="atlas-screen">
      <ImageBackground source={atlasBackground} resizeMode="cover" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.canvasScrim }]} />
      </ImageBackground>
      {viewport.width > 0 && (
        <AtlasScene
          camera={camera}
          semanticZoom={semanticZoom}
          selectedId={selectedId}
          showGuide={showGuide}
          theme={theme}
          progress={progress}
          onNodePress={selectNode}
        />
      )}
      <AppHeader transparent />
      <AtlasHud
        camera={camera}
        selectedNode={selectedNode}
        semanticZoom={semanticZoom}
        showGuide={showGuide}
        panelOpen={panelOpen}
        pathStarted={progress.pathStarted}
        questStatus={progress.questStatus}
        recommendedNodeId={recommendation?.nodeId ?? null}
        onToggleGuide={() => setShowGuide((current) => !current)}
        onOpenPanel={() => setPanelOpen(true)}
        onClosePanel={() => setPanelOpen(false)}
      />
      {revealOpen && recommendation && (
        <View style={[styles.reveal, compact && styles.revealCompact, { borderColor: stopped ? theme.coral : theme.green, backgroundColor: theme.surfaceStrong }]} testID="atlas-reveal">
          <View style={[styles.revealIcon, { backgroundColor: `${stopped ? theme.coral : theme.green}16` }]}><Sparkles color={stopped ? theme.coral : theme.green} size={22} /></View>
          <View style={styles.revealCopy}>
            <Text style={[styles.revealLabel, { color: stopped ? theme.coral : theme.green }]}>{stopped ? 'ATTEMPT RECORDED · ATLAS REDIRECTED' : 'QUEST COMPLETED · ATLAS DEEPENED'}</Text>
            <Text style={[styles.revealTitle, { color: theme.ink }]}>{recommendation.title}</Text>
            <Text style={[styles.revealText, { color: theme.inkSecondary }]}>{recommendation.reason}</Text>
            <Text style={[styles.revealText, { color: theme.inkSecondary }]}>{recommendation.changeSummary}</Text>
            <Text style={[styles.revealText, { color: theme.inkSecondary }]}>{recommendation.whyDifferent}</Text>
            <View style={styles.unlocks}>
              {(stopped ? ['Quest attempted', 'Adjacent experiment'] : ['Quest completed', 'New branch', ...(recommendation.unlockedNodeIds.includes('mini-set') ? ['Milestone'] : [])]).map((item) => <View key={item} style={styles.unlock}><Check color={stopped ? theme.coral : theme.success} size={12} /><Text style={[styles.unlockText, { color: theme.inkSecondary }]}>{item}</Text></View>)}
            </View>
          </View>
          <View style={styles.revealActions}>
            <Pressable accessibilityRole="button" onPress={() => setRevealOpen(false)} style={({ pressed }) => [styles.revealButton, { backgroundColor: theme.green }, pressed && styles.pressed]}>
              <Text style={styles.revealButtonText}>EXPLORE UNLOCK</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/discover')} style={({ pressed }) => [styles.recommendButton, { borderColor: theme.borderSoft }, pressed && styles.pressed]}>
              <Text style={[styles.recommendButtonText, { color: theme.ink }]}>UPDATED PATHS</Text>
              <ArrowRight color={theme.ink} size={14} />
            </Pressable>
          </View>
        </View>
      )}
      <BottomNav />
    </View>
  );
}

export default function AtlasScreen() {
  const { hydrated, state } = useJourney();
  const { theme } = useLifeTheme();
  if (!hydrated) return <View style={[styles.loading, { backgroundColor: theme.surfaceStrong }]}><ActivityIndicator color={theme.green} /></View>;
  if (!state.profile.completed) return <Redirect href="/onboarding" />;
  return <AtlasExperience />;
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reveal: { position: 'absolute', zIndex: 55, right: 24, bottom: 92, left: 24, maxWidth: 820, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderRadius: 8, padding: 17, shadowColor: '#1E2B23', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  revealCompact: { right: 10, bottom: 78, left: 10, alignItems: 'stretch', flexDirection: 'column', gap: 10, padding: 14 },
  revealIcon: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  revealCopy: { minWidth: 210, flex: 1 },
  revealLabel: { fontSize: 8, fontWeight: '900' },
  revealTitle: { marginTop: 5, fontSize: 17, fontWeight: '900' },
  revealText: { marginTop: 5, fontSize: 9, lineHeight: 14 },
  unlocks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unlockText: { fontSize: 8, fontWeight: '700' },
  revealActions: { gap: 7 },
  revealButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 5, paddingHorizontal: 14 },
  revealButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  recommendButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 5, paddingHorizontal: 12 },
  recommendButtonText: { fontSize: 8, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
