/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Path,
  Points,
  RoundedRect,
  Text as SkiaText,
  useFont,
  vec,
  type SkFont,
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
  type SharedValue,
} from 'react-native-reanimated';

import {
  ATLAS_MAX_SCALE,
  ATLAS_MIN_SCALE,
  atlasEdgePath,
  atlasRegions,
  atlasShowcaseEdges,
  atlasShowcaseNodes,
  atlasStars,
  cameraTranslationForAnchor,
  visibleAtlasEdges,
  visibleAtlasNodes,
  type AtlasProgress,
  type AtlasGraphNode,
  type AtlasZoom,
} from '@/domain/atlas';
import { defaultAtlasDevFlags, type AtlasDevFlags } from '@/lib/atlas-dev-flags';
import { atlasVisual } from '@/theme/atlas-style';
import { clusterColors, type AppTheme } from '@/theme/tokens';
import { sparklePath } from './atlas-geometry';
import type { AtlasCamera } from './use-atlas-camera';

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

type AtlasFonts = {
  label: SkFont;
  small: SkFont;
  hub: SkFont;
  region: SkFont;
  step: SkFont;
};

function nodeRadius(node: AtlasGraphNode) {
  if (node.kind === 'interest') return 28;
  if (node.kind === 'path') return node.status === 'nearby' ? 21 : 31;
  if (node.kind === 'milestone') return 24;
  if (node.kind === 'quest') return 19;
  if (node.kind === 'nearby') return 17;
  return 10;
}

function labelWidth(label: string, prominent: boolean, fonts: AtlasFonts) {
  const font = prominent ? fonts.hub : fonts.label;
  return font.getTextWidth(label);
}

function MarkerLabel({ node, color, theme, fonts }: { node: AtlasGraphNode; color: string; theme: AppTheme; fonts: AtlasFonts }) {
  const lines = node.label.split('|');
  const prominent = node.kind === 'interest' || (node.kind === 'path' && node.status !== 'nearby');
  const font = prominent ? fonts.hub : node.kind === 'milestone' ? fonts.label : fonts.small;
  const lineHeight = prominent ? 17 : node.kind === 'milestone' ? 12 : 10;
  const radius = nodeRadius(node);
  const right = node.labelSide === 'right';

  return (
    <Group>
      {lines.map((line, index) => {
        const width = labelWidth(line, prominent, fonts);
        const x = right ? node.x + radius + 9 : node.x - width / 2;
        const y = right ? node.y - ((lines.length - 1) * lineHeight) / 2 + index * lineHeight + 4 : node.y + radius + 18 + index * lineHeight;
        return (
          <Group key={`${node.id}-${line}`}>
            <SkiaText x={x + 1} y={y + 1} text={line} font={font} color={theme.mode === 'night' ? '#000000' : '#F7FAF8'} opacity={0.72} />
            <SkiaText x={x} y={y} text={line} font={font} color={prominent ? theme.ink : color === clusterColors.crossroads ? theme.ink : theme.ink} />
          </Group>
        );
      })}
    </Group>
  );
}

