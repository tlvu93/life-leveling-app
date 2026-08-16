import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { adoptGuide, setProgress } from '../ops';
import { defaultRoadmapState, type RoadmapState } from '../state';
import { strongestState, universeView } from './universe';

const seq = () => { let n = 0; return () => `id-${n++}`; };

function adopted(): RoadmapState {
  return adoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', seq(), 't0').state;
}

describe('strongestState', () => {
  it('ranks active states above resting ones', () => {
    expect(strongestState(['tried', 'demonstrated'])).toBe('demonstrated');
    expect(strongestState(['interested', 'practicing'])).toBe('practicing');
    expect(strongestState(['paused', 'tried'])).toBe('tried');
  });
  it('falls back to resting states only when nothing active exists', () => {
    expect(strongestState(['paused', 'skipped', 'not-for-me'])).toBe('paused');
    expect(strongestState(['skipped', 'not-for-me'])).toBe('skipped');
    expect(strongestState([])).toBeNull();
  });
  it('treats a pause as more engagement than bare curiosity', () => {
    expect(strongestState(['interested', 'paused'])).toBe('paused');
    expect(strongestState(['interested', 'skipped'])).toBe('interested');
  });
});

describe('universeView', () => {
  it('returns every shared node with layout, and excludes provisional nodes', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    expect(vm.nodes.some((n) => n.id === 'rhythm-song-structure')).toBe(true);
    expect(vm.nodes.some((n) => n.id === 'open-decks-etiquette')).toBe(false);
    const rhythm = vm.nodes.find((n) => n.id === 'rhythm-song-structure');
    expect(rhythm).toMatchObject({ domainId: 'music', clusterId: 'djvj', depth: 0, size: 'major', progressState: null });
  });
  it('lists only domains that have nodes, with labels', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    const ids = vm.domains.map((d) => d.id).sort();
    expect(ids).toEqual(['design', 'language', 'making', 'movement', 'music', 'technology']);
    expect(vm.domains.find((d) => d.id === 'music')?.label).toBe('Music');
  });
  it('overlays the strongest progress state per node across journeys', () => {
    let s = adopted();
    const rhythmStep = s.builds[0].steps.find((x) => x.nodeId === 'rhythm-song-structure');
    s = setProgress(s, rhythmStep?.id ?? '', { state: 'practicing', updatedAt: 't1', artifactIds: [] }).state;
    const vm = universeView(roadmapCatalog, s);
    expect(vm.nodes.find((n) => n.id === 'rhythm-song-structure')?.progressState).toBe('practicing');
    expect(vm.nodes.find((n) => n.id === 'mixing-technique')?.progressState).toBeNull();
  });
  it('drops relationships that touch an excluded node', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    const visible = new Set(vm.nodes.map((n) => n.id));
    for (const rel of vm.relationships) {
      expect({ rel: `${rel.from}->${rel.to}`, ok: visible.has(rel.from) && visible.has(rel.to) })
        .toEqual({ rel: `${rel.from}->${rel.to}`, ok: true });
    }
  });
  it('summarises paths including their featured guide', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    expect(vm.paths).toHaveLength(9);
    expect(vm.paths.find((p) => p.id === 'djvj')).toEqual({
      id: 'djvj', title: 'DJ/VJ and Live Audiovisual Performance', status: 'full', featuredGuideId: 'guide-club-first',
    });
  });
});
