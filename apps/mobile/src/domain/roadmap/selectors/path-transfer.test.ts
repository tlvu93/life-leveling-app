import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { adoptGuide, setProgress } from '../ops';
import { defaultRoadmapState, type ProgressState, type RoadmapState } from '../state';
import { pathTransferView } from './path-transfer';

const seq = () => { let n = 0; return () => `id-${n++}`; };

function withStates(pairs: [nodeId: string, state: ProgressState][]): RoadmapState {
  let s = adoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', seq(), 't0').state;
  for (const [nodeId, state] of pairs) {
    const step = s.builds[0].steps.find((x) => x.nodeId === nodeId);
    s = setProgress(s, step?.id ?? '', { state, updatedAt: 't1', artifactIds: [] }).state;
  }
  return s;
}

describe('pathTransferView', () => {
  it('returns null for an unknown path', () => {
    expect(pathTransferView(roadmapCatalog, defaultRoadmapState, 'ghost')).toBeNull();
  });
  it('counts nothing when no progress exists', () => {
    const vm = pathTransferView(roadmapCatalog, defaultRoadmapState, 'djvj');
    expect(vm?.applyCount).toBe(0);
    expect(vm?.applies).toEqual([]);
    expect(vm?.totalNodes).toBe(17);
  });
  it('counts tried, practicing, and demonstrated but not resting states', () => {
    const s = withStates([
      ['rhythm-song-structure', 'demonstrated'],
      ['mixing-technique', 'practicing'],
      ['music-selection-library', 'tried'],
      ['harmonic-mixing', 'interested'],
      ['club-media-player-workflow', 'skipped'],
      ['observing-a-live-set', 'not-for-me'],
      ['live-control-surfaces', 'paused'],
    ]);
    const vm = pathTransferView(roadmapCatalog, s, 'djvj');
    expect(vm?.applies.map((a) => a.nodeId).sort()).toEqual(['mixing-technique', 'music-selection-library', 'rhythm-song-structure']);
    expect(vm?.applyCount).toBe(3);
    expect(vm?.applies.find((a) => a.nodeId === 'rhythm-song-structure')).toEqual({
      nodeId: 'rhythm-song-structure', title: 'Rhythm & Song Structure', state: 'demonstrated',
    });
  });
  it('carries progress into a different path that shares nodes', () => {
    const s = withStates([['rhythm-song-structure', 'practicing']]);
    const vm = pathTransferView(roadmapCatalog, s, 'creative-coding-music');
    expect(vm?.applyCount).toBe(1);
    expect(vm?.applies[0].nodeId).toBe('rhythm-song-structure');
  });
});
