import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../domain/roadmap/fixtures/catalog';
import { defaultRoadmapState, type RoadmapState } from '../domain/roadmap/state';
import {
  addProvisionalNode,
  clearDraftStance,
  connectDraftSteps,
  createDraft,
  deleteDraft,
  draftNodes,
  placeDraftStep,
  removeDraftStep,
  setDraftStance,
  setDraftStepNote,
  setDraftStepRole,
  setDraftVisibility,
  updateDraftPersona,
} from './draft-actions';

function ids() {
  let n = 0;
  return () => { n += 1; return `d${n}`; };
}

function started(): { state: RoadmapState; draftId: string; next: () => string } {
  const next = ids();
  const state = createDraft(defaultRoadmapState, 'djvj', 'My club route', next, 't0').state;
  return { state, draftId: state.drafts[0].guide.id, next };
}

function placed(nodeIds: string[]) {
  const { state: base, draftId, next } = started();
  let state = base;
  for (const nodeId of nodeIds) {
    state = placeDraftStep(roadmapCatalog, state, draftId, nodeId, next, 't1').state;
  }
  return { state, draftId, next };
}

describe('createDraft', () => {
  it('seeds an empty guide on a Path', () => {
    const { state, draftId } = started();
    expect(state.drafts).toHaveLength(1);
    const draft = state.drafts[0];
    expect(draft.guide.pathId).toBe('djvj');
    expect(draft.guide.title).toBe('My club route');
    expect(draft.guide.steps).toEqual([]);
    expect(draft.visibility).toBe('private');
    expect(draft.updatedAt).toBe('t0');
    expect(draftId).toBeTruthy();
  });
  it('puts the newest draft first', () => {
    const { state, next } = started();
    const two = createDraft(state, 'bouldering', 'Second', next, 't1').state;
    expect(two.drafts[0].guide.title).toBe('Second');
  });
});

describe('updateDraftPersona', () => {
  it('merges persona fields and stamps updatedAt', () => {
    const { state, draftId } = started();
    const { state: next, issues } = updateDraftPersona(state, draftId, { audience: 'club-curious adults', outcome: 'a ten-minute set' }, 't2');
    expect(issues).toEqual([]);
    expect(next.drafts[0].guide.persona.audience).toBe('club-curious adults');
    expect(next.drafts[0].guide.persona.outcome).toBe('a ten-minute set');
    expect(next.drafts[0].guide.persona.startingPoint).toBe('');
    expect(next.drafts[0].updatedAt).toBe('t2');
  });
  it('reports a missing draft without changing state', () => {
    const { state } = started();
    const result = updateDraftPersona(state, 'ghost', { audience: 'x' }, 't2');
    expect(result.state).toBe(state);
    expect(result.issues.map((i) => i.code)).toEqual(['missing-build']);
  });
});

describe('placeDraftStep and roles', () => {
  it('places shared nodes as required steps', () => {
    const { state, draftId } = placed(['rhythm-song-structure', 'mixing-technique']);
    const draft = state.drafts.find((d) => d.guide.id === draftId);
    expect(draft?.guide.steps.map((s) => s.nodeId)).toEqual(['rhythm-song-structure', 'mixing-technique']);
    expect(draft?.guide.steps.every((s) => s.role === 'required')).toBe(true);
  });
  it('changes a role and a note', () => {
    const { state, draftId } = placed(['rhythm-song-structure']);
    const stepId = state.drafts[0].guide.steps[0].id;
    const roled = setDraftStepRole(roadmapCatalog, state, draftId, stepId, 'checkpoint', 't2').state;
    expect(roled.drafts[0].guide.steps[0].role).toBe('checkpoint');
    const noted = setDraftStepNote(roled, draftId, stepId, 'count before you touch anything', 't3').state;
    expect(noted.drafts[0].guide.steps[0].note).toBe('count before you touch anything');
  });
  it('refuses a note on a step that is not in the draft', () => {
    const { state, draftId } = placed(['rhythm-song-structure']);
    const result = setDraftStepNote(state, draftId, 'ghost', 'x', 't2');
    expect(result.state).toBe(state);
    expect(result.issues.map((i) => i.code)).toEqual(['missing-step']);
  });
});

describe('connectDraftSteps', () => {
  it('connects two steps and records a branch', () => {
    const { state, draftId } = placed(['rhythm-song-structure', 'mixing-technique', 'harmonic-mixing']);
    const [a, b, c] = state.drafts[0].guide.steps.map((s) => s.id);
    let next = connectDraftSteps(roadmapCatalog, state, draftId, a, b, 'next', 't2').state;
    next = connectDraftSteps(roadmapCatalog, next, draftId, a, c, 'alternative', 't3').state;
    expect(next.drafts[0].guide.edges).toEqual([
      { from: a, to: b, kind: 'next' },
      { from: a, to: c, kind: 'alternative' },
    ]);
  });
  it('refuses an edge to a step that is not in the draft', () => {
    const { state, draftId } = placed(['rhythm-song-structure']);
    const [a] = state.drafts[0].guide.steps.map((s) => s.id);
    const result = connectDraftSteps(roadmapCatalog, state, draftId, a, 'ghost', 'next', 't2');
    expect(result.state).toBe(state);
    expect(result.issues).toHaveLength(1);
  });
});

