import { describe, expect, it } from 'vitest';
import type { Guide, RoadmapCatalog } from './catalog';
import {
  addArtifact, addStep, adoptGuide, attachArtifact, removeStep, replaceStep,
  selectForShare, setProgress,
} from './ops';
import { defaultRoadmapState } from './state';

const guide: Guide = {
  id: 'g1', version: 2, pathId: 'p1', title: 'Club-first',
  persona: { audience: 'a', startingPoint: 's', outcome: 'o', assumptions: [] },
  steps: [
    { id: 'gs1', nodeId: 'n-rhythm', role: 'required', note: 'count first', sortKey: 0 },
    { id: 'gs2', nodeId: 'n-gear', role: 'required', note: '', sortKey: 1 },
    { id: 'gs2b', nodeId: 'n-gear-alt', role: 'alternative', note: '', sortKey: 2 },
    { id: 'gs3', nodeId: 'n-mix', role: 'checkpoint', note: '', sortKey: 3 },
  ],
  edges: [
    { from: 'gs1', to: 'gs2', kind: 'next' },
    { from: 'gs2', to: 'gs3', kind: 'next' },
    { from: 'gs1', to: 'gs2b', kind: 'alternative' },
    { from: 'gs2b', to: 'gs3', kind: 'next' },
  ],
  stances: [], rationale: '',
};
const catalog: RoadmapCatalog = {
  contentVersion: 1,
  nodes: [
    { id: 'n-rhythm', type: 'foundation', title: 'Rhythm', description: '', domainId: 'music', clusterId: 'p1', depth: 0, size: 'major' },
    { id: 'n-gear', type: 'resource', title: 'Gear', description: '', domainId: 'technology', clusterId: 'p1', depth: 0, size: 'standard' },
    { id: 'n-gear-alt', type: 'resource', title: 'Gear (alt)', description: '', domainId: 'technology', clusterId: 'p1', depth: 0, size: 'standard' },
    { id: 'n-mix', type: 'skill', title: 'Mixing', description: '', domainId: 'music', clusterId: 'p1', depth: 1, size: 'major' },
    { id: 'n-free-software', type: 'resource', title: 'Free software', description: '', domainId: 'technology', clusterId: 'p1', depth: 0, size: 'minor' },
  ],
  paths: [], guides: [guide], relationships: [],
};
const seq = () => { let n = 0; return () => `id-${n++}`; };
const stepIdFor = (state: ReturnType<typeof adoptGuide>['state'], nodeId: string) =>
  state.builds[0].steps.find((s) => s.nodeId === nodeId)?.id ?? '';

describe('adoptGuide', () => {
  it('copies the route into an independent build with provenance', () => {
    const { state, issues } = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0');
    expect(issues).toEqual([]);
    const build = state.builds[0];
    expect(build.provenance).toEqual({ kind: 'adopted', guideId: 'g1', guideVersion: 2 });
    expect(build.steps.every((s) => s.origin.kind === 'from-guide')).toBe(true);
    expect(build.steps.map((s) => s.id)).not.toEqual(guide.steps.map((s) => s.id));
    expect(build.edges).toHaveLength(4);
    expect(state.activeBuildId).toBe(build.id);
    guide.steps[0].note = 'MUTATED';
    expect(build.steps[0].note).toBe('count first');
    guide.steps[0].note = 'count first';
  });
  it('reports a missing guide without changing state', () => {
    const { state, issues } = adoptGuide(catalog, defaultRoadmapState, 'ghost', seq(), 't0');
    expect(state).toBe(defaultRoadmapState);
    expect(issues.map((i) => i.code)).toEqual(['missing-guide']);
  });
});

