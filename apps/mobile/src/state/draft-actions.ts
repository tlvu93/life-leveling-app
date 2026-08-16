import type { AtlasNode, Guide, NodeType, RoadmapCatalog, RouteEdgeKind, RouteRole } from '../domain/roadmap/catalog';
import {
  clearStance,
  connectEdge,
  createProvisionalNode,
  placeStep,
  setRole,
  setStance,
  type GuideEditResult,
} from '../domain/roadmap/guide-edit';
import { validateRoute } from '../domain/roadmap/graph';
import type { GuideId, InterestId, NodeId, PathId, StepId } from '../domain/roadmap/ids';
import type { OpIssue, OpResult } from '../domain/roadmap/ops';
import type { DraftVisibility, GuideDraft, RoadmapState } from '../domain/roadmap/state';

const fail = (state: RoadmapState, message: string, code: OpIssue['code'] = 'missing-build'): OpResult =>
  ({ state, issues: [{ code, message }] });

function findDraft(state: RoadmapState, draftId: GuideId): GuideDraft | undefined {
  return state.drafts.find((d) => d.guide.id === draftId);
}

/** An empty draft is a legitimate starting state, not a broken route. */
function routeIssues(steps: GuideDraft['guide']['steps'], edges: GuideDraft['guide']['edges']): string[] {
  if (steps.length === 0) return [];
  return validateRoute(steps, edges).map((issue) => issue.message);
}

/** Provisional Nodes are placeable inside their own draft, and nowhere else. */
export function draftNodes(catalog: RoadmapCatalog, draft: GuideDraft): AtlasNode[] {
  return [...catalog.nodes, ...draft.provisionalNodes];
}

function commit(state: RoadmapState, draftId: GuideId, result: GuideEditResult, now: string, extra?: Partial<GuideDraft>): OpResult {
  const current = findDraft(state, draftId);
  if (!current) return fail(state, `No draft "${draftId}".`);
  // guide-edit returns the unchanged draft when it refuses an edit; surfacing
  // the issues without writing keeps a rejected edit out of storage. A
  // successful edit reports no issues here: an unfinished draft's live
  // problems belong to the builder view, not to "your last action failed".
  if (result.guide === current.guide && !extra) {
    return { state, issues: result.issues.map((issue) => ({ code: 'invalid-route' as const, message: issue.message })) };
  }
  // An edit must never leave the route structurally broken. Storage drops a
  // draft it cannot validate, so writing one here would quietly destroy the
  // author's work at the next launch.
  const brokenNow = routeIssues(result.guide.steps, result.guide.edges);
  if (brokenNow.length > routeIssues(current.guide.steps, current.guide.edges).length) {
    return { state, issues: brokenNow.map((message) => ({ code: 'invalid-route' as const, message })) };
  }
  const next: GuideDraft = { ...current, ...extra, guide: result.guide, updatedAt: now };
  return {
    state: { ...state, drafts: state.drafts.map((d) => (d.guide.id === draftId ? next : d)) },
    issues: [],
  };
}

export function createDraft(state: RoadmapState, pathId: PathId, title: string, ids: () => string, now: string): OpResult {
  const guide: Guide = {
    id: ids(),
    version: 1,
    pathId,
    title,
    persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
    steps: [],
    edges: [],
    stances: [],
    rationale: '',
  };
  const draft: GuideDraft = { guide, provisionalNodes: [], visibility: 'private', updatedAt: now };
  return { state: { ...state, drafts: [draft, ...state.drafts] }, issues: [] };
}

export function updateDraftPersona(
  state: RoadmapState, draftId: GuideId, persona: Partial<Guide['persona']> & { title?: string; rationale?: string }, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  const { title, rationale, ...personaFields } = persona;
  const guide: Guide = {
    ...draft.guide,
    ...(title === undefined ? {} : { title }),
    ...(rationale === undefined ? {} : { rationale }),
    persona: { ...draft.guide.persona, ...personaFields },
  };
  return commit(state, draftId, { guide, issues: [] }, now);
}

export function placeDraftStep(
  catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId, nodeId: NodeId, ids: () => string, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  const result = placeStep(
    draftNodes(catalog, draft), draft.guide,
    { nodeId, role: 'required', note: '', sortKey: draft.guide.steps.length },
    ids(),
  );
  return commit(state, draftId, result, now);
}

export function setDraftStepRole(
  catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId, stepId: StepId, role: RouteRole, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  return commit(state, draftId, setRole(draftNodes(catalog, draft), draft.guide, stepId, role), now);
}

