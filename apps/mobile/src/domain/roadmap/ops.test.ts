import { describe, expect, it } from 'vitest';
import type { Guide, RoadmapCatalog } from './catalog';
import {
  addArtifact, adoptGuide, attachArtifact, removeStep, replaceStep,
  selectForShare, setProgress,
} from './ops';
import { defaultRoadmapState } from './state';

const guide: Guide = {
  id: 'g1', version: 2, pathId: 'p1', title: 'Club-first',
  persona: { audience: 'a', startingPoint: 's', outcome: 'o', assumptions: [] },
  steps: [
    { id: 'gs1', nodeId: 'n-rhythm', role: 'required', note: 'count first', sortKey: 0 },
    { id: 'gs2', nodeId: 'n-gear', role: 'required', note: '', sortKey: 1 },
    { id: 'gs3', nodeId: 'n-mix', role: 'checkpoint', note: '', sortKey: 2 },
  ],
  edges: [
    { from: 'gs1', to: 'gs2', kind: 'next' },
    { from: 'gs2', to: 'gs3', kind: 'next' },
  ],
  stances: [], rationale: '',
};
const catalog: RoadmapCatalog = { contentVersion: 1, nodes: [], paths: [], guides: [guide] };
const seq = () => { let n = 0; return () => `id-${n++}`; };

describe('adoptGuide', () => {
  it('copies the route into an independent build with provenance', () => {
    const { state, issues } = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0');
    expect(issues).toEqual([]);
    const build = state.builds[0];
    expect(build.provenance).toEqual({ kind: 'adopted', guideId: 'g1', guideVersion: 2 });
    expect(build.steps.map((s) => s.origin)).toEqual([{ kind: 'from-guide' }, { kind: 'from-guide' }, { kind: 'from-guide' }]);
    expect(build.steps.map((s) => s.id)).not.toEqual(guide.steps.map((s) => s.id));
    expect(build.edges).toHaveLength(2);
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
    const stepId = adopted.builds[0].steps[1].id;
    const { state, issues } = replaceStep(adopted, buildId, stepId, 'n-free-software');
    expect(issues).toEqual([]);
    const step = state.builds[0].steps[1];
    expect(step.nodeId).toBe('n-free-software');
    expect(step.origin).toEqual({ kind: 'replaced', originalNodeId: 'n-gear' });
  });
});

describe('removeStep', () => {
  it('splices edges, prunes progress and share refs, keeps the graph valid', () => {
    let s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = s.builds[0].id;
    const [a, b, c] = s.builds[0].steps.map((x) => x.id);
    s = setProgress(s, b, { state: 'tried', updatedAt: 't1', artifactIds: [] }).state;
    s = selectForShare(s, { buildId, stepIds: [b] }).state;
    const { state, issues } = removeStep(s, buildId, b);
    expect(issues).toEqual([]);
    expect(state.builds[0].steps.map((x) => x.id)).toEqual([a, c]);
    expect(state.builds[0].edges).toEqual([{ from: a, to: c, kind: 'next' }]);
    expect(state.progress[b]).toBeUndefined();
    expect(state.share.stepIds).toEqual([]);
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
