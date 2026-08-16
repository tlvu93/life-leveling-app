import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { addArtifact, adoptGuide, attachArtifact, setProgress } from '../ops';
import { defaultRoadmapState, progressStates } from '../state';
import { stepDetailView } from './step-detail';

const seq = () => { let n = 0; return () => `id-${n++}`; };

describe('stepDetailView', () => {
  const adopted = adoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', seq(), 't0').state;
  const buildId = adopted.builds[0].id;

  it('resolves node content, offers all seven states, quest null when absent', () => {
    const rhythmStep = adopted.builds[0].steps.find((s) => s.nodeId === 'rhythm-song-structure');
    const vm = stepDetailView(roadmapCatalog, adopted, buildId, rhythmStep?.id ?? '');
    expect(vm?.nodeTitle).toBe('Rhythm & Song Structure');
    expect(vm?.availableStates).toEqual(progressStates);
    expect(vm?.quest).toBeNull();
    expect(vm?.progress).toBeNull();
  });
  it('carries the quest when the step has one and resolves attached artifacts', () => {
    const questStep = adopted.builds[0].steps.find((s) => s.nodeId === 'private-one-track-experiment');
    let s = addArtifact(adopted, { id: 'art-1', kind: 'recording', title: 'First blend', value: 'file://blend.mp3', createdAt: 't1' }).state;
    s = setProgress(s, questStep?.id ?? '', { state: 'tried', updatedAt: 't1', artifactIds: [] }).state;
    s = attachArtifact(s, questStep?.id ?? '', 'art-1').state;
    const vm = stepDetailView(roadmapCatalog, s, buildId, questStep?.id ?? '');
    expect(vm?.quest?.id).toBe('q-a-blend');
    expect(vm?.progress?.state).toBe('tried');
    expect(vm?.artifacts.map((a) => a.id)).toEqual(['art-1']);
  });
  it('returns null for a step outside the named build', () => {
    expect(stepDetailView(roadmapCatalog, adopted, buildId, 'ghost')).toBeNull();
    expect(stepDetailView(roadmapCatalog, adopted, 'other-build', adopted.builds[0].steps[0].id)).toBeNull();
  });
});