describe('removeDraftStep', () => {
  it('splices the route across the gap', () => {
    const { state, draftId } = placed(['rhythm-song-structure', 'mixing-technique', 'harmonic-mixing']);
    const [a, b, c] = state.drafts[0].guide.steps.map((s) => s.id);
    let next = connectDraftSteps(roadmapCatalog, state, draftId, a, b, 'next', 't2').state;
    next = connectDraftSteps(roadmapCatalog, next, draftId, b, c, 'next', 't3').state;
    const { state: removed, issues } = removeDraftStep(next, draftId, b, 't4');
    expect(issues).toEqual([]);
    expect(removed.drafts[0].guide.steps.map((s) => s.id)).toEqual([a, c]);
    expect(removed.drafts[0].guide.edges).toEqual([{ from: a, to: c, kind: 'next' }]);
  });
});

describe('stances', () => {
  it('records an exclusion with a reason and clears it again', () => {
    const { state, draftId } = placed(['rhythm-song-structure']);
    const { state: excluded, issues } = setDraftStance(roadmapCatalog, state, draftId, 'music-theory-fundamentals', 'phrasing is the only theory this route needs', 't2');
    expect(issues).toEqual([]);
    expect(excluded.drafts[0].guide.stances).toEqual([
      { nodeId: 'music-theory-fundamentals', stance: 'excluded', reason: 'phrasing is the only theory this route needs' },
    ]);
    const cleared = clearDraftStance(roadmapCatalog, excluded, draftId, 'music-theory-fundamentals', 't3').state;
    expect(cleared.drafts[0].guide.stances).toEqual([]);
  });
  it('refuses to exclude a node the draft places, and refuses an empty reason', () => {
    const { state, draftId } = placed(['rhythm-song-structure']);
    const onPlaced = setDraftStance(roadmapCatalog, state, draftId, 'rhythm-song-structure', 'nope', 't2');
    expect(onPlaced.state).toBe(state);
    expect(onPlaced.issues).toHaveLength(1);
    const noReason = setDraftStance(roadmapCatalog, state, draftId, 'music-theory-fundamentals', '   ', 't2');
    expect(noReason.state).toBe(state);
    expect(noReason.issues).toHaveLength(1);
  });
});

describe('addProvisionalNode', () => {
  it('proposes a concept, scopes it to the draft, and places it', () => {
    const { state, draftId, next } = placed(['rhythm-song-structure']);
    const { state: proposed, issues } = addProvisionalNode(
      roadmapCatalog, state, draftId,
      { title: 'Open-decks etiquette', description: 'Sign-up norms.', type: 'experience', domainId: 'music' },
      next, 't2',
    );
    expect(issues).toEqual([]);
    const draft = proposed.drafts[0];
    expect(draft.provisionalNodes).toHaveLength(1);
    expect(draft.provisionalNodes[0].provisional).toEqual({ scopeGuideId: draftId });
    expect(draft.provisionalNodes[0].clusterId).toBe('djvj');
    expect(draft.guide.steps.map((s) => s.nodeId)).toContain(draft.provisionalNodes[0].id);
    // The shared catalog never gains the proposal.
    expect(roadmapCatalog.nodes.some((n) => n.id === draft.provisionalNodes[0].id)).toBe(false);
    // And the draft's own resolver can see it.
    expect(draftNodes(roadmapCatalog, draft).some((n) => n.id === draft.provisionalNodes[0].id)).toBe(true);
  });
  it('needs a name', () => {
    const { state, draftId, next } = placed(['rhythm-song-structure']);
    const result = addProvisionalNode(roadmapCatalog, state, draftId, { title: '  ', description: '', type: 'skill', domainId: 'music' }, next, 't2');
    expect(result.state).toBe(state);
    expect(result.issues).toHaveLength(1);
  });
});

describe('visibility and deletion', () => {
  it('marks a draft unlisted and back', () => {
    const { state, draftId } = started();
    const unlisted = setDraftVisibility(state, draftId, 'unlisted', 't2').state;
    expect(unlisted.drafts[0].visibility).toBe('unlisted');
    expect(setDraftVisibility(unlisted, draftId, 'private', 't3').state.drafts[0].visibility).toBe('private');
  });
  it('deletes a draft, and reports an unknown one', () => {
    const { state, draftId } = started();
    expect(deleteDraft(state, draftId).state.drafts).toEqual([]);
    expect(deleteDraft(state, 'ghost').issues).toHaveLength(1);
  });
});
