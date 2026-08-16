import type { NodeType, RelationshipKind } from '@/domain/roadmap/catalog';
import type { InterestId } from '@/domain/roadmap/ids';
import type { ProgressState } from '@/domain/roadmap/state';

export type DomainVisual = { core: string; bright: string; halo: string };

/**
 * Resolvers, not closed-union records: a domain or Node type the catalog gains
 * later renders in a sensible fallback instead of crashing on an undefined
 * lookup, which is how the Alpha's Record-keyed palettes would have failed.
 */
const domainPalette: Record<InterestId, DomainVisual> = {
  music: { core: '#E86555', bright: '#FF9C8A', halo: 'rgba(232,101,85,0.30)' },
  technology: { core: '#0798A6', bright: '#4FD3DE', halo: 'rgba(7,152,166,0.30)' },
  design: { core: '#D08A08', bright: '#FFC65C', halo: 'rgba(208,138,8,0.30)' },
  movement: { core: '#4F7BD3', bright: '#8FB2FF', halo: 'rgba(79,123,211,0.30)' },
  language: { core: '#7B87D3', bright: '#B0B8FF', halo: 'rgba(123,135,211,0.30)' },
  making: { core: '#4DA665', bright: '#8FE0A6', halo: 'rgba(77,166,101,0.30)' },
};

const fallbackDomain: DomainVisual = { core: '#8A8FA3', bright: '#C3C7D6', halo: 'rgba(138,143,163,0.28)' };

export function domainVisual(domainId: string): DomainVisual {
  return domainPalette[domainId as InterestId] ?? fallbackDomain;
}

export function nodeRimWidth(type: NodeType): number {
  switch (type) {
    case 'foundation': return 2.4;
    case 'milestone': return 2.2;
    case 'project': return 2;
    case 'resource': return 1.6;
    default: return 1.8;
  }
}

/** Milestones and projects read as destinations, so they get a polygon shell. */
export function isDestination(type: NodeType): boolean {
  return type === 'milestone' || type === 'project';
}

export const relationshipStyle: Record<RelationshipKind, { width: number; opacity: number; dash: number[] | null }> = {
  dependency: { width: 1.6, opacity: 0.5, dash: null },
  related: { width: 1.1, opacity: 0.32, dash: [3, 5] },
  bridge: { width: 2.2, opacity: 0.6, dash: [10, 7] },
};

const progressTint: Record<ProgressState, string | null> = {
  demonstrated: '#F2C14E',
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

export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
