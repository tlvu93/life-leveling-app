/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import { useCallback, useEffect, useRef } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import {
  ATLAS_MAX_SCALE,
  ATLAS_MIN_SCALE,
  ATLAS_WORLD,
  atlasNodeIndex,
  clamp,
  fillWorldCamera,
  fitWorldCamera,
  focusedCamera,
  semanticZoomForScale,
  type AtlasZoom,
} from '@/domain/atlas';

export type AtlasCamera = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  width: number;
  height: number;
  fitWorld: () => void;
  focusNode: (id: string, requestedScale?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomAt: (screenX: number, screenY: number, amount: number) => void;
  settle: () => void;
  syncSemanticZoom: () => void;
};

function viewportFocusPoint(width: number, height: number) {
  return {
    x: width / 2 - (width >= 1100 ? 167 : 0),
    y: height / 2 + (height >= 680 ? 50 : 0),
  };
}

function focusedCameraForViewport(node: Parameters<typeof focusedCamera>[0], width: number, height: number, scale: number) {
  const next = focusedCamera(node, width, height, scale);
  const focus = viewportFocusPoint(width, height);
  return {
    ...next,
    x: next.x + focus.x - width / 2,
    y: next.y + focus.y - height / 2,
  };
}

export function useAtlasCamera(width: number, height: number, onSemanticZoom: (zoom: AtlasZoom) => void, initialNodeId = 'live-av', initialView: 'focus' | 'fit' | 'fill' = 'focus'): AtlasCamera {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(0.82);
  const initialized = useRef(false);

  const applyCamera = useCallback((next: { x: number; y: number; scale: number }, animated = true) => {
    const duration = animated ? 320 : 0;
    x.value = withTiming(next.x, { duration });
    y.value = withTiming(next.y, { duration });
    scale.value = withTiming(next.scale, { duration });
    onSemanticZoom(semanticZoomForScale(next.scale));
  }, [onSemanticZoom, scale, x, y]);

  useEffect(() => {
    if (!width || !height) return;
    if (!initialized.current) {
      if (initialView === 'fill') {
        applyCamera(fillWorldCamera(width, height, 64), false);
      } else if (initialView === 'fit') {
        applyCamera(fitWorldCamera(width, height, 36), false);
      } else {
        const initialScale = width < 600 ? 0.82 : width < 1000 ? 0.78 : 0.86;
        applyCamera(focusedCameraForViewport(atlasNodeIndex.get(initialNodeId) ?? atlasNodeIndex.get('live-av')!, width, height, initialScale), false);
      }
      initialized.current = true;
    }
  }, [applyCamera, height, initialNodeId, initialView, width]);

  const fitWorld = useCallback(() => applyCamera(fitWorldCamera(width, height, width < 600 ? 10 : 36)), [applyCamera, height, width]);

  const focusNode = useCallback((id: string, requestedScale = 1.42) => {
    const node = atlasNodeIndex.get(id);
    if (node) applyCamera(focusedCameraForViewport(node, width, height, requestedScale));
  }, [applyCamera, height, width]);

  const zoomAt = useCallback((screenX: number, screenY: number, amount: number) => {
    const oldScale = scale.value;
    const nextScale = clamp(oldScale + amount, ATLAS_MIN_SCALE, ATLAS_MAX_SCALE);
    const ratio = nextScale / oldScale;
    applyCamera({
      scale: nextScale,
      x: screenX - (screenX - x.value) * ratio,
      y: screenY - (screenY - y.value) * ratio,
    });
  }, [applyCamera, scale, x, y]);

  const settle = useCallback(() => {
    const next = clampAtlasCamera(x.value, y.value, width, height, scale.value);
    x.value = withTiming(next.x, { duration: 220 });
    y.value = withTiming(next.y, { duration: 220 });
    onSemanticZoom(semanticZoomForScale(scale.value));
  }, [height, onSemanticZoom, scale, width, x, y]);

  const syncSemanticZoom = useCallback(() => onSemanticZoom(semanticZoomForScale(scale.value)), [onSemanticZoom, scale]);
  const viewportFocus = viewportFocusPoint(width, height);

  return {
    x,
    y,
    scale,
    width,
    height,
    fitWorld,
    focusNode,
    zoomIn: () => zoomAt(viewportFocus.x, viewportFocus.y, 0.4),
    zoomOut: () => zoomAt(viewportFocus.x, viewportFocus.y, -0.4),
    zoomAt,
    settle,
    syncSemanticZoom,
  };
}

export function clampCameraTranslation(value: number, viewportSize: number, worldSize: number, scale: number) {
  const margin = viewportSize * 0.36;
  const minimum = viewportSize - worldSize * scale - margin;
  const maximum = margin;
  return clamp(value, Math.min(minimum, maximum), Math.max(minimum, maximum));
}

export function clampAtlasCamera(x: number, y: number, width: number, height: number, scale: number) {
  return {
    x: clampCameraTranslation(x, width, ATLAS_WORLD.width, scale),
    y: clampCameraTranslation(y, height, ATLAS_WORLD.height, scale),
  };
}