export function setDraftStepNote(
  state: RoadmapState, draftId: GuideId, stepId: StepId, note: string, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  if (!draft.guide.steps.some((s) => s.id === stepId)) return fail(state, `No step "${stepId}" in draft.`, 'missing-step');
  const guide: Guide = { ...draft.guide, steps: draft.guide.steps.map((s) => (s.id === stepId ? { ...s, note } : s)) };
  return commit(state, draftId, { guide, issues: [] }, now);
}

/** Removing a step splices next-edges across the gap, as the Journey op does. */
export function removeDraftStep(state: RoadmapState, draftId: GuideId, stepId: StepId, now: string): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  if (!draft.guide.steps.some((s) => s.id === stepId)) return fail(state, `No step "${stepId}" in draft.`, 'missing-step');
  const incoming = draft.guide.edges.filter((e) => e.to === stepId);
  const outgoing = draft.guide.edges.filter((e) => e.from === stepId);
  const edges = draft.guide.edges.filter((e) => e.from !== stepId && e.to !== stepId);
  for (const p of incoming) for (const s of outgoing) {
    const kind = p.kind === 'alternative' || s.kind === 'alternative' ? 'alternative' as const : 'next' as const;
    if (p.from !== s.to && !edges.some((e) => e.from === p.from && e.to === s.to && e.kind === kind)) {
      edges.push({ from: p.from, to: s.to, kind });
    }
  }
  const steps = draft.guide.steps.filter((s) => s.id !== stepId);
  // Only a problem this removal *introduces* blocks it; a pre-existing one
  // elsewhere in the route must not trap unrelated Steps in the draft.
  if (routeIssues(steps, edges).length > routeIssues(draft.guide.steps, draft.guide.edges).length) {
    return fail(state, `Removing "${stepId}" would break the route.`, 'invalid-route');
  }
  return commit(state, draftId, { guide: { ...draft.guide, steps, edges }, issues: [] }, now);
}

export function connectDraftSteps(
  catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId, from: StepId, to: StepId, kind: RouteEdgeKind, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  return commit(state, draftId, connectEdge(draftNodes(catalog, draft), draft.guide, from, to, kind), now);
}

export function setDraftStance(
  catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId, nodeId: NodeId, reason: string, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  const result = setStance(draftNodes(catalog, draft), draft.guide, nodeId, reason);
  // Only stance-specific problems block a stance. Judging it on the whole
  // guide would make an exclusion impossible on a draft with no Steps yet —
  // which is the state every draft starts in.
  const blocking = result.issues.filter((issue) =>
    (issue.code === 'stance-on-placed' || issue.code === 'empty-stance-reason' || issue.code === 'duplicate-stance'
      || (issue.code === 'unknown-node' && issue.nodeId === nodeId))
    && (issue.nodeId === undefined || issue.nodeId === nodeId));
  if (blocking.length > 0) {
    return { state, issues: blocking.map((issue) => ({ code: 'invalid-route' as const, message: issue.message })) };
  }
  return commit(state, draftId, result, now);
}

export function clearDraftStance(
  catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId, nodeId: NodeId, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  return commit(state, draftId, clearStance(draftNodes(catalog, draft), draft.guide, nodeId), now);
}

export function addProvisionalNode(
  catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId,
  node: { title: string; description: string; type: NodeType; domainId: InterestId },
  ids: () => string, now: string,
): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  if (!node.title.trim()) return fail(state, 'A proposed concept needs a name.', 'invalid-route');
  const result = createProvisionalNode(draftNodes(catalog, draft), draft.guide, node, ids(), ids());
  return commit(state, draftId, result, now, { provisionalNodes: [...draft.provisionalNodes, result.node] });
}

export function setDraftVisibility(state: RoadmapState, draftId: GuideId, visibility: DraftVisibility, now: string): OpResult {
  const draft = findDraft(state, draftId);
  if (!draft) return fail(state, `No draft "${draftId}".`);
  return commit(state, draftId, { guide: draft.guide, issues: [] }, now, { visibility });
}

export function deleteDraft(state: RoadmapState, draftId: GuideId): OpResult {
  if (!findDraft(state, draftId)) return fail(state, `No draft "${draftId}".`);
  return { state: { ...state, drafts: state.drafts.filter((d) => d.guide.id !== draftId) }, issues: [] };
}
