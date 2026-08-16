import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ImageBackground, StyleSheet, useWindowDimensions, View } from 'react-native';

import atlasBackground from '@/assets/images/atlas-universe-bg.png';
import { RoadmapLoading } from '@/components/roadmap/pieces';
import { RoadmapNav } from '@/components/roadmap/RoadmapNav';
import UniverseScene from '@/components/universe/UniverseScene';
import { UniverseGuidesCard, UniverseLegend } from '@/components/universe/UniverseCards';
import { UniverseHeader } from '@/components/universe/UniverseHeader';
import { UniverseHud } from '@/components/universe/UniverseHud';
import { useUniverseCamera, type UniverseZoom } from '@/components/universe/use-universe-camera';
import { buildView } from '@/domain/roadmap/selectors/build';
import { universeView } from '@/domain/roadmap/selectors/universe';
import { layOutUniverse } from '@/domain/roadmap/universe-layout';
import { parseAtlasDevFlags } from '@/lib/atlas-dev-flags';
import { framingFlagsFrom } from '@/lib/framing-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';
import { atlasVisual } from '@/theme/atlas-style';
import { themes } from '@/theme/tokens';

const tierLabels: Record<UniverseZoom, string> = { 0: 'Regions', 1: 'Constellations', 2: 'Concepts' };

export default function UniverseScreen() {
  const params = useLocalSearchParams<{ theme?: string; marker?: string; framing?: string }>();
  const { theme: appTheme, mode: appMode } = useLifeTheme();
  // Honour the same `?theme=` override the Atlas uses, so the visual
  // verification loop can capture both appearances.
  const override = parseAtlasDevFlags(params).themeOverride;
  const mode = override ?? appMode;
  const theme = override ? themes[override] : appTheme;
  const visual = atlasVisual[mode];
  const { hydrated, state, catalog } = useRoadmap();
  const router = useRouter();
  // The window is the viewport here: measuring the container gave a zero height
  // inside the router's stack, which put the whole Universe off-screen.
  const viewport = useWindowDimensions();
  const [tier, setTier] = useState<UniverseZoom>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  const vm = useMemo(() => universeView(catalog, state), [catalog, state]);
  const layout = useMemo(() => layOutUniverse(vm), [vm]);
  const camera = useUniverseCamera(layout, viewport.width, viewport.height, setTier);

  const activeId = state.activeBuildId ?? state.builds[0]?.id ?? null;
  const journey = activeId ? buildView(catalog, state, activeId) : null;
  const stepNodeIds = useMemo(() => {
    const build = state.builds.find((b) => b.id === activeId);
    return new Map((build?.steps ?? []).map((step) => [step.id, step.nodeId]));
  }, [activeId, state.builds]);
  const routeNodeIds = useMemo(
    () => (journey?.steps ?? []).flatMap((step) => {
      const nodeId = stepNodeIds.get(step.stepId);
      return nodeId ? [nodeId] : [];
    }),
    [journey, stepNodeIds],
  );

  const visibleNodes = useMemo(() => vm.nodes.filter((node) => {
    if (tier >= 2) return true;
    if (tier === 1) return node.size !== 'minor';
    return node.size === 'major';
  }), [tier, vm.nodes]);

  const guides = useMemo(
    () => catalog.guides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      pathId: guide.pathId,
      featured: catalog.paths.some((p) => p.featuredGuideId === guide.id),
    })),
    [catalog.guides, catalog.paths],
  );

  if (!hydrated) return <RoadmapLoading />;

  const selected = selectedId ? vm.nodes.find((n) => n.id === selectedId) ?? null : null;
  const onPaths = selected ? catalog.paths.filter((p) => p.nodeIds.includes(selected.id)) : [];
  const description = selected ? catalog.nodes.find((n) => n.id === selected.id)?.description ?? '' : '';
  const selectedStep = selected
    ? (journey?.steps ?? []).find((step) => stepNodeIds.get(step.stepId) === selected.id)
    : undefined;
  const routeSteps = (journey?.steps ?? []).slice(0, 5).map((step) => ({
    label: step.nodeTitle,
    done: step.progressState === 'demonstrated' || step.progressState === 'practicing',
  }));
  const marker = framingFlagsFrom(params).marker
    ? { label: 'Explorer 04', filled: 5, segments: 8 }
    : null;

  return (
    <View
      testID="universe-screen"
      style={[styles.root, { width: viewport.width, height: viewport.height, backgroundColor: theme.surfaceStrong }]}>
      {/* The same cosmic ground the Atlas stands on, so the two read as one world. */}
      <ImageBackground source={atlasBackground} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.backgroundImage}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.canvasScrim }]} />
      </ImageBackground>

      {viewport.width > 0 && (
        <UniverseScene
          layout={layout}
          nodes={visibleNodes}
          relationships={vm.relationships}
          camera={camera}
          theme={theme}
          visual={visual}
          tier={tier}
          selectedId={selectedId}
          highlightedPathId={selected ? selected.clusterId : null}
          routeNodeIds={showRoute ? routeNodeIds : []}
          onNodePress={(nodeId) => { setSelectedId(nodeId); setPanelOpen(true); }}
        />
      )}

      <UniverseHeader journeyLabel={journey ? journey.title : 'No Journey yet'} marker={marker} />

      <UniverseHud
        camera={camera}
        tier={tier}
        tierLabel={tierLabels[tier]}
        selected={selected}
        description={description}
        onPaths={onPaths.map((p) => ({ id: p.id, title: p.title }))}
        routeSteps={routeSteps}
        journeyTitle={journey?.title ?? null}
        showRoute={showRoute}
        panelOpen={panelOpen && selected !== null}
        onToggleRoute={() => setShowRoute((open) => !open)}
        onOpenPanel={() => setPanelOpen(true)}
        onClosePanel={() => setPanelOpen(false)}
        onOpenPath={(pathId) => router.push(`/paths/${pathId}`)}
        onOpenStep={selectedStep ? () => router.push(`/journey/step/${selectedStep.stepId}`) : null}
      />

      {viewport.width >= 1100 && viewport.height >= 640 && (
        <>
          <UniverseLegend />
          <UniverseGuidesCard paths={vm.paths} guides={guides} top={92} />
        </>
      )}

      <RoadmapNav floating />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { width: '100%', height: '100%' },
});
