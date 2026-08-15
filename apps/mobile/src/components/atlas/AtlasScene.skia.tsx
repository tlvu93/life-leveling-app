/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  Points,
  RadialGradient,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  ATLAS_MAX_SCALE,
  ATLAS_MIN_SCALE,
  atlasNodeIndex,
  atlasRegions,
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
import { atlasVisual, domainVisuals, GLOW, nodeRadius, withAlpha } from '@/theme/atlas-style';
import { type AppTheme } from '@/theme/tokens';
import { concatEdgePaths, pointOnEdge, sparklePath, starPath } from './atlas-geometry';
import { AtlasNodeView, SpacedText, type AtlasFonts } from './atlas-node-renderers';
import type { AtlasCamera } from './use-atlas-camera';

// Route edges that carry a gold waypoint sparkle at their midpoint.
const GOLD_WAYPOINT_EDGE_IDS = new Set(['route-music', 'route-q1']);

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

function NodeHitTarget({ node, camera, onPress }: { node: AtlasGraphNode; camera: AtlasCamera; onPress: () => void }) {
  const hitSize = Math.max(48, nodeRadius(node) * 2);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: camera.x.value + node.x * camera.scale.value - hitSize / 2 },
      { translateY: camera.y.value + node.y * camera.scale.value - hitSize / 2 },
    ],
  }));

  return (
    <Animated.View style={[styles.hitTarget, { width: hitSize, height: hitSize }, animatedStyle]}>
      <Pressable
        accessibilityLabel={`${node.label.replace('|', ' ')}, ${node.kind}${node.status ? `, ${node.status}` : ''}`}
        accessibilityRole="button"
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

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
  const edges = useMemo(() => showcase ? atlasShowcaseEdges() : visibleAtlasEdges(semanticZoom, showGuide, progress), [progress, semanticZoom, showcase, showGuide]);

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

  const cameraTransform = useDerivedValue(() => [
    { translateX: camera.x.value },
    { translateY: camera.y.value },
    { scale: camera.scale.value },
  ]);
  const pulse = useSharedValue(0.25);
  const routeProgress = useSharedValue(0);
  const pulseOpacity = useDerivedValue(() => 0.28 + pulse.value * 0.55);
  const dustOpacity = useDerivedValue(() => 0.42 + pulse.value * 0.18);
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

  useEffect(() => {
    if (freeze) {
      // Deterministic capture mode: pin the loops mid-phase so screenshots are reproducible.
      pulse.value = 0.55;
      routeProgress.value = 0.35;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    routeProgress.value = withRepeat(withTiming(1, { duration: 3600 }), -1, false);
  }, [freeze, pulse, routeProgress]);

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
    .onEnd(() => runOnJS(camera.settle)());

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
    .onEnd(() => runOnJS(camera.settle)());

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  if (!fonts) return <View style={styles.root} />;

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root} testID="atlas-scene">
        <Canvas accessibilityLabel="Interactive Life Atlas" style={StyleSheet.absoluteFill}>
          <Group transform={cameraTransform}>
            <Group opacity={dustOpacity}>
              <Points points={tinyStarPoints} mode="points" strokeWidth={1.3} strokeCap="round" color={visual.starTiny} />
              {atlasStars.medium.map((star, index) => (
                <Group key={`star-m-${index}`} opacity={star.opacity}>
                  <Circle cx={star.x} cy={star.y} r={star.radius * 2.4} color={visual.starMedium} opacity={0.22} />
                  <Circle cx={star.x} cy={star.y} r={star.radius} color={visual.starMedium} />
                </Group>
              ))}
              {atlasStars.flare.map((star, index) => (
                <Group key={`star-f-${index}`} opacity={star.opacity}>
                  <Circle cx={star.x} cy={star.y} r={star.radius * 0.45} color={visual.starFlare} opacity={0.28} />
                  <Path path={sparklePath(star.x, star.y, star.radius, 0.08)} color={visual.starFlare} />
                  <Circle cx={star.x} cy={star.y} r={Math.max(1.1, star.radius * 0.14)} color={visual.starFlare} />
                </Group>
              ))}
            </Group>

            {atlasRegions.map((region) => {
              const domain = domainVisuals[region.id];
              const hub = atlasNodeIndex.get(region.id);
              const cx = hub?.x ?? region.labelX;
              const cy = hub?.y ?? region.labelY;
              return (
                <Circle key={`field-${region.id}`} cx={cx} cy={cy} r={250}>
                  <RadialGradient c={vec(cx, cy)} r={250} colors={[domain.nebula, withAlpha(domain.nebula, 0)]} />
                </Circle>
              );
            })}
            {atlasRegions.map((region) => (
              <SpacedText
                key={`label-${region.id}`}
                x={region.labelX}
                y={region.labelY}
                text={region.label}
                font={fonts.region}
                color={domainVisuals[region.id].core}
                halo={visual.regionLabelHalo}
              />
            ))}

            {relationWebs.map(({ cluster, path }) => (
              <Group key={`web-${cluster}`}>
                <Path path={path} color={domainVisuals[cluster].web} style="stroke" strokeWidth={2.4} opacity={0.4}>
                  <BlurMask blur={GLOW.edgeWeb} style="normal" />
                </Path>
                <Path path={path} color={domainVisuals[cluster].web} style="stroke" strokeWidth={0.9} opacity={0.75} />
              </Group>
            ))}
            {guideRoutes.map(({ routeId, path }) => {
              const color = visual.navigatorPalette[routeId] ?? visual.navigatorFallback;
              return (
                <Group key={`guide-${routeId}`}>
                  <Path path={path} color={color} style="stroke" strokeWidth={3.2} opacity={0.25}>
                    <BlurMask blur={2} style="normal" />
                  </Path>
                  <Path path={path} color={color} style="stroke" strokeWidth={1.5} opacity={0.85}>
                    <DashPathEffect intervals={[7, 6]} />
                  </Path>
                </Group>
              );
            })}
            {personalPath !== '' && (
              <Group>
                <Path path={personalPath} color={visual.routeBloom} style="stroke" strokeWidth={14} strokeCap="round" opacity={0.7}>
                  <BlurMask blur={GLOW.routeWide} style="normal" />
                </Path>
                <Path path={personalPath} color={visual.routeSoft} style="stroke" strokeWidth={6} strokeCap="round" opacity={0.85}>
                  <BlurMask blur={GLOW.routeMid} style="normal" />
                </Path>
                <Path path={personalPath} color={visual.routeCore} style="stroke" strokeWidth={3} strokeCap="round" />
                {personalBeads.map((bead, index) => (
                  <Group key={`bead-${index}`}>
                    <Circle cx={bead.x} cy={bead.y} r={4.5} color={visual.routeCore} opacity={0.85}>
                      <BlurMask blur={GLOW.bead} style="normal" />
                    </Circle>
                    <Circle cx={bead.x} cy={bead.y} r={2} color={visual.routeCore} />
                  </Group>
                ))}
                {goldWaypoints.map((point, index) => (
                  <Group key={`waypoint-${index}`}>
                    <Circle cx={point.x} cy={point.y} r={7} color={visual.waypoint} opacity={0.65}>
                      <BlurMask blur={5} style="normal" />
                    </Circle>
                    <Path path={starPath(point.x, point.y, 4, 7.5, 3)} color={visual.waypoint} />
                  </Group>
                ))}
              </Group>
            )}

            <Circle cx={particleX} cy={particleY} r={7} color={visual.routeBloom}>
              <BlurMask blur={4} style="normal" />
            </Circle>
            <Circle cx={particleX} cy={particleY} r={3.2} color={visual.routeCore} />

            {visibleNodes.map((node) => (
              <AtlasNodeView key={node.id} node={node} selected={selectedId === node.id} theme={theme} visual={visual} fonts={fonts} pulseOpacity={pulseOpacity} thinLabels={showcase} />
            ))}
          </Group>
        </Canvas>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {visibleNodes.map((node) => (
            <NodeHitTarget key={node.id} node={node} camera={camera} onPress={() => onNodePress(node)} />
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  hitTarget: { position: 'absolute', left: 0, top: 0 },
});
