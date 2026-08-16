import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { pathOverviewView } from './path-overview';

describe('pathOverviewView', () => {
  it('returns null for an unknown path', () => {
    expect(pathOverviewView(roadmapCatalog, 'ghost')).toBeNull();
  });
  it('lists the DJ/VJ overview, both guides, and four neighbors', () => {
    const vm = pathOverviewView(roadmapCatalog, 'djvj');
    expect(vm?.overview.settings.length).toBeGreaterThanOrEqual(4);
    expect(vm?.guides.map((g) => g.id).sort()).toEqual(['guide-club-first', 'guide-visual-first']);
    expect(vm?.guides.every((g) => g.audience.length > 0 && g.outcome.length > 0)).toBe(true);
    expect(vm?.neighbors).toHaveLength(4);
    expect(vm?.neighbors.every((n) => n.whatItIs.length > 0)).toBe(true);
  });
});
