/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

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
  /** UI-thread worklet: clamp-settle the camera and notify a semantic-zoom band change. Call directly from gesture onEnd. */
  settle: () => void;
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
  // Last band delivered to React; settle/apply only cross the JS bridge when it changes.
  const lastNotifiedZoom = useSharedValue<AtlasZoom>(1);
  const initialized = useRef(false);

  const notifyZoomBand = useCallback((band: AtlasZoom) => {
    onSemanticZoom(band);
  }, [onSemanticZoom]);

  const applyCamera = useCallback((next: { x: number; y: number; scale: number }, animated = true) => {
    const band = semanticZoomForScale(next.scale);
    if (!animated) {
      x.value = next.x;
      y.value = next.y;
      scale.value = next.scale;
      lastNotifiedZoom.value = band;
      onSemanticZoom(band);
      return;
    }
    x.value = withTiming(next.x, { duration: 320 });
    y.value = withTiming(next.y, { duration: 320 });
    // Notify at tween END so the tier-change React commit doesn't stutter the
    // first frames of the camera animation (audit: button-zoom hitch).
    scale.value = withTiming(next.scale, { duration: 320 }, (finished) => {
      if (finished && lastNotifiedZoom.value !== band) {
        lastNotifiedZoom.value = band;
        runOnJS(notifyZoomBand)(band);
      }
    });
  }, [lastNotifiedZoom, notifyZoomBand, onSemanticZoom, scale, x, y]);

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

  // Runs entirely on the UI thread; the only JS-thread hop is the band-change
  // notification, and only when the band actually changed (audit: every gesture
  // end used to runOnJS into a settle that always called setState).
  const settle = useCallback(() => {
    'worklet';
    const next = clampAtlasCamera(x.value, y.value, width, height, scale.value);
    x.value = withTiming(next.x, { duration: 220 });
    y.value = withTiming(next.y, { duration: 220 });
    const band = semanticZoomForScale(scale.value);
    if (band !== lastNotifiedZoom.value) {
      lastNotifiedZoom.value = band;
      runOnJS(notifyZoomBand)(band);
    }
  }, [height, lastNotifiedZoom, notifyZoomBand, scale, width, x, y]);

  const viewportFocus = viewportFocusPoint(width, height);
  const zoomIn = useCallback(() => zoomAt(viewportFocus.x, viewportFocus.y, 0.4), [viewportFocus.x, viewportFocus.y, zoomAt]);
  const zoomOut = useCallback(() => zoomAt(viewportFocus.x, viewportFocus.y, -0.4), [viewportFocus.x, viewportFocus.y, zoomAt]);

  // Stable identity: hit-target styles and HUD callbacks depend on this object,
  // so a fresh literal per render would re-register every consumer (audit).
  return useMemo(() => ({
    x,
    y,
    scale,
    width,
    height,
    fitWorld,
    focusNode,
    zoomIn,
    zoomOut,
    zoomAt,
    settle,
  }), [fitWorld, focusNode, height, scale, settle, width, x, y, zoomAt, zoomIn, zoomOut]);
}

export function clampCameraTranslation(value: number, viewportSize: number, worldSize: number, scale: number) {
  'worklet';
  const margin = viewportSize * 0.36;
  const minimum = viewportSize - worldSize * scale - margin;
  const maximum = margin;
  return clamp(value, Math.min(minimum, maximum), Math.max(minimum, maximum));
}

export function clampAtlasCamera(x: number, y: number, width: number, height: number, scale: number) {
  'worklet';
  return {
    x: clampCameraTranslation(x, width, ATLAS_WORLD.width, scale),
    y: clampCameraTranslation(y, height, ATLAS_WORLD.height, scale),
  };
}
