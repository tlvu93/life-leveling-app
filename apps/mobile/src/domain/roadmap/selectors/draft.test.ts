import { describe, expect, it } from 'vitest';
import {
  addProvisionalNode,
  connectDraftSteps,
  createDraft,
  placeDraftStep,
  setDraftStance,
  setDraftStepRole,
  updateDraftPersona,
} from '../../../state/draft-actions';
import { roadmapCatalog } from '../fixtures/catalog';
import { defaultRoadmapState, type RoadmapState } from '../state';
import { draftBuilderView, draftListView, draftPreviewView, searchDraftNodes } from './draft';

function ids() {
  let n = 0;
  return () => { n += 1; return `d${n}`; };
}

function authored(): { state: RoadmapState; draftId: string; next: () => string } {
  const next = ids();
  let state = createDraft(defaultRoadmapState, 'djvj', 'Club-first, my way', next, 't0').state;
  const draftId = state.drafts[0].guide.id;
  state = updateDraftPersona(state, draftId, {
    audience: 'people near a city with open decks',
    startingPoint: 'a laptop and headphones',
    outcome: 'a ten-minute set',
  }, 't1').state;
  for (const nodeId of ['rhythm-song-structure', 'mixing-technique', 'ten-minute-av-set']) {
    state = placeDraftStep(roadmapCatalog, state, draftId, nodeId, next, 't2').state;
  }
  const [a, b, c] = state.drafts[0].guide.steps.map((s) => s.id);
  state = connectDraftSteps(roadmapCatalog, state, draftId, a, b, 'next', 't3').state;
  state = connectDraftSteps(roadmapCatalog, state, draftId, b, c, 'next', 't4').state;
  return { state, draftId, next };
}

describe('draftListView', () => {
  it('summarises drafts with their Path and issue count', () => {
    const { state } = authored();
    const [summary] = draftListView(roadmapCatalog, state);
    expect(summary.title).toBe('Club-first, my way');
    expect(summary.pathTitle).toBe('DJ/VJ and Live Audiovisual Performance');
    expect(summary.stepCount).toBe(3);
    expect(summary.issueCount).toBe(0);
    expect(summary.visibility).toBe('private');
  });
});

describe('draftBuilderView', () => {
  it('returns null for an unknown draft', () => {
    expect(draftBuilderView(roadmapCatalog, defaultRoadmapState, 'ghost')).toBeNull();
  });
  it('linearizes the route and reports it publishable once complete', () => {
    const { state, draftId } = authored();
    const vm = draftBuilderView(roadmapCatalog, state, draftId);
    expect(vm?.route.map((s) => s.nodeTitle)).toEqual([
      'Rhythm & Song Structure', 'Mixing Technique (Tempo, EQ & Blends)', 'Ten-Minute Audiovisual Set',
    ]);
    expect(vm?.issues).toEqual([]);
    expect(vm?.publishable).toBe(true);
  });
  it('is not publishable while the persona is incomplete', () => {
    const next = ids();
    let state = createDraft(defaultRoadmapState, 'djvj', 'Bare', next, 't0').state;
    const draftId = state.drafts[0].guide.id;
    state = placeDraftStep(roadmapCatalog, state, draftId, 'rhythm-song-structure', next, 't1').state;
    state = placeDraftStep(roadmapCatalog, state, draftId, 'mixing-technique', next, 't2').state;
    expect(draftBuilderView(roadmapCatalog, state, draftId)?.publishable).toBe(false);
  });
  it('offers only unplaced nodes, this Path first', () => {
    const { state, draftId } = authored();
    const vm = draftBuilderView(roadmapCatalog, state, draftId);
    const placedTitles = vm?.route.map((s) => s.nodeTitle) ?? [];
    expect(vm?.available.some((n) => placedTitles.includes(n.title))).toBe(false);
    const djvjNodeIds = new Set(roadmapCatalog.paths.find((p) => p.id === 'djvj')?.nodeIds ?? []);
    expect(djvjNodeIds.has(vm?.available[0].id ?? '')).toBe(true);
    expect(vm?.excludable.every((n) => djvjNodeIds.has(n.id))).toBe(true);
  });
  it('marks a branch step with the step it forks from', () => {
    const { state, draftId, next } = authored();
    let branched = placeDraftStep(roadmapCatalog, state, draftId, 'harmonic-mixing', next, 't5').state;
    const steps = branched.drafts[0].guide.steps;
    const from = steps[0].id;
    const alt = steps[steps.length - 1].id;
    branched = connectDraftSteps(roadmapCatalog, branched, draftId, from, alt, 'alternative', 't6').state;
    const vm = draftBuilderView(roadmapCatalog, branched, draftId);
    expect(vm?.route.find((s) => s.stepId === alt)?.branchOf).toBe(from);
  });
  it('lists stances with the node title and drops them from the excludable list', () => {
    const { state, draftId } = authored();
    const excluded = setDraftStance(roadmapCatalog, state, draftId, 'music-theory-fundamentals', 'phrasing is enough here', 't5').state;
    const vm = draftBuilderView(roadmapCatalog, excluded, draftId);
    expect(vm?.stances).toEqual([
      { nodeId: 'music-theory-fundamentals', nodeTitle: 'Music Theory Fundamentals', reason: 'phrasing is enough here' },
    ]);
    expect(vm?.excludable.some((n) => n.id === 'music-theory-fundamentals')).toBe(false);
  });
  it('sees a proposed concept that the shared catalog does not', () => {
    const { state, draftId, next } = authored();
    const proposed = addProvisionalNode(
      roadmapCatalog, state, draftId,
      { title: 'Open-decks etiquette', description: 'Sign-up norms.', type: 'experience', domainId: 'music' },
      next, 't5',
    ).state;
    const vm = draftBuilderView(roadmapCatalog, proposed, draftId);
    expect(vm?.issues).toEqual([]);
    expect(vm?.route.some((s) => s.nodeTitle === 'Open-decks etiquette')).toBe(true);
  });
});

describe('searchDraftNodes', () => {
  it('matches unplaced nodes and hides placed ones', () => {
    const { state, draftId } = authored();
    expect(searchDraftNodes(roadmapCatalog, state, draftId, 'camelot').map((n) => n.id)).toContain('harmonic-mixing');
    expect(searchDraftNodes(roadmapCatalog, state, draftId, 'rhythm').map((n) => n.id)).not.toContain('rhythm-song-structure');
  });
});

describe('draftPreviewView', () => {
  it('reads as an Explorer would, including the exclusion reason', () => {
    const { state, draftId } = authored();
    let ready = setDraftStance(roadmapCatalog, state, draftId, 'music-theory-fundamentals', 'phrasing is enough here', 't5').state;
    const checkpoint = ready.drafts[0].guide.steps[2].id;
    ready = setDraftStepRole(roadmapCatalog, ready, draftId, checkpoint, 'checkpoint', 't6').state;
    const vm = draftPreviewView(roadmapCatalog, ready, draftId);
    expect(vm?.title).toBe('Club-first, my way');
    expect(vm?.persona.outcome).toBe('a ten-minute set');
    expect(vm?.steps).toHaveLength(3);
    expect(vm?.steps[2].role).toBe('checkpoint');
    expect(vm?.steps[0].nodeDescription.length).toBeGreaterThan(0);
    expect(vm?.stances).toEqual([{ nodeTitle: 'Music Theory Fundamentals', reason: 'phrasing is enough here' }]);
  });
  it('returns null for an unknown draft', () => {
    expect(draftPreviewView(roadmapCatalog, defaultRoadmapState, 'ghost')).toBeNull();
  });
});
