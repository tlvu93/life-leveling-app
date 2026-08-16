import { describe, expect, it } from 'vitest';
import { defaultRoadmapState, migrateRoadmapState, ROADMAP_STORAGE_KEY } from './state';

const validBuild = {
  id: 'b1', title: 'My route', pathId: 'p1',
  provenance: { kind: 'adopted', guideId: 'g1', guideVersion: 1 },
  steps: [{ id: 's1', nodeId: 'n1', role: 'required', note: '', sortKey: 0, origin: { kind: 'from-guide' } }],
  edges: [],
};

describe('migrateRoadmapState', () => {
  it('returns a fresh default for garbage', () => {
    expect(migrateRoadmapState(undefined)).toEqual(defaultRoadmapState);
    expect(migrateRoadmapState('not json {')).toEqual(defaultRoadmapState);
    expect(migrateRoadmapState({ version: 99 })).toEqual(defaultRoadmapState);
  });
  it('parses stored JSON strings', () => {
    const state = migrateRoadmapState(JSON.stringify({ version: 1, builds: [validBuild], activeBuildId: 'b1' }));
    expect(state.builds).toHaveLength(1);
    expect(state.activeBuildId).toBe('b1');
  });
  it('drops invalid builds whole and clears dangling activeBuildId', () => {
    const cyclic = { ...validBuild, id: 'b2', steps: [...validBuild.steps, { ...validBuild.steps[0], id: 's2' }], edges: [{ from: 's1', to: 's2', kind: 'next' }, { from: 's2', to: 's1', kind: 'next' }] };
    const state = migrateRoadmapState({ version: 1, builds: [cyclic], activeBuildId: 'b2' });
    expect(state.builds).toEqual([]);
    expect(state.activeBuildId).toBeNull();
  });
  it('prunes orphaned progress, share refs, and unknown progress states', () => {
    const state = migrateRoadmapState({
      version: 1,
      interests: ['music'],
      builds: [validBuild],
      artifacts: [{ id: 'a1', kind: 'note', title: 't', value: 'v', createdAt: 'now' }],
      progress: {
        s1: { state: 'practicing', updatedAt: 'now', artifactIds: ['a1', 'ghost'] },
        ghost: { state: 'tried', updatedAt: 'now', artifactIds: [] },
        s1b: { state: 'overdue', updatedAt: 'now', artifactIds: [] },
      },
      share: { interestIds: ['music', 'bogus'], buildId: 'b1', stepIds: ['s1', 'ghost'], artifactIds: ['ghost'] },
    });
    expect(Object.keys(state.progress)).toEqual(['s1']);
    expect(state.progress.s1.artifactIds).toEqual(['a1']);
    expect(state.share).toEqual({ interestIds: ['music'], buildId: 'b1', stepIds: ['s1'], artifactIds: [] });
  });
  it('clears share stepIds when buildId is gone', () => {
    const state = migrateRoadmapState({ version: 1, builds: [], share: { interestIds: [], buildId: 'gone', stepIds: ['s1'], artifactIds: [] } });
    expect(state.share.buildId).toBeNull();
    expect(state.share.stepIds).toEqual([]);
  });
  it('drops shared interests the user does not hold', () => {
    const state = migrateRoadmapState({
      version: 1,
      interests: ['music'],
      builds: [],
      share: { interestIds: ['music', 'design'], buildId: null, stepIds: [], artifactIds: [] },
    });
    expect(state.share.interestIds).toEqual(['music']);
  });
  it('enforces unique build ids and cross-build step ids by dropping later offenders', () => {
    const clone = { ...validBuild, title: 'Duplicate id' };
    const collidingSteps = { ...validBuild, id: 'b2', title: 'Same step ids' };
    const state = migrateRoadmapState({ version: 1, builds: [validBuild, clone, collidingSteps] });
    expect(state.builds.map((b) => b.id)).toEqual(['b1']);
    expect(state.builds[0].title).toBe('My route');
  });
  it('deduplicates artifact ids keeping the first', () => {
    const state = migrateRoadmapState({
      version: 1,
      builds: [],
      artifacts: [
        { id: 'a1', kind: 'note', title: 'first', value: 'v', createdAt: 't' },
        { id: 'a1', kind: 'link', title: 'second', value: 'v', createdAt: 't' },
      ],
    });
    expect(state.artifacts).toHaveLength(1);
    expect(state.artifacts[0].title).toBe('first');
  });
  it('stores a "__proto__" step id as data without poisoning the prototype', () => {
    const raw = '{"version":1,"builds":[{"id":"b1","title":"t","pathId":"p","provenance":{"kind":"scratch"},'
      + '"steps":[{"id":"__proto__","nodeId":"n1","role":"required","note":"","sortKey":0,"origin":{"kind":"added"}}],"edges":[]}],'
      + '"progress":{"__proto__":{"state":"tried","updatedAt":"t","artifactIds":[]}}}';
    const state = migrateRoadmapState(raw);
    expect(Object.getPrototypeOf(state.progress)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(state.progress, '__proto__')).toBe(true);
    expect(state.progress['__proto__'].state).toBe('tried');
  });
  it('exports the storage key', () => {
    expect(ROADMAP_STORAGE_KEY).toBe('life-leveling.roadmap.v1');
  });
});
