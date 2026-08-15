import type { AtlasCluster, AtlasNodeKind } from '@/domain/atlas';
import type { ThemeMode } from '@/theme/tokens';

// Visual recipe layer for the "Living Universe" atlas. Every color, radius,
// and blur the scene renderers use lives here so the look can be tuned in one
// place. Target reference: apps/mobile/.tmp/mock.png (see
// docs/v2/atlas-visual-rubric.md for the acceptance rubric).

/** Returns an rgba() color with its alpha replaced; accepts rgba strings only. */
export function withAlpha(rgba: string, alpha: number): string {
  return rgba.replace(/,\s*[\d.]+\)\s*$/, `, ${alpha})`);
}

export type DomainVisual = {
  core: string;    // node body base
  bright: string;  // rim + gradient highlight
  glow: string;    // outer halo
  web: string;     // constellation line color
  nebula: string;  // soft region field tint
};

export const domainVisuals: Record<AtlasCluster, DomainVisual> = {
  music: { core: '#E0554E', bright: '#FF9C8F', glow: 'rgba(255, 116, 102, 0.9)', web: 'rgba(255, 158, 148, 0.6)', nebula: 'rgba(238, 108, 96, 0.16)' },
  technology: { core: '#17AFC0', bright: '#7BEAF2', glow: 'rgba(64, 214, 228, 0.9)', web: 'rgba(126, 226, 236, 0.6)', nebula: 'rgba(35, 186, 201, 0.15)' },
  visual: { core: '#E39A2D', bright: '#FFCB70', glow: 'rgba(255, 182, 77, 0.9)', web: 'rgba(255, 203, 122, 0.6)', nebula: 'rgba(230, 160, 55, 0.15)' },
  nature: { core: '#4FA867', bright: '#93DFA8', glow: 'rgba(120, 214, 146, 0.9)', web: 'rgba(150, 222, 170, 0.6)', nebula: 'rgba(88, 178, 112, 0.15)' },
  movement: { core: '#4E8FD8', bright: '#8FC2F5', glow: 'rgba(112, 176, 240, 0.9)', web: 'rgba(150, 198, 244, 0.6)', nebula: 'rgba(86, 148, 220, 0.15)' },
  purpose: { core: '#7C5CE8', bright: '#B49AF8', glow: 'rgba(150, 118, 244, 0.9)', web: 'rgba(178, 152, 246, 0.6)', nebula: 'rgba(128, 96, 236, 0.16)' },
  crossroads: { core: '#7C5CE8', bright: '#B49AF8', glow: 'rgba(150, 118, 244, 0.9)', web: 'rgba(178, 152, 246, 0.55)', nebula: 'rgba(128, 96, 236, 0.12)' },
};

export type NodeGeometry = { radius: number; glowBlur: number; glowOpacity: number; rimWidth: number };

export const NODE_GEOMETRY: Record<AtlasNodeKind, NodeGeometry> = {
  interest: { radius: 28, glowBlur: 16, glowOpacity: 0.85, rimWidth: 2.5 },
  path: { radius: 22, glowBlur: 12, glowOpacity: 0.9, rimWidth: 2 },
  milestone: { radius: 20, glowBlur: 12, glowOpacity: 0.9, rimWidth: 2 },
  quest: { radius: 14, glowBlur: 8, glowOpacity: 0.85, rimWidth: 1.5 },
  nearby: { radius: 12, glowBlur: 7, glowOpacity: 0.6, rimWidth: 1.5 },
  skill: { radius: 8, glowBlur: 5, glowOpacity: 0.8, rimWidth: 1.25 },
};

/** World-space radius for a node; preview ("nearby") paths render smaller. */
export function nodeRadius(node: { kind: AtlasNodeKind; status?: string }): number {
  const base = NODE_GEOMETRY[node.kind].radius;
  if (node.kind === 'path' && node.status === 'nearby') return Math.round(base * 0.75);
  return base;
}

// BlurMask sigmas shared by non-node draws.
export const GLOW = {
  edgeWeb: 2.5,
  routeWide: 12,
  routeMid: 5,
  bead: 3,
  label: 3,
  regionLabel: 6,
  star: 2,
} as const;

export type AtlasVisualTheme = {
  starTiny: string;
  starMedium: string;
  starFlare: string;
  labelInk: string;
  labelHalo: string;
  regionLabelHalo: string;
  routeCore: string;
  routeSoft: string;
  routeBloom: string;
  markerFill: string;   // small-node badge fill
  selection: string;
  waypoint: string;     // gold route sparkle
  navigatorPalette: Record<string, string>;
  navigatorFallback: string;
};

export const atlasVisual: Record<ThemeMode, AtlasVisualTheme> = {
  living: {
    starTiny: 'rgba(255, 255, 255, 0.85)',
    starMedium: '#FFFFFF',
    starFlare: '#FFFFFF',
    labelInk: '#2A2C3A',
    labelHalo: 'rgba(255, 255, 255, 0.92)',
    regionLabelHalo: 'rgba(255, 255, 255, 0.85)',
    routeCore: '#FFFFFF',
    routeSoft: 'rgba(255, 255, 255, 0.85)',
    routeBloom: 'rgba(214, 204, 255, 0.6)',
    markerFill: '#FFFFFF',
    selection: '#8F76F0',
    waypoint: '#F5C242',
    navigatorPalette: {
      'live-av': '#5B6BE8',
      'sports-storyteller': '#E8A33C',
      'movement-maker': '#2FBFA8',
      'curiosity-sampler': '#C168E8',
    },
    navigatorFallback: '#5B6BE8',
  },
  night: {
    starTiny: 'rgba(220, 236, 214, 0.7)',
    starMedium: '#EAF6DF',
    starFlare: '#F4FFE8',
    labelInk: '#F2F6EF',
    labelHalo: 'rgba(3, 12, 8, 0.88)',
    regionLabelHalo: 'rgba(3, 12, 8, 0.8)',
    routeCore: '#C7F05A',
    routeSoft: 'rgba(199, 240, 90, 0.85)',
    routeBloom: 'rgba(199, 240, 90, 0.4)',
    markerFill: '#0B1510',
    selection: '#C7F05A',
    waypoint: '#F5C242',
    navigatorPalette: {
      'live-av': '#8487F0',
      'sports-storyteller': '#E8B45C',
      'movement-maker': '#4FD8C2',
      'curiosity-sampler': '#CE8DF2',
    },
    navigatorFallback: '#8487F0',
  },
};