function InterestSymbol({ node, color }: { node: AtlasGraphNode; color: string }) {
  const x = node.x;
  const y = node.y;

  if (node.id === 'music') {
    return (
      <Group>
        <Path path={`M ${x - 5} ${y + 7} L ${x - 5} ${y - 10} L ${x + 9} ${y - 13} L ${x + 9} ${y + 3}`} color={color} style="stroke" strokeWidth={3} />
        <Line p1={vec(x - 5, y - 5)} p2={vec(x + 9, y - 8)} color={color} strokeWidth={3} />
        <Circle cx={x - 10} cy={y + 9} r={5} color={color} />
        <Circle cx={x + 4} cy={y + 5} r={5} color={color} />
      </Group>
    );
  }

  if (node.id === 'technology') {
    return (
      <Group>
        <RoundedRect x={x - 11} y={y - 11} width={22} height={22} r={4} color={color} style="stroke" strokeWidth={3} />
        <RoundedRect x={x - 5} y={y - 5} width={10} height={10} r={2} color={color} />
        {[-7, 0, 7].map((offset) => (
          <Group key={`technology-${offset}`}>
            <Line p1={vec(x + offset, y - 16)} p2={vec(x + offset, y - 11)} color={color} strokeWidth={2} />
            <Line p1={vec(x + offset, y + 11)} p2={vec(x + offset, y + 16)} color={color} strokeWidth={2} />
            <Line p1={vec(x - 16, y + offset)} p2={vec(x - 11, y + offset)} color={color} strokeWidth={2} />
            <Line p1={vec(x + 11, y + offset)} p2={vec(x + 16, y + offset)} color={color} strokeWidth={2} />
          </Group>
        ))}
      </Group>
    );
  }

  if (node.id === 'visual') {
    const palette = `M ${x + 13} ${y + 2} C ${x + 12} ${y + 14}, ${x + 2} ${y + 17}, ${x - 8} ${y + 13} C ${x - 20} ${y + 8}, ${x - 19} ${y - 8}, ${x - 9} ${y - 15} C ${x + 1} ${y - 22}, ${x + 17} ${y - 14}, ${x + 18} ${y - 4} C ${x + 19} ${y + 1}, ${x + 17} ${y + 3}, ${x + 13} ${y + 2} Z`;
    return (
      <Group>
        <Path path={palette} color={color} opacity={0.14} />
        <Path path={palette} color={color} style="stroke" strokeWidth={3} />
        <Circle cx={x - 8} cy={y - 8} r={2.8} color={color} />
        <Circle cx={x} cy={y - 11} r={2.8} color={color} />
        <Circle cx={x + 8} cy={y - 6} r={2.8} color={color} />
        <Circle cx={x - 7} cy={y + 2} r={2.8} color={color} />
      </Group>
    );
  }

  if (node.id === 'nature') {
    const leaf = `M ${x - 14} ${y + 12} C ${x - 12} ${y - 7}, ${x + 2} ${y - 17}, ${x + 16} ${y - 16} C ${x + 16} ${y + 1}, ${x + 7} ${y + 15}, ${x - 7} ${y + 14} C ${x - 10} ${y + 14}, ${x - 12} ${y + 13}, ${x - 14} ${y + 12} Z`;
    return (
      <Group>
        <Path path={leaf} color={color} opacity={0.13} />
        <Path path={leaf} color={color} style="stroke" strokeWidth={3} />
        <Path path={`M ${x - 12} ${y + 13} C ${x - 1} ${y + 5}, ${x + 3} ${y - 2}, ${x + 10} ${y - 10}`} color={color} style="stroke" strokeWidth={2.5} />
      </Group>
    );
  }

  if (node.id === 'movement') {
    return (
      <Group>
        <Path path={`M ${x - 16} ${y + 10} C ${x - 16} ${y - 8}, ${x - 8} ${y - 16}, ${x} ${y - 16} C ${x + 9} ${y - 16}, ${x + 16} ${y - 7}, ${x + 16} ${y + 10}`} color={color} style="stroke" strokeWidth={3} />
        <Line p1={vec(x - 10, y + 10)} p2={vec(x + 10, y + 10)} color={color} strokeWidth={3} />
        <Line p1={vec(x, y + 5)} p2={vec(x + 9, y - 6)} color={color} strokeWidth={3} />
        <Circle cx={x} cy={y + 5} r={3} color={color} />
      </Group>
    );
  }

  const heart = `M ${x} ${y + 14} C ${x - 4} ${y + 8}, ${x - 16} ${y + 1}, ${x - 16} ${y - 7} C ${x - 16} ${y - 17}, ${x - 3} ${y - 19}, ${x} ${y - 10} C ${x + 3} ${y - 19}, ${x + 16} ${y - 17}, ${x + 16} ${y - 7} C ${x + 16} ${y + 1}, ${x + 4} ${y + 8}, ${x} ${y + 14} Z`;
  return (
    <Group>
      <Path path={heart} color={color} opacity={0.13} />
      <Path path={heart} color={color} style="stroke" strokeWidth={3} />
      <Path path={`M ${x - 9} ${y + 3} L ${x - 3} ${y - 2} L ${x + 2} ${y + 2} L ${x + 9} ${y - 4}`} color={color} style="stroke" strokeWidth={2} />
    </Group>
  );
}

