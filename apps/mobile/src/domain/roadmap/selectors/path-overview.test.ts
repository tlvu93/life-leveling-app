import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { pathOverviewView } from './path-overview';

describe('pathOverviewView', () => {
  it('returns null for an unknown path', () => {
    expect(pathOverviewView(roadmapCatalog, 'ghost')).toBeNull();
  });
  it('lists the DJ/VJ overview, both guides, and its curated neighbors', () => {
    const vm = pathOverviewView(roadmapCatalog, 'djvj');
    expect(vm?.overview.settings.length).toBeGreaterThanOrEqual(4);
    expect(vm?.guides.map((g) => g.id).sort()).toEqual(['guide-club-first', 'guide-visual-first']);
    expect(vm?.guides.every((g) => g.audience.length > 0 && g.outcome.length > 0)).toBe(true);
    expect(vm?.neighbors.filter((n) => n.via === 'curated').map((n) => n.id))
      .toEqual(['music-production', 'creative-coding-music', 'projection-mapping', 'event-technology']);
    expect(vm?.neighbors.every((n) => n.whatItIs.length > 0)).toBe(true);
  });
  it('surfaces bridge-reached paths as neighbors, so no bridged path looks isolated', () => {
    const bouldering = pathOverviewView(roadmapCatalog, 'bouldering');
    expect(bouldering?.neighbors.map((n) => n.id)).toEqual(['djvj']);
    expect(bouldering?.neighbors[0].via).toBe('bridge');
    expect(bouldering?.neighbors[0].bridgeNote).toContain('embodied practices');
  });
  it('never lists a path as its own neighbor and never duplicates one', () => {
    for (const path of roadmapCatalog.paths) {
      const vm = pathOverviewView(roadmapCatalog, path.id);
      const ids = vm?.neighbors.map((n) => n.id) ?? [];
      expect({ path: path.id, self: ids.includes(path.id), dupes: ids.length !== new Set(ids).size })
        .toEqual({ path: path.id, self: false, dupes: false });
    }
  });
});
