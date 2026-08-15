/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import {
  Canvas,
  Circle,
  Group,
  Picture,
  Points,
  Skia,
  drawAsPicture,
  useFont,
  vec,
  type SkPicture,
} from '@shopify/react-native-skia';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  ATLAS_MAX_SCALE,
  ATLAS_MIN_SCALE,
  atlasNodeIndex,
  atlasShowcaseEdges,
  atlasShowcaseNodes,
  atlasStars,
  cameraTranslationForAnchor,
  visibleAtlasEdges,
  visibleAtlasNodes,
  type AtlasCluster,
  type AtlasGraphEdge,
  type AtlasProgress,
  type AtlasGraphNode,
  type AtlasZoom,
} from '@/domain/atlas';
import { defaultAtlasDevFlags, type AtlasDevFlags } from '@/lib/atlas-dev-flags';
import { atlasVisual, nodeRadius } from '@/theme/atlas-style';
import { type AppTheme } from '@/theme/tokens';
import { concatEdgePaths, pointOnEdge } from './atlas-geometry';
import { SelectionRing, type AtlasFonts } from './atlas-node-renderers';
import { AtlasWorldScene } from './AtlasWorldScene';
import type { AtlasCamera } from './use-atlas-camera';

// Route edges that carry a gold waypoint sparkle at their midpoint.
const GOLD_WAYPOINT_EDGE_IDS = new Set(['route-music', 'route-q1']);

// Deterministic capture values (dev `static=1` flag and reduce-motion): the
// loops pin mid-phase so screenshots are reproducible.
const FREEZE_PULSE = 0.55;
const FREEZE_ROUTE_PROGRESS = 0.35;

export type AtlasSceneProps = {
  camera: AtlasCamera;
  semanticZoom: AtlasZoom;
  selectedId: string;
  showGuide: boolean;
  theme: AppTheme;
  onNodePress: (node: AtlasGraphNode) => void;
  progress: AtlasProgress;
  devFlags?: AtlasDevFlags;
};

/**
 * All node hit targets under ONE animated view. The zero-size root sits at the
 * scene origin, so RN's scale-about-center equals scale-about-world-(0,0) and
 * `[translateX, translateY, scale]` maps children placed at world coordinates
 * to their on-screen node positions. One useAnimatedStyle worklet runs per
 * camera frame instead of one per node (audit: 33-63 worklets + native
 * transform commits per pan frame).
 */
const NodeHitTargets = memo(function NodeHitTargets({ nodes, camera, onNodePress }: {
  nodes: AtlasGraphNode[];
  camera: AtlasCamera;
  onNodePress: (node: AtlasGraphNode) => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: camera.x.value },
      { translateY: camera.y.value },
      { scale: camera.scale.value },
    ],
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[styles.hitOrigin, animatedStyle]}>
      {nodes.map((node) => {
        // World-unit hit boxes (they scale with the camera). The floor keeps
        // small skill dots tappable at the zoom tiers where they exist.
        const hitSize = Math.max(52, nodeRadius(node) * 2 + 16);
        return (
          <Pressable
            key={node.id}
            accessibilityLabel={`${node.label.replace('|', ' ')}, ${node.kind}${node.status ? `, ${node.status}` : ''}`}
            accessibilityRole="button"
            onPress={() => onNodePress(node)}
            style={{
              position: 'absolute',
              left: node.x - hitSize / 2,
              top: node.y - hitSize / 2,
              width: hitSize,
              height: hitSize,
            }}
          />
        );
      })}
    </Animated.View>
  );
});

