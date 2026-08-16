import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { addArtifact, adoptGuide, selectForShare, setProgress } from '../ops';
import { defaultRoadmapState, type RoadmapState } from '../state';
import { shareAudit, sharePreviewView } from './share-preview';

const seq = () => { let n = 0; return () => `id-${n++}`; };

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function baseState(): RoadmapState {
  let s = adoptGuide(roadmapCatalog, { ...defaultRoadmapState, interests: ['music', 'technology'] }, 'guide-club-first', seq(), 't0').state;
  s = addArtifact(s, { id: 'ar1', kind: 'recording', title: 'Blend', value: 'file://1', createdAt: 't1' }).state;
  s = addArtifact(s, { id: 'ar2', kind: 'note', title: 'Notes', value: 'text', createdAt: 't1' }).state;
  s = addArtifact(s, { id: 'ar3', kind: 'link', title: 'Reel', value: 'https://x', createdAt: 't1' }).state;
  s = setProgress(s, s.builds[0].steps[0].id, { state: 'practicing', updatedAt: 't2', artifactIds: [] }).state;
  return s;
}

describe('sharePreviewView', () => {
  it('renders an empty page for an empty selection', () => {
    expect(sharePreviewView(roadmapCatalog, baseState())).toEqual({ interests: [], build: null, steps: [], artifacts: [] });
  });
  it('renders only what the selection names', () => {
    let s = baseState();
    const stepId = s.builds[0].steps[0].id;
    s = selectForShare(s, { interestIds: ['music'], buildId: s.builds[0].id, stepIds: [stepId], artifactIds: ['ar1'] }).state;
    const vm = sharePreviewView(roadmapCatalog, s);
    expect(vm.interests).toEqual([{ id: 'music', label: 'Music' }]);
    expect(vm.build?.title).toBe('Club-first DJ/VJ with borrowed gear');
    expect(vm.steps).toEqual([{ nodeTitle: 'Rhythm & Song Structure', role: 'required', progressState: 'practicing' }]);
    expect(vm.artifacts).toEqual([{ title: 'Blend', kind: 'recording' }]);
  });
  it('never contains an unselected item across random selections', () => {
    const rand = seeded(42);
    const s0 = baseState();
    const stepIds = s0.builds[0].steps.map((s) => s.id);
    const artifactIds = ['ar1', 'ar2', 'ar3'];
    for (let round = 0; round < 25; round++) {
      const pickedSteps = stepIds.filter(() => rand() < 0.4);
      const pickedArtifacts = artifactIds.filter(() => rand() < 0.4);
      const shared = selectForShare(s0, { buildId: s0.builds[0].id, stepIds: pickedSteps, artifactIds: pickedArtifacts }).state;
      const vm = sharePreviewView(roadmapCatalog, shared);
      expect(vm.steps.length).toBe(pickedSteps.length);
      expect(vm.artifacts.length).toBe(pickedArtifacts.length);
      const allowedTitles = new Set(pickedArtifacts.map((id) => s0.artifacts.find((a) => a.id === id)?.title));
      for (const artifact of vm.artifacts) expect(allowedTitles.has(artifact.title)).toBe(true);
    }
  });
});

describe('shareAudit', () => {
  it('counts everything not shared', () => {
    let s = baseState();
    const stepCount = s.builds[0].steps.length;
    s = selectForShare(s, { interestIds: ['music'], buildId: s.builds[0].id, stepIds: [s.builds[0].steps[0].id], artifactIds: ['ar1'] }).state;
    expect(shareAudit(s)).toEqual({
      privateBuilds: 0,
      privateSteps: stepCount - 1,
      privateArtifacts: 2,
      privateInterests: 1,
    });
  });
});
