import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import atlasBackground from '@/assets/images/atlas-universe-bg.png';
import { atlasVisual, withAlpha } from '@/theme/atlas-style';

import { progressLabels, RoadmapLoading } from '@/components/roadmap/pieces';
import UniverseScene from '@/components/universe/UniverseScene';
import { domainVisual } from '@/components/universe/universe-visuals';
import { useUniverseCamera, type UniverseZoom } from '@/components/universe/use-universe-camera';
import { buildView } from '@/domain/roadmap/selectors/build';
import { universeView } from '@/domain/roadmap/selectors/universe';
import { layOutUniverse } from '@/domain/roadmap/universe-layout';
import { parseAtlasDevFlags } from '@/lib/atlas-dev-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';
import { themes } from '@/theme/tokens';

const tierLabels: Record<UniverseZoom, string> = { 0: 'Regions', 1: 'Constellations', 2: 'Concepts' };

export default function UniverseScreen() {
  const params = useLocalSearchParams<{ theme?: string }>();
  const { theme: appTheme, mode: appMode } = useLifeTheme();
  // Honour the same `?theme=` override the Atlas uses, so the visual
  // verification loop can capture both appearances.
  const override = parseAtlasDevFlags(params).themeOverride;
  const mode = override ?? appMode;
  const theme = override ? themes[override] : appTheme;
  const visual = atlasVisual[mode];
  const { hydrated, state, catalog } = useRoadmap();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The window is the viewport here: measuring the container gave a zero height
  // inside the router's stack, which put the whole Universe off-screen.
  const viewport = useWindowDimensions();
  const [tier, setTier] = useState<UniverseZoom>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const vm = useMemo(() => universeView(catalog, state), [catalog, state]);
  const layout = useMemo(() => layOutUniverse(vm), [vm]);
  const camera = useUniverseCamera(layout, viewport.width, viewport.height, setTier);

  const activeId = state.activeBuildId ?? state.builds[0]?.id ?? null;
  const journey = activeId ? buildView(catalog, state, activeId) : null;
  const routeNodeIds = useMemo(() => {
    const build = state.builds.find((b) => b.id === activeId);
    if (!build) return [];
    const byStep = new Map(build.steps.map((s) => [s.id, s.nodeId]));
    return (journey?.steps ?? []).flatMap((step) => {
      const nodeId = byStep.get(step.stepId);
      return nodeId ? [nodeId] : [];
    });
  }, [activeId, journey, state.builds]);

  const visibleNodes = useMemo(() => vm.nodes.filter((node) => {
    if (tier >= 2) return true;
    if (tier === 1) return node.size !== 'minor';
    return node.size === 'major';
  }), [tier, vm.nodes]);

  if (!hydrated) return <RoadmapLoading />;

  const selected = selectedId ? vm.nodes.find((n) => n.id === selectedId) ?? null : null;
  const selectedPaths = selected
    ? catalog.paths.filter((p) => p.nodeIds.includes(selected.id))
    : [];
  const selectedStep = selected && journey
    ? journey.steps.find((step) => {
      const build = state.builds.find((b) => b.id === activeId);
      return build?.steps.find((s) => s.id === step.stepId)?.nodeId === selected.id;
    })
    : undefined;
  const description = selected ? catalog.nodes.find((n) => n.id === selected.id)?.description ?? '' : '';

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
          routeNodeIds={routeNodeIds}
          onNodePress={setSelectedId}
        />
      )}

      <View style={[styles.brand, { top: insets.top + 14 }]} pointerEvents="none">
        <Text style={[styles.brandText, { color: visual.labelInk }]}>Living Universe</Text>
        <Text style={[styles.brandSub, { color: withAlpha(visual.labelInk, 0.7) }]}>
          {`${vm.paths.length} Paths · ${vm.nodes.length} shared concepts`}
        </Text>
      </View>

      <View style={[styles.hud, { top: insets.top + 12 }]}>
        <Text testID="universe-tier" style={[styles.tier, { color: theme.ink, borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
          {tierLabels[tier]}
        </Text>
        <Pressable testID="universe-zoom-in" accessibilityLabel="Zoom in" onPress={camera.zoomIn} style={[styles.control, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
          <Text style={{ color: theme.ink }}>+</Text>
        </Pressable>
        <Pressable testID="universe-zoom-out" accessibilityLabel="Zoom out" onPress={camera.zoomOut} style={[styles.control, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
          <Text style={{ color: theme.ink }}>-</Text>
        </Pressable>
        <Pressable testID="universe-fit" accessibilityLabel="Fit the whole Universe" onPress={camera.fitWorld} style={[styles.control, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
          <Text style={[styles.controlLabel, { color: theme.ink }]}>Fit</Text>
        </Pressable>
        <Pressable testID="universe-back" accessibilityLabel="Back to Discover" onPress={() => router.push('/')} style={[styles.control, { borderColor: theme.panelBorder, backgroundColor: theme.panel }]}>
          <Text style={[styles.controlLabel, { color: theme.ink }]}>Exit</Text>
        </Pressable>
      </View>

      {selected && (
        <View testID="universe-inspector" style={[styles.inspector, { borderColor: theme.panelBorder, backgroundColor: theme.panel, bottom: insets.bottom + 16 }]}>
          <Text style={[styles.eyebrow, { color: domainVisual(selected.domainId).bright }]}>
            {`${selected.type.toUpperCase()} / ${selected.domainId.toUpperCase()}`}
          </Text>
          <Text testID="inspector-title" style={[styles.title, { color: theme.ink }]}>{selected.title}</Text>
          {description.length > 0 && <Text style={[styles.body, { color: theme.inkSecondary }]}>{description}</Text>}
          {selected.progressState && (
            <Text testID="inspector-progress" style={[styles.meta, { color: theme.accent }]}>
              {progressLabels[selected.progressState]}
            </Text>
          )}
          {selectedPaths.length > 0 && (
            <Text style={[styles.meta, { color: theme.inkSecondary }]}>
              {`On ${selectedPaths.map((p) => p.title).join(', ')}`}
            </Text>
          )}
          <View style={styles.actions}>
            {selectedStep && (
              <Pressable testID="inspector-open-step" accessibilityRole="button" onPress={() => router.push(`/journey/step/${selectedStep.stepId}`)}>
                <Text style={[styles.action, { color: theme.accent }]}>Open it in your Journey</Text>
              </Pressable>
            )}
            {selectedPaths[0] && (
              <Pressable testID="inspector-open-path" accessibilityRole="button" onPress={() => router.push(`/paths/${selectedPaths[0].id}`)}>
                <Text style={[styles.action, { color: theme.accent }]}>{`Open ${selectedPaths[0].title}`}</Text>
              </Pressable>
            )}
            <Pressable testID="inspector-close" accessibilityRole="button" onPress={() => setSelectedId(null)}>
              <Text style={[styles.action, { color: theme.inkSecondary }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { width: '100%', height: '100%' },
  brand: { position: 'absolute', left: 18 },
  brandText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.4 },
  brandSub: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  hud: { position: 'absolute', right: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tier: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, fontWeight: '700' },
  control: { borderWidth: 1, borderRadius: 999, minWidth: 34, height: 34, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  controlLabel: { fontSize: 12, fontWeight: '700' },
  inspector: { position: 'absolute', left: 14, right: 14, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6, maxWidth: 520 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 19 },
  meta: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 4 },
  action: { fontSize: 13, fontWeight: '700' },
});