export default function AtlasScene({ camera, semanticZoom, selectedId, showGuide, theme, onNodePress, progress, devFlags = defaultAtlasDevFlags }: AtlasSceneProps) {
  const labelFont = useFont(Inter_600SemiBold, 11);
  const smallFont = useFont(Inter_600SemiBold, 10);
  const hubFont = useFont(Inter_800ExtraBold, 14);
  const regionFont = useFont(Inter_800ExtraBold, 16);
  const stepFont = useFont(Inter_800ExtraBold, 12);
  const fonts = useMemo<AtlasFonts | null>(() => labelFont && smallFont && hubFont && regionFont && stepFont
    ? { label: labelFont, small: smallFont, hub: hubFont, region: regionFont, step: stepFont }
    : null, [hubFont, labelFont, regionFont, smallFont, stepFont]);
  const { showcase, freeze } = devFlags;
  const visual = atlasVisual[theme.mode];
  const tinyStarPoints = useMemo(() => atlasStars.tiny.map((star) => vec(star.x, star.y)), []);
  const visibleNodes = useMemo(() => showcase ? atlasShowcaseNodes() : visibleAtlasNodes(semanticZoom, progress), [progress, semanticZoom, showcase]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const edges = useMemo(
    () => showcase ? atlasShowcaseEdges() : visibleAtlasEdges(semanticZoom, showGuide, progress, visibleNodeIds),
    [progress, semanticZoom, showcase, showGuide, visibleNodeIds],
  );
  const selectedNode = useMemo(() => visibleNodes.find((node) => node.id === selectedId) ?? null, [selectedId, visibleNodes]);

  // Constellation webs: one concatenated path per cluster keeps glow passes cheap.
  const relationWebs = useMemo(() => {
    const buckets = new Map<AtlasCluster, AtlasGraphEdge[]>();
    for (const edge of edges) {
      if (edge.kind !== 'relation') continue;
      const cluster = atlasNodeIndex.get(edge.to)?.cluster ?? atlasNodeIndex.get(edge.from)?.cluster ?? 'crossroads';
      const bucket = buckets.get(cluster) ?? [];
      bucket.push(edge);
      buckets.set(cluster, bucket);
    }
    return [...buckets.entries()].map(([cluster, list]) => ({ cluster, path: concatEdgePaths(list) }));
  }, [edges]);
  const guideRoutes = useMemo(() => {
    const buckets = new Map<string, AtlasGraphEdge[]>();
    for (const edge of edges) {
      if (edge.kind !== 'guide') continue;
      const key = edge.routeId ?? 'default';
      const bucket = buckets.get(key) ?? [];
      bucket.push(edge);
      buckets.set(key, bucket);
    }
    return [...buckets.entries()].map(([routeId, list]) => ({ routeId, path: concatEdgePaths(list) }));
  }, [edges]);
  const personalEdges = useMemo(() => edges.filter((edge) => edge.kind === 'personal'), [edges]);
  const personalPath = useMemo(() => concatEdgePaths(personalEdges), [personalEdges]);
  const personalBeads = useMemo(
    () => personalEdges.map((edge) => pointOnEdge(edge, 0.5)).filter((point): point is { x: number; y: number } => point !== null),
    [personalEdges],
  );
  const goldWaypoints = useMemo(
    () => personalEdges.filter((edge) => GOLD_WAYPOINT_EDGE_IDS.has(edge.id)).map((edge) => pointOnEdge(edge, 0.5)).filter((point): point is { x: number; y: number } => point !== null),
    [personalEdges],
  );
  // The travelling particle follows the final approach into the milestone.
  const particleCurve = useMemo(() => {
    const edge = personalEdges.find((candidate) => candidate.to === 'mini-set') ?? personalEdges[0];
    if (!edge) return null;
    const from = atlasNodeIndex.get(edge.from);
    const to = atlasNodeIndex.get(edge.to);
    if (!from || !to) return null;
    const dx = to.x - from.x;
    return { fx: from.x, fy: from.y, c1x: from.x + dx * 0.42, c1y: from.y, c2x: to.x - dx * 0.42, c2y: to.y, tx: to.x, ty: to.y };
  }, [personalEdges]);

  // ---------------------------------------------------------------------------
  // World canvas: everything static-in-world-space, baked to one SkPicture.
  // INVARIANT: the ONLY SharedValue prop on this canvas is the camera
  // transform. One extra always-animating binding (a pulse, a particle) makes
  // RN Skia replay the whole display list at 60fps forever - keep animated
  // content on the overlay canvas below.
  // ---------------------------------------------------------------------------
  const worldElement = useMemo(() => fonts ? (
    <AtlasWorldScene
      visibleNodes={visibleNodes}
      relationWebs={relationWebs}
      guideRoutes={guideRoutes}
      personalPath={personalPath}
      personalBeads={personalBeads}
      goldWaypoints={goldWaypoints}
      tinyStarPoints={tinyStarPoints}
      selectedId={selectedId}
      theme={theme}
      visual={visual}
      fonts={fonts}
      thinLabels={showcase}
      semanticZoom={semanticZoom}
    />
  ) : null, [fonts, goldWaypoints, guideRoutes, personalBeads, personalPath, relationWebs, selectedId, semanticZoom, showcase, theme, tinyStarPoints, visibleNodes, visual]);

  const [worldPicture, setWorldPicture] = useState<SkPicture | null>(null);
  useEffect(() => {
    if (!worldElement) return;
    let live = true;
    // Cull rect: star field (-80,-60 to 1280,710) plus glow/label margins.
    const bounds = Skia.XYWHRect(-140, -120, 1520, 980);
    void drawAsPicture(worldElement, bounds).then((picture) => {
      if (live) setWorldPicture(picture);
    });
    return () => {
      live = false;
    };
  }, [worldElement]);

  const cameraTransform = useDerivedValue(() => [
    { translateX: camera.x.value },
    { translateY: camera.y.value },
    { scale: camera.scale.value },
  ]);
  const pulse = useSharedValue(FREEZE_PULSE);
  const routeProgress = useSharedValue(FREEZE_ROUTE_PROGRESS);
  const pulseOpacity = useDerivedValue(() => 0.28 + pulse.value * 0.55);
  // The world picture bakes the star layer at the freeze dust value; the
  // overlay re-draws the tiny-star batch brightening above that base, so the
  // twinkle survives while frozen captures stay pixel-identical to the bake.
  const twinkleOpacity = useDerivedValue(() => Math.max(0, (pulse.value - FREEZE_PULSE) * 0.18));
  const particleX = useDerivedValue(() => {
    if (!particleCurve) return -1000;
    const t = routeProgress.value;
    const u = 1 - t;
    return u * u * u * particleCurve.fx + 3 * u * u * t * particleCurve.c1x + 3 * u * t * t * particleCurve.c2x + t * t * t * particleCurve.tx;
  });
  const particleY = useDerivedValue(() => {
    if (!particleCurve) return -1000;
    const t = routeProgress.value;
    const u = 1 - t;
    return u * u * u * particleCurve.fy + 3 * u * u * t * particleCurve.c1y + 3 * u * t * t * particleCurve.c2y + t * t * t * particleCurve.ty;
  });
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);
  const pinchWorldX = useSharedValue(0);
  const pinchWorldY = useSharedValue(0);

  // Loops run only while the atlas is focused and motion is welcome; a covered
  // or blurred atlas costs zero frames (audit: they ran forever, even behind
  // pushed routes).
  const reducedMotion = useReducedMotion();
  const frozen = freeze || reducedMotion;
  useFocusEffect(useCallback(() => {
    if (frozen) {
      pulse.value = FREEZE_PULSE;
      routeProgress.value = FREEZE_ROUTE_PROGRESS;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    routeProgress.value = withRepeat(withTiming(1, { duration: 3600 }), -1, false);
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(routeProgress);
    };
  }, [frozen, pulse, routeProgress]));

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .minDistance(2)
    .onStart(() => {
      panStartX.value = camera.x.value;
      panStartY.value = camera.y.value;
    })
    .onUpdate((event) => {
      camera.x.value = panStartX.value + event.translationX;
      camera.y.value = panStartY.value + event.translationY;
    })
    .onEnd(() => camera.settle());

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      pinchStartScale.value = camera.scale.value;
      pinchWorldX.value = (event.focalX - camera.x.value) / camera.scale.value;
      pinchWorldY.value = (event.focalY - camera.y.value) / camera.scale.value;
    })
    .onUpdate((event) => {
      const nextScale = Math.min(ATLAS_MAX_SCALE, Math.max(ATLAS_MIN_SCALE, pinchStartScale.value * event.scale));
      const nextTranslation = cameraTranslationForAnchor(pinchWorldX.value, pinchWorldY.value, event.focalX, event.focalY, nextScale);
      camera.scale.value = nextScale;
      camera.x.value = nextTranslation.x;
      camera.y.value = nextTranslation.y;
    })
    .onEnd(() => camera.settle());

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  if (!fonts) return <View style={styles.root} />;

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root} testID="atlas-scene">
        <Canvas accessibilityLabel="Interactive Life Atlas" style={StyleSheet.absoluteFill}>
          <Group transform={cameraTransform}>
            {worldPicture && <Picture picture={worldPicture} />}
          </Group>
        </Canvas>

        {/* Overlay canvas: the few animated draws (twinkle, particle,
            selection ring). Cheap to replay at 60fps; keeps the world canvas
            idle between camera changes. */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group transform={cameraTransform}>
              <Group opacity={twinkleOpacity}>
                <Points points={tinyStarPoints} mode="points" strokeWidth={1.3} strokeCap="round" color={visual.starTiny} />
              </Group>
              <Circle cx={particleX} cy={particleY} r={8} color={visual.routeBloom} opacity={0.35} />
              <Circle cx={particleX} cy={particleY} r={5} color={visual.routeBloom} opacity={0.55} />
              <Circle cx={particleX} cy={particleY} r={3.2} color={visual.routeCore} />
              {selectedNode && <SelectionRing node={selectedNode} visual={visual} pulseOpacity={pulseOpacity} />}
            </Group>
          </Canvas>
        </View>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <NodeHitTargets nodes={visibleNodes} camera={camera} onNodePress={onNodePress} />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  hitOrigin: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'visible' },
});