function AtlasNode({ node, selected, theme, pulseOpacity, fonts }: { node: AtlasGraphNode; selected: boolean; theme: AppTheme; pulseOpacity: SharedValue<number>; fonts: AtlasFonts }) {
  const color = clusterColors[node.cluster];
  const radius = nodeRadius(node);
  const markerFill = theme.mode === 'night' ? '#0B1510' : '#FAFCF9';

  if (node.kind === 'path') {
    const diamond = `M ${node.x} ${node.y - radius - 4} L ${node.x + radius + 4} ${node.y} L ${node.x} ${node.y + radius + 4} L ${node.x - radius - 4} ${node.y} Z`;
    const emphasized = selected || node.status !== 'nearby';
    const pathColor = emphasized ? theme.route : theme.border;
    return (
      <Group opacity={emphasized ? 1 : 0.58}>
        {selected && <Circle cx={node.x} cy={node.y} r={radius + 15} color={theme.focus} style="stroke" strokeWidth={2} opacity={pulseOpacity} />}
        {emphasized && <Path path={diamond} color={theme.routeGlow} style="stroke" strokeWidth={12} />}
        <Path path={diamond} color={markerFill} />
        <Path path={diamond} color={pathColor} style="stroke" strokeWidth={emphasized ? 3 : 2} />
        <Path path={`M ${node.x - 7} ${node.y - 17} L ${node.x + 2} ${node.y - 3} L ${node.x - 3} ${node.y - 3} L ${node.x + 8} ${node.y + 17} L ${node.x - 9} ${node.y + 2} L ${node.x - 2} ${node.y + 2} Z`} color={pathColor} />
        <MarkerLabel node={node} color={emphasized ? color : theme.inkSecondary} theme={theme} fonts={fonts} />
      </Group>
    );
  }

  if (node.kind === 'milestone') {
    const diamond = `M ${node.x} ${node.y - radius} L ${node.x + radius} ${node.y} L ${node.x} ${node.y + radius} L ${node.x - radius} ${node.y} Z`;
    return (
      <Group>
        {selected && <Circle cx={node.x} cy={node.y} r={radius + 13} color={theme.focus} style="stroke" strokeWidth={2} opacity={pulseOpacity} />}
        <Path path={diamond} color={markerFill} />
        <Path path={diamond} color={theme.pink} style="stroke" strokeWidth={3} />
        <Line p1={vec(node.x - 6, node.y + 10)} p2={vec(node.x - 6, node.y - 12)} color={theme.pink} strokeWidth={2} />
        <Path path={`M ${node.x - 5} ${node.y - 11} L ${node.x + 9} ${node.y - 7} L ${node.x - 5} ${node.y - 2} Z`} color={theme.pink} />
        <MarkerLabel node={node} color={color} theme={theme} fonts={fonts} />
      </Group>
    );
  }

  if (node.kind === 'quest') {
    const points = [
      [node.x - radius * 0.7, node.y - radius], [node.x + radius * 0.7, node.y - radius],
      [node.x + radius, node.y], [node.x + radius * 0.7, node.y + radius],
      [node.x - radius * 0.7, node.y + radius], [node.x - radius, node.y],
    ];
    const hex = `${points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ')} Z`;
    return (
      <Group>
        {selected && <Circle cx={node.x} cy={node.y} r={radius + 12} color={theme.focus} style="stroke" strokeWidth={2} opacity={pulseOpacity} />}
        <Path path={hex} color={theme.route} />
        <SkiaText x={node.x - fonts.step.getTextWidth(node.step ?? '') / 2} y={node.y + 4} text={node.step ?? ''} font={fonts.step} color="#FFFFFF" />
        <MarkerLabel node={node} color={color} theme={theme} fonts={fonts} />
      </Group>
    );
  }

  if (node.kind === 'interest') {
    return (
      <Group>
        <Circle cx={node.x} cy={node.y} r={radius + 10} color={color} opacity={selected ? pulseOpacity : 0.22} style="stroke" strokeWidth={2} />
        <RoundedRect x={node.x - radius} y={node.y - radius} width={radius * 2} height={radius * 2} r={9} color={markerFill} />
        <RoundedRect x={node.x - radius} y={node.y - radius} width={radius * 2} height={radius * 2} r={9} color={color} style="stroke" strokeWidth={3} />
        <InterestSymbol node={node} color={color} />
        <MarkerLabel node={node} color={color} theme={theme} fonts={fonts} />
      </Group>
    );
  }

  return (
    <Group>
      {selected && <Circle cx={node.x} cy={node.y} r={radius + 10} color={theme.focus} style="stroke" strokeWidth={2} opacity={pulseOpacity} />}
      <Circle cx={node.x} cy={node.y} r={radius + 3} color={markerFill} />
      <Circle cx={node.x} cy={node.y} r={radius} color={color} style="stroke" strokeWidth={node.kind === 'nearby' ? 2 : 2.5}>
        {node.kind === 'nearby' && <DashPathEffect intervals={[4, 4]} />}
      </Circle>
      <Circle cx={node.x} cy={node.y} r={node.status === 'completed' ? 4 : 2.8} color={node.status === 'completed' ? theme.success : color} />
      <MarkerLabel node={node} color={color} theme={theme} fonts={fonts} />
    </Group>
  );
}

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
  const labelFont = useFont(Inter_600SemiBold, 10);
  const smallFont = useFont(Inter_600SemiBold, 8);
  const hubFont = useFont(Inter_800ExtraBold, 14);
  const regionFont = useFont(Inter_800ExtraBold, 15);
  const stepFont = useFont(Inter_800ExtraBold, 12);
  const fonts = useMemo(() => labelFont && smallFont && hubFont && regionFont && stepFont
    ? { label: labelFont, small: smallFont, hub: hubFont, region: regionFont, step: stepFont }
    : null, [hubFont, labelFont, regionFont, smallFont, stepFont]);
  const { showcase, freeze } = devFlags;
  const visual = atlasVisual[theme.mode];
  const tinyStarPoints = useMemo(() => atlasStars.tiny.map((star) => vec(star.x, star.y)), []);
  const visibleNodes = useMemo(() => showcase ? atlasShowcaseNodes() : visibleAtlasNodes(semanticZoom, progress), [progress, semanticZoom, showcase]);
  const edges = useMemo(() => showcase ? atlasShowcaseEdges() : visibleAtlasEdges(semanticZoom, showGuide, progress), [progress, semanticZoom, showcase, showGuide]);
  const cameraTransform = useDerivedValue(() => [
    { translateX: camera.x.value },
    { translateY: camera.y.value },
    { scale: camera.scale.value },
  ]);
  const pulse = useSharedValue(0.25);
  const routeProgress = useSharedValue(0);
  const pulseOpacity = useDerivedValue(() => 0.28 + pulse.value * 0.55);
  const dustOpacity = useDerivedValue(() => 0.42 + pulse.value * 0.18);
  const particleX = useDerivedValue(() => 610 + (850 - 610) * routeProgress.value);
  const particleY = useDerivedValue(() => 350 + (118 - 350) * routeProgress.value);
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
              const color = clusterColors[region.id];
              return (
                <Group key={region.id}>
                  <Path path={region.path} color={color} opacity={theme.mode === 'night' ? 0.08 : 0.085} />
                  <Path path={region.path} color={color} opacity={0.4} style="stroke" strokeWidth={1.25} />
                  {semanticZoom < 2 && <SkiaText x={region.labelX} y={region.labelY} text={region.label} font={fonts.region} color={color} opacity={0.76} />}
                </Group>
              );
            })}

            {edges.filter((edge) => edge.kind === 'relation').map((edge) => (
              <Path key={edge.id} path={atlasEdgePath(edge)} color={theme.relation} style="stroke" strokeWidth={1.3} />
            ))}
            {edges.filter((edge) => edge.kind === 'guide').map((edge) => (
              <Path key={edge.id} path={atlasEdgePath(edge)} color={theme.guide} style="stroke" strokeWidth={2.4}>
                <DashPathEffect intervals={[8, 7]} />
              </Path>
            ))}
            {edges.filter((edge) => edge.kind === 'personal').map((edge) => (
              <Group key={edge.id}>
                <Path path={atlasEdgePath(edge)} color={theme.routeGlow} style="stroke" strokeWidth={11} />
                <Path path={atlasEdgePath(edge)} color={theme.route} style="stroke" strokeWidth={4.4} />
              </Group>
            ))}

            <Circle cx={particleX} cy={particleY} r={7} color={theme.routeGlow} />
            <Circle cx={particleX} cy={particleY} r={3.2} color={theme.route} />

            {visibleNodes.map((node) => (
              <AtlasNode key={node.id} node={node} selected={selectedId === node.id} theme={theme} pulseOpacity={pulseOpacity} fonts={fonts} />
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
