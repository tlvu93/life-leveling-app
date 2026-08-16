import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../domain/roadmap/fixtures/catalog';
import { defaultRoadmapState } from '../domain/roadmap/state';
import { applyAdoptGuide, applySetInterests, applySetProgress, makeIdFactory } from './roadmap-actions';

const ids = () => makeIdFactory('t');

describe('makeIdFactory', () => {
  it('produces unique prefixed ids', () => {
    const next = ids();
    const produced = [next(), next(), next()];
    expect(new Set(produced).size).toBe(3);
    expect(produced.every((id) => id.startsWith('t-'))).toBe(true);
  });
});

describe('applySetInterests', () => {
  it('replaces the interest list and reports no issues', () => {
    const { state, issues } = applySetInterests(defaultRoadmapState, ['music', 'technology']);
    expect(state.interests).toEqual(['music', 'technology']);
    expect(issues).toEqual([]);
  });
});

describe('applyAdoptGuide', () => {
  it('adopts a real guide', () => {
    const { state, issues } = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', ids(), 't0');
    expect(issues).toEqual([]);
    expect(state.builds).toHaveLength(1);
    expect(state.activeBuildId).toBe(state.builds[0].id);
  });
  it('reports a missing guide without changing state', () => {
    const { state, issues } = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'ghost', ids(), 't0');
    expect(state).toBe(defaultRoadmapState);
    expect(issues.map((i) => i.code)).toEqual(['missing-guide']);
  });
});

describe('applySetProgress', () => {
  it('preserves already attached evidence when the state changes', () => {
    const adopted = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', ids(), 't0').state;
    const stepId = adopted.builds[0].steps[0].id;
    const seeded = {
      ...adopted,
      artifacts: [{ id: 'a1', kind: 'note' as const, title: 'n', value: 'v', createdAt: 't' }],
      progress: { [stepId]: { state: 'tried' as const, updatedAt: 't1', artifactIds: ['a1'] } },
    };
    const { state } = applySetProgress(seeded, stepId, 'practicing', 't2');
    expect(state.progress[stepId]).toEqual({ state: 'practicing', updatedAt: 't2', artifactIds: ['a1'] });
  });
  it('attaches an optional note', () => {
    const adopted = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', ids(), 't0').state;
    const stepId = adopted.builds[0].steps[0].id;
    const { state } = applySetProgress(adopted, stepId, 'tried', 't2', 'went ok');
    expect(state.progress[stepId].note).toBe('went ok');
  });
});
