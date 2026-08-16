/* eslint-disable react-hooks/immutability -- Reanimated SharedValues are mutable UI-thread state by design. */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import type { UniverseLayout } from '@/domain/roadmap/universe-layout';

export type UniverseZoom = 0 | 1 | 2;

export const UNIVERSE_MIN_SCALE = 0.16;
export const UNIVERSE_MAX_SCALE = 2.2;

/**
 * Tiers are relative to the scale that fits the whole Universe, so the same
 * gesture reveals the same amount of detail however large the catalog grows.
 */
export function universeZoomForScale(scale: number, fitScale: number): UniverseZoom {
  'worklet';
  const ratio = fitScale > 0 ? scale / fitScale : 1;
  return ratio < 1.6 ? 0 : ratio < 3 ? 1 : 2;
}

export type UniverseCamera = {
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
  /** UI-thread worklet: clamp, then cross to JS only when the tier changes. */
  settle: () => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function clampTranslation(value: number, viewportSize: number, worldSize: number, scale: number) {
  'worklet';
  const scaled = worldSize * scale;
  const margin = viewportSize * 0.36;
  if (scaled <= viewportSize) {
    const centred = (viewportSize - scaled) / 2;
    return clamp(value, centred - margin, centred + margin);
  }
  return clamp(value, viewportSize - scaled - margin, margin);
}

/**
 * Modelled on the Alpha camera, written against the Universe's own world box
 * and node index. The Alpha hook hard-codes its world size and asserts an Alpha
 * node id, so it cannot serve a second catalog.
 */
export function useUniverseCamera(
  layout: UniverseLayout,
  width: number,
  height: number,
  onZoomChange: (zoom: UniverseZoom) => void,
): UniverseCamera {
  const world = layout.world;
  const fitScale = Math.min(
    width > 0 ? (width - 48) / Math.max(world.width, 1) : 0.4,
    height > 0 ? (height - 48) / Math.max(world.height, 1) : 0.4,
  );
  const initialScale = clamp(fitScale || 0.4, UNIVERSE_MIN_SCALE, UNIVERSE_MAX_SCALE);

  const scale = useSharedValue(initialScale);
  const x = useSharedValue((width - world.width * initialScale) / 2);
  const y = useSharedValue((height - world.height * initialScale) / 2);
  const lastNotified = useSharedValue<UniverseZoom>(universeZoomForScale(initialScale, initialScale));
  /** The scale that currently fits the world; tiers are measured against it. */
  const fitScaleRef = useSharedValue(initialScale);
  /**
   * Where the scale is heading, not where the animation currently is. Reading
   * the live value would make quick repeated taps compound less than once each.
   */
  const targetScale = useSharedValue(initialScale);

  const notify = useCallback((zoom: UniverseZoom) => onZoomChange(zoom), [onZoomChange]);

  /**
   * The viewport is measured after mount, so the first camera values are
   * computed against zeros. Re-fit once real dimensions arrive, or the whole
   * Universe sits off-screen.
   */
  const fittedFor = useRef('');
  useEffect(() => {
    const key = `${width}x${height}x${world.width}x${world.height}`;
    if (width <= 0 || height <= 0 || fittedFor.current === key) return;
    fittedFor.current = key;
    const next = clamp(
      Math.min((width - 48) / Math.max(world.width, 1), (height - 48) / Math.max(world.height, 1)),
      UNIVERSE_MIN_SCALE,
      UNIVERSE_MAX_SCALE,
    );
    fitScaleRef.value = next;
    targetScale.value = next;
    scale.value = next;
    x.value = (width - world.width * next) / 2;
    y.value = (height - world.height * next) / 2;
    // Fitting the world is tier 0 by definition, which is the screen's initial
    // state, so there is nothing to notify — and notifying here would set state
    // synchronously inside an effect.
    lastNotified.value = universeZoomForScale(next, next);
  }, [fitScaleRef, targetScale, height, lastNotified, scale, width, world.height, world.width, x, y]);

  const settle = useCallback(() => {
    'worklet';
    x.value = withTiming(clampTranslation(x.value, width, world.width, scale.value), { duration: 200 });
    y.value = withTiming(clampTranslation(y.value, height, world.height, scale.value), { duration: 200 });
    targetScale.value = scale.value;
    const band = universeZoomForScale(scale.value, fitScaleRef.value);
    if (band !== lastNotified.value) {
      lastNotified.value = band;
      runOnJS(notify)(band);
    }
  }, [fitScaleRef, targetScale, height, lastNotified, notify, scale, width, world.height, world.width, x, y]);

  const applyScale = useCallback((nextScale: number, focalX: number, focalY: number) => {
    const clamped = clamp(nextScale, UNIVERSE_MIN_SCALE, UNIVERSE_MAX_SCALE);
    const worldX = (focalX - x.value) / scale.value;
    const worldY = (focalY - y.value) / scale.value;
    targetScale.value = clamped;
    scale.value = withTiming(clamped, { duration: 180 });
    x.value = withTiming(clampTranslation(focalX - worldX * clamped, width, world.width, clamped), { duration: 180 });
    y.value = withTiming(clampTranslation(focalY - worldY * clamped, height, world.height, clamped), { duration: 180 });
    const band = universeZoomForScale(clamped, fitScaleRef.value);
    if (band !== lastNotified.value) {
      lastNotified.value = band;
      notify(band);
    }
  }, [fitScaleRef, targetScale, height, lastNotified, notify, scale, width, world.height, world.width, x, y]);

  const fitWorld = useCallback(() => {
    const next = clamp(
      Math.min((width - 48) / Math.max(world.width, 1), (height - 48) / Math.max(world.height, 1)),
      UNIVERSE_MIN_SCALE,
      UNIVERSE_MAX_SCALE,
    );
    targetScale.value = next;
    scale.value = withTiming(next, { duration: 260 });
    x.value = withTiming((width - world.width * next) / 2, { duration: 260 });
    y.value = withTiming((height - world.height * next) / 2, { duration: 260 });
    const band = universeZoomForScale(next, fitScaleRef.value);
    if (band !== lastNotified.value) {
      lastNotified.value = band;
      notify(band);
    }
  }, [fitScaleRef, targetScale, height, lastNotified, notify, scale, width, world.height, world.width, x, y]);

  const focusNode = useCallback((id: string, requestedScale = 1.1) => {
    const seat = layout.byId.get(id);
    if (!seat) return;
    const next = clamp(requestedScale, UNIVERSE_MIN_SCALE, UNIVERSE_MAX_SCALE);
    targetScale.value = next;
    scale.value = withTiming(next, { duration: 260 });
    x.value = withTiming(clampTranslation(width / 2 - seat.x * next, width, world.width, next), { duration: 260 });
    y.value = withTiming(clampTranslation(height / 2 - seat.y * next, height, world.height, next), { duration: 260 });
    const band = universeZoomForScale(next, fitScaleRef.value);
    if (band !== lastNotified.value) {
      lastNotified.value = band;
      notify(band);
    }
  }, [fitScaleRef, targetScale, height, lastNotified, layout.byId, notify, scale, width, world.height, world.width, x, y]);

  return useMemo(() => ({
    x,
    y,
    scale,
    width,
    height,
    fitWorld,
    focusNode,
    zoomIn: () => applyScale(targetScale.value * 1.35, width / 2, height / 2),
    zoomOut: () => applyScale(targetScale.value / 1.35, width / 2, height / 2),
    zoomAt: (screenX: number, screenY: number, amount: number) => applyScale(targetScale.value * (1 + amount), screenX, screenY),
    settle,
  }), [applyScale, fitWorld, focusNode, height, scale, settle, targetScale, width, x, y]);
}
