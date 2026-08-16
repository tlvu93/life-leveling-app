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

describe('draft migration', () => {
  const draftGuide = {
    id: 'draft-1', version: 1, pathId: 'djvj', title: 'My route',
    persona: { audience: 'a', startingPoint: 's', outcome: 'o', assumptions: ['x'] },
    steps: [{ id: 'ds1', nodeId: 'rhythm-song-structure', role: 'required', note: 'n', sortKey: 0 }],
    edges: [],
    stances: [{ nodeId: 'music-theory-fundamentals', stance: 'excluded', reason: 'not on this route' }],
    rationale: 'r',
  };
  const draft = { guide: draftGuide, provisionalNodes: [], visibility: 'unlisted', updatedAt: 't1' };

  it('upgrades a version 1 payload by adding an empty drafts list', () => {
    const state = migrateRoadmapState({ version: 1, interests: ['music'], builds: [] });
    expect(state.version).toBe(2);
    expect(state.drafts).toEqual([]);
    expect(state.interests).toEqual(['music']);
  });
  it('round trips a version 2 draft', () => {
    const state = migrateRoadmapState({ version: 2, builds: [], drafts: [draft] });
    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].guide.steps[0].nodeId).toBe('rhythm-song-structure');
    expect(state.drafts[0].guide.stances[0].reason).toBe('not on this route');
    expect(state.drafts[0].visibility).toBe('unlisted');
  });
  it('keeps an empty draft, which is how every draft starts', () => {
    const empty = { ...draft, guide: { ...draftGuide, steps: [], edges: [] } };
    expect(migrateRoadmapState({ version: 2, builds: [], drafts: [empty] }).drafts).toHaveLength(1);
  });
  it('drops a draft whose route is broken', () => {
    const cyclic = {
      ...draft,
      guide: {
        ...draftGuide,
        steps: [draftGuide.steps[0], { ...draftGuide.steps[0], id: 'ds2' }],
        edges: [{ from: 'ds1', to: 'ds2', kind: 'next' }, { from: 'ds2', to: 'ds1', kind: 'next' }],
      },
    };
    expect(migrateRoadmapState({ version: 2, builds: [], drafts: [cyclic] }).drafts).toEqual([]);
  });
  it('falls back to private for an unknown visibility and dedupes draft ids', () => {
    const odd = { ...draft, visibility: 'public' };
    const state = migrateRoadmapState({ version: 2, builds: [], drafts: [odd, draft] });
    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].visibility).toBe('private');
  });
  it('keeps provisional nodes scoped to their draft', () => {
    const withNode = {
      ...draft,
      provisionalNodes: [{ id: 'p1', type: 'skill', title: 'Tap drill', description: 'd', domainId: 'music', clusterId: 'djvj', depth: 1, size: 'minor' }],
    };
    const state = migrateRoadmapState({ version: 2, builds: [], drafts: [withNode] });
    expect(state.drafts[0].provisionalNodes[0].provisional).toEqual({ scopeGuideId: 'draft-1' });
  });
  it('drops provisional nodes that are missing required fields', () => {
    const broken = { ...draft, provisionalNodes: [{ id: 'p1', title: '', type: 'skill' }] };
    expect(migrateRoadmapState({ version: 2, builds: [], drafts: [broken] }).drafts[0].provisionalNodes).toEqual([]);
  });
});
