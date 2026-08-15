import type { ThemeMode } from '@/theme/tokens';

export type AtlasDevFlags = {
  /** Render every atlas node and edge regardless of zoom or progress gating. */
  showcase: boolean;
  /** Pin the looping animations so screenshots are reproducible. */
  freeze: boolean;
  /** Force a theme on mount instead of the default. */
  themeOverride: ThemeMode | null;
  /** Show the frame-time HUD (UI-thread fps + dropped frames). */
  fps: boolean;
};

export const defaultAtlasDevFlags: AtlasDevFlags = {
  showcase: false,
  freeze: false,
  themeOverride: null,
  fps: false,
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Parses screenshot/dev URL params (`?showcase=1&static=1&theme=night`).
 * These are view-only flags for visual verification tooling; they never touch
 * persisted journey state. On native the params are absent, so defaults apply.
 */
export function parseAtlasDevFlags(params: Record<string, string | string[] | undefined>): AtlasDevFlags {
  const theme = firstValue(params.theme);
  return {
    showcase: firstValue(params.showcase) === '1',
    freeze: firstValue(params.static) === '1',
    themeOverride: theme === 'living' || theme === 'night' ? theme : null,
    fps: firstValue(params.fps) === '1',
  };
}
