import type { NodeType, RelationshipKind } from '@/domain/roadmap/catalog';
import type { InterestId } from '@/domain/roadmap/ids';
import type { ProgressState } from '@/domain/roadmap/state';
import { withAlpha, type DomainVisual } from '@/theme/atlas-style';

export { withAlpha };
export type { DomainVisual };

/**
 * The Living Universe recipe, mapped onto the roadmap's own domains. Same layer
 * vocabulary as the Atlas — core body, bright highlight, pale rim, deep inner
 * surface, outer glow, constellation line, nebula field — so the two scenes
 * read as one world.
 *
 * A resolver rather than a closed record: a domain the catalog gains later
 * renders in a neutral fallback instead of crashing on an undefined lookup.
 */
const domainPalette: Record<InterestId, DomainVisual> = {
  music: { core: '#E0554E', bright: '#FF9C8F', rim: '#FFE4DF', deep: 'rgba(150, 38, 32, 0.88)', glow: 'rgba(255, 116, 102, 0.9)', web: 'rgba(255, 158, 148, 0.6)', nebula: 'rgba(238, 108, 96, 0.16)' },
  technology: { core: '#087F8C', bright: '#7BEAF2', rim: '#BFFAFF', deep: 'rgba(3, 77, 86, 0.85)', glow: 'rgba(55, 221, 226, 0.9)', web: 'rgba(126, 226, 236, 0.6)', nebula: 'rgba(35, 186, 201, 0.15)' },
  design: { core: '#E39A2D', bright: '#FFCB70', rim: '#FFF1D6', deep: 'rgba(148, 90, 12, 0.86)', glow: 'rgba(255, 182, 77, 0.9)', web: 'rgba(255, 203, 122, 0.6)', nebula: 'rgba(230, 160, 55, 0.15)' },
  making: { core: '#4FA867', bright: '#93DFA8', rim: '#DFFFE8', deep: 'rgba(24, 94, 46, 0.86)', glow: 'rgba(120, 214, 146, 0.9)', web: 'rgba(150, 222, 170, 0.6)', nebula: 'rgba(88, 178, 112, 0.15)' },
  movement: { core: '#4E8FD8', bright: '#8FC2F5', rim: '#DCEFFF', deep: 'rgba(23, 76, 138, 0.86)', glow: 'rgba(112, 176, 240, 0.9)', web: 'rgba(150, 198, 244, 0.6)', nebula: 'rgba(86, 148, 220, 0.15)' },
  language: { core: '#7C5CE8', bright: '#B49AF8', rim: '#E9DFFF', deep: 'rgba(58, 30, 138, 0.86)', glow: 'rgba(150, 118, 244, 0.9)', web: 'rgba(178, 152, 246, 0.6)', nebula: 'rgba(128, 96, 236, 0.16)' },
};

const fallbackDomain: DomainVisual = {
  core: '#6C7A96', bright: '#B4C2D8', rim: '#E6ECF6', deep: 'rgba(38, 48, 68, 0.86)',
  glow: 'rgba(150, 168, 200, 0.85)', web: 'rgba(170, 186, 214, 0.55)', nebula: 'rgba(120, 140, 176, 0.14)',
};

export function domainVisual(domainId: string): DomainVisual {
  return domainPalette[domainId as InterestId] ?? fallbackDomain;
}

/** Milestones and projects are destinations, so they get a polygon shell. */
export function shellSidesFor(type: NodeType): number | null {
  if (type === 'milestone') return 7;
  if (type === 'project') return 6;
  if (type === 'foundation') return 8;
  return null;
}

export const relationshipStyle: Record<RelationshipKind, { width: number; opacity: number; dash: number[] | null }> = {
  dependency: { width: 1.7, opacity: 0.55, dash: null },
  related: { width: 1.2, opacity: 0.34, dash: [3, 5] },
  bridge: { width: 2.4, opacity: 0.75, dash: [11, 8] },
};

const progressTint: Record<ProgressState, string | null> = {
  demonstrated: '#F5C242',
  practicing: '#5BD6A6',
  tried: '#7FB3FF',
  interested: '#C3B5F5',
  paused: '#9AA3B8',
  skipped: null,
  'not-for-me': null,
};

/** Only engagement earns a ring; declining something is not a badge. */
export function progressRing(state: ProgressState | null): string | null {
  return state ? progressTint[state] : null;
}

/**
 * A deterministic star field over the world box — the same trick the Atlas
 * uses, so a reload never reshuffles the sky.
 */
export function starField(width: number, height: number) {
  const stars: { x: number; y: number; r: number }[] = [];
  const count = Math.min(520, Math.round((width * height) / 9000));
  for (let i = 0; i < count; i += 1) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const seed2 = Math.sin(i * 78.233) * 12345.6789;
    const seed3 = Math.sin(i * 3.1415) * 9876.54321;
    stars.push({
      x: (seed - Math.floor(seed)) * width,
      y: (seed2 - Math.floor(seed2)) * height,
      r: 0.6 + (seed3 - Math.floor(seed3)) * 1.5,
    });
  }
  return stars;
}