describe('replaceStep', () => {
  it('swaps the node and records origin with the prior node id', () => {
    const adopted = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = adopted.builds[0].id;
    const stepId = stepIdFor(adopted, 'n-gear');
    const { state, issues } = replaceStep(catalog, adopted, buildId, stepId, 'n-free-software');
    expect(issues).toEqual([]);
    const step = state.builds[0].steps.find((s) => s.id === stepId);
    expect(step?.nodeId).toBe('n-free-software');
    expect(step?.origin).toEqual({ kind: 'replaced', originalNodeId: 'n-gear' });
  });
  it('keeps the ORIGINAL guide node across repeated replacement', () => {
    const adopted = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = adopted.builds[0].id;
    const stepId = stepIdFor(adopted, 'n-gear');
    let s = replaceStep(catalog, adopted, buildId, stepId, 'n-free-software').state;
    s = replaceStep(catalog, s, buildId, stepId, 'n-mix').state;
    const step = s.builds[0].steps.find((x) => x.id === stepId);
    expect(step?.nodeId).toBe('n-mix');
    expect(step?.origin).toEqual({ kind: 'replaced', originalNodeId: 'n-gear' });
  });
  it('keeps user-added steps labeled added when their node changes', () => {
    const adopted = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = adopted.builds[0].id;
    const withAdded = addStep(catalog, adopted, buildId, { nodeId: 'n-mix', role: 'recommended', note: '', sortKey: 9 }, stepIdFor(adopted, 'n-mix'), () => 'added-1').state;
    const addedId = withAdded.builds[0].steps.find((s) => s.origin.kind === 'added')?.id ?? '';
    const { state } = replaceStep(catalog, withAdded, buildId, addedId, 'n-free-software');
    expect(state.builds[0].steps.find((s) => s.id === addedId)?.origin).toEqual({ kind: 'added' });
  });
  it('rejects nodes that are not in the catalog', () => {
    const adopted = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const result = replaceStep(catalog, adopted, adopted.builds[0].id, stepIdFor(adopted, 'n-gear'), 'typo-node');
    expect(result.state).toBe(adopted);
    expect(result.issues.map((i) => i.code)).toEqual(['unknown-node']);
    const added = addStep(catalog, adopted, adopted.builds[0].id, { nodeId: 'ghost', role: 'recommended', note: '', sortKey: 9 }, null, seq());
    expect(added.issues.map((i) => i.code)).toEqual(['unknown-node']);
  });
});

describe('removeStep', () => {
  it('splices edges, prunes progress and share refs, keeps the graph valid', () => {
    let s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = s.builds[0].id;
    const a = stepIdFor(s, 'n-rhythm');
    const b = stepIdFor(s, 'n-gear');
    const bAlt = stepIdFor(s, 'n-gear-alt');
    const c = stepIdFor(s, 'n-mix');
    s = setProgress(s, b, { state: 'tried', updatedAt: 't1', artifactIds: [] }).state;
    s = selectForShare(s, { buildId, stepIds: [b] }).state;
    const { state, issues } = removeStep(s, buildId, b);
    expect(issues).toEqual([]);
    expect(state.builds[0].steps.map((x) => x.id)).toEqual([a, bAlt, c]);
    expect(state.builds[0].edges).toHaveLength(3);
    expect(state.builds[0].edges).toEqual(expect.arrayContaining([
      { from: a, to: c, kind: 'next' },
      { from: a, to: bAlt, kind: 'alternative' },
      { from: bAlt, to: c, kind: 'next' },
    ]));
    expect(state.progress[b]).toBeUndefined();
    expect(state.share.stepIds).toEqual([]);
  });
  it('preserves branch structure when removing a branch step', () => {
    const s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = s.builds[0].id;
    const a = stepIdFor(s, 'n-rhythm');
    const bAlt = stepIdFor(s, 'n-gear-alt');
    const c = stepIdFor(s, 'n-mix');
    const { state, issues } = removeStep(s, buildId, bAlt);
    expect(issues).toEqual([]);
    expect(state.builds[0].edges).toEqual(expect.arrayContaining([
      { from: a, to: c, kind: 'alternative' },
    ]));
  });
});

describe('progress, artifacts, share', () => {
  it('setProgress requires an existing step', () => {
    const { state, issues } = setProgress(defaultRoadmapState, 'ghost', { state: 'tried', updatedAt: 't', artifactIds: [] });
    expect(state).toBe(defaultRoadmapState);
    expect(issues.map((i) => i.code)).toEqual(['missing-step']);
  });
  it('attachArtifact requires an existing progress entry and artifact', () => {
    let s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const stepId = s.builds[0].steps[0].id;
    s = addArtifact(s, { id: 'a1', kind: 'note', title: 'First blend', value: 'went ok', createdAt: 't1' }).state;
    expect(attachArtifact(s, stepId, 'a1').issues.map((i) => i.code)).toEqual(['missing-progress']);
    s = setProgress(s, stepId, { state: 'tried', updatedAt: 't1', artifactIds: [] }).state;
    s = attachArtifact(s, stepId, 'a1').state;
    expect(s.progress[stepId].artifactIds).toEqual(['a1']);
  });
  it('selectForShare prunes step ids outside the shared build and is additive from empty', () => {
    const s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    expect(defaultRoadmapState.share).toEqual({ interestIds: [], buildId: null, stepIds: [], artifactIds: [] });
    const { state } = selectForShare(s, { buildId: s.builds[0].id, stepIds: [s.builds[0].steps[0].id, 'ghost'] });
    expect(state.share.stepIds).toEqual([s.builds[0].steps[0].id]);
  });
});
