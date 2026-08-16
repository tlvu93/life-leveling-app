/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import { Canvas, Group, Picture, Skia, drawAsPicture, useFont, type SkPicture } from '@shopify/react-native-skia';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { memo, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { UniverseRelationship } from '@/domain/roadmap/catalog';
import type { NodeId } from '@/domain/roadmap/ids';
import type { UniverseNodeVm } from '@/domain/roadmap/selectors/universe';
import type { UniverseLayout } from '@/domain/roadmap/universe-layout';
import type { AppTheme } from '@/theme/tokens';
import { UniverseWorldScene } from './UniverseWorldScene';
import { UNIVERSE_MAX_SCALE, UNIVERSE_MIN_SCALE, type UniverseCamera, type UniverseZoom } from './use-universe-camera';

export type UniverseSceneProps = {
  layout: UniverseLayout;
  nodes: UniverseNodeVm[];
  relationships: UniverseRelationship[];
  camera: UniverseCamera;
  theme: AppTheme;
  tier: UniverseZoom;
  selectedId: NodeId | null;
  highlightedPathId: string | null;
  routeNodeIds: NodeId[];
  onNodePress: (nodeId: NodeId) => void;
};

/**
 * Every hit target lives under ONE zero-size animated parent at the world
 * origin, so a pan runs a single worklet instead of one per node.
 */
const HitTargets = memo(function HitTargets({
  layout, nodes, camera, onNodePress,
}: {
  layout: UniverseLayout;
  nodes: UniverseNodeVm[];
  camera: UniverseCamera;
  onNodePress: (nodeId: NodeId) => void;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: camera.x.value },
      { translateY: camera.y.value },
      { scale: camera.scale.value },
    ],
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[styles.hitOrigin, style]}>
      {nodes.map((node) => {
        const seat = layout.byId.get(node.id);
        if (!seat) return null;
        const size = Math.max(44, seat.radius * 2 + 14);
        return (
          <Pressable
            key={node.id}
            testID={`universe-node-${node.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${node.title}, ${node.type}${node.progressState ? `, ${node.progressState}` : ''}`}
            onPress={() => onNodePress(node.id)}
            style={{ position: 'absolute', left: seat.x - size / 2, top: seat.y - size / 2, width: size, height: size }}
          />
        );
      })}
    </Animated.View>
  );
});

export default function UniverseScene({
  layout, nodes, relationships, camera, theme, tier, selectedId, highlightedPathId, routeNodeIds, onNodePress,
}: UniverseSceneProps) {
  const label = useFont(Inter_600SemiBold, 12);
  const cluster = useFont(Inter_800ExtraBold, 16);
  const [picture, setPicture] = useState<SkPicture | null>(null);

  const worldElement = useMemo(() => {
    return (
      <UniverseWorldScene
        layout={layout}
        nodes={nodes}
        relationships={relationships}
        fonts={label && cluster ? { label, cluster } : null}
        theme={theme}
        selectedId={selectedId}
        highlightedPathId={highlightedPathId}
        routeNodeIds={routeNodeIds}
        tier={tier}
      />
    );
  }, [cluster, highlightedPathId, label, layout, nodes, relationships, routeNodeIds, selectedId, theme, tier]);

  useEffect(() => {
    if (!worldElement) return;
    let live = true;
    const bounds = Skia.XYWHRect(-80, -80, layout.world.width + 160, layout.world.height + 160);
    void drawAsPicture(worldElement, bounds).then((baked) => {
      if (live) setPicture(baked);
    });
    return () => { live = false; };
  }, [layout.world.height, layout.world.width, worldElement]);

  const cameraTransform = useDerivedValue(() => [
    { translateX: camera.x.value },
    { translateY: camera.y.value },
    { scale: camera.scale.value },
  ]);

  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);

  const pan = Gesture.Pan()
    .onStart(() => {
      panStartX.value = camera.x.value;
      panStartY.value = camera.y.value;
    })
    .onUpdate((event) => {
      camera.x.value = panStartX.value + event.translationX;
      camera.y.value = panStartY.value + event.translationY;
    })
    .onEnd(() => camera.settle());

  const pinch = Gesture.Pinch()
    .onStart(() => { pinchStartScale.value = camera.scale.value; })
    .onUpdate((event) => {
      const next = Math.min(Math.max(pinchStartScale.value * event.scale, UNIVERSE_MIN_SCALE), UNIVERSE_MAX_SCALE);
      camera.scale.value = next;
    })
    .onEnd(() => camera.settle());

  return (
    <View
      testID="universe-scene"
      style={styles.root}
      {...(Platform.OS === 'web'
        ? {
          onWheel: (event: { deltaY: number; clientX: number; clientY: number }) => {
            camera.zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? -0.16 : 0.16);
          },
        }
        : {})}>
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group transform={cameraTransform}>
              {/* The bake is an optimisation, not a prerequisite: draw the
                  world directly until the picture is ready. */}
              {picture ? <Picture picture={picture} /> : worldElement}
            </Group>
          </Canvas>
          <HitTargets layout={layout} nodes={nodes} camera={camera} onNodePress={onNodePress} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hitOrigin: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'visible' },
});
