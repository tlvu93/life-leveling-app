import type { AtlasNode, GuidePersona, RoadmapCatalog, RouteEdge, RouteRole } from '../catalog';
import { validateGuide, type GraphIssue } from '../graph';
import type { GuideId, NodeId, PathId, StepId } from '../ids';
import type { DraftVisibility, GuideDraft, RoadmapState } from '../state';
import { builderView, searchNodes, type BuilderNodeVm, type BuilderStepVm } from './guide-builder';

export type DraftSummaryVm = {
  draftId: GuideId;
  title: string;
  pathId: PathId;
  pathTitle: string;
  stepCount: number;
  issueCount: number;
  visibility: DraftVisibility;
  updatedAt: string;
};

export type DraftBuilderVm = {
  draftId: GuideId;
  title: string;
  pathId: PathId;
  pathTitle: string;
  persona: GuidePersona;
  rationale: string;
  visibility: DraftVisibility;
  route: BuilderStepVm[];
  /** The draft's edges, so the builder can show what is already connected. */
  connections: RouteEdge[];
  stances: { nodeId: NodeId; nodeTitle: string; reason: string }[];
  issues: GraphIssue[];
  publishable: boolean;
  available: BuilderNodeVm[];
  excludable: BuilderNodeVm[];
};

export type DraftPreviewVm = {
  draftId: GuideId;
  title: string;
  pathId: PathId;
  pathTitle: string;
  persona: GuidePersona;
  rationale: string;
  visibility: DraftVisibility;
  steps: { stepId: StepId; nodeTitle: string; nodeDescription: string; role: RouteRole; note: string; branchOf: StepId | null }[];
  stances: { nodeTitle: string; reason: string }[];
};

function findDraft(state: RoadmapState, draftId: GuideId): GuideDraft | undefined {
  return state.drafts.find((d) => d.guide.id === draftId);
}

/** A draft's own proposals are visible to it and to nothing else. */
function nodesFor(catalog: RoadmapCatalog, draft: GuideDraft): AtlasNode[] {
  return [...catalog.nodes, ...draft.provisionalNodes];
}

function draftCatalog(catalog: RoadmapCatalog, draft: GuideDraft): RoadmapCatalog {
  return { ...catalog, nodes: nodesFor(catalog, draft) };
}

function personaComplete(persona: GuidePersona): boolean {
  return Boolean(persona.audience.trim() && persona.startingPoint.trim() && persona.outcome.trim());
}

export function draftListView(catalog: RoadmapCatalog, state: RoadmapState): DraftSummaryVm[] {
  return state.drafts.map((draft) => ({
    draftId: draft.guide.id,
    title: draft.guide.title,
    pathId: draft.guide.pathId,
    pathTitle: catalog.paths.find((p) => p.id === draft.guide.pathId)?.title ?? draft.guide.pathId,
    stepCount: draft.guide.steps.length,
    issueCount: validateGuide(draft.guide, new Set(nodesFor(catalog, draft).map((n) => n.id))).length,
    visibility: draft.visibility,
    updatedAt: draft.updatedAt,
  }));
}

export function draftBuilderView(catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId): DraftBuilderVm | null {
  const draft = findDraft(state, draftId);
  if (!draft) return null;

  const scoped = draftCatalog(catalog, draft);
  const view = builderView(scoped, draft.guide);
  const placed = new Set(draft.guide.steps.map((s) => s.nodeId));
  const stanced = new Set(draft.guide.stances.map((s) => s.nodeId));
  const titleOf = (nodeId: NodeId) => scoped.nodes.find((n) => n.id === nodeId)?.title ?? nodeId;
  const path = catalog.paths.find((p) => p.id === draft.guide.pathId);
  const onPath = new Set(path?.nodeIds ?? []);

  // Anything unplaced can join the route; only unplaced, unstanced Nodes can be
  // excluded, and this Path's own concepts are the ones worth offering first.
  // A Node the author has excluded is not on offer: placing it would make the
  // draft contradict itself and stop it being publishable.
  const unplaced = view.nodes.filter((n) => !placed.has(n.id) && !stanced.has(n.id));
  const byRelevance = (a: BuilderNodeVm, b: BuilderNodeVm) => {
    const near = Number(onPath.has(b.id)) - Number(onPath.has(a.id));
    return near !== 0 ? near : a.title.localeCompare(b.title);
  };

  return {
    draftId,
    title: draft.guide.title,
    pathId: draft.guide.pathId,
    pathTitle: path?.title ?? draft.guide.pathId,
    persona: draft.guide.persona,
    rationale: draft.guide.rationale,
    visibility: draft.visibility,
    route: view.route,
    connections: draft.guide.edges,
    stances: draft.guide.stances.map((s) => ({ nodeId: s.nodeId, nodeTitle: titleOf(s.nodeId), reason: s.reason })),
    issues: view.issues,
    publishable: view.issues.length === 0 && personaComplete(draft.guide.persona) && draft.guide.steps.length >= 2,
    available: [...unplaced].sort(byRelevance),
    excludable: unplaced.filter((n) => onPath.has(n.id)).sort(byRelevance),
  };
}

/** Title-and-description search, so "camelot" finds Harmonic Mixing. */
export function searchDraftNodes(catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId, query: string): BuilderNodeVm[] {
  const draft = findDraft(state, draftId);
  if (!draft) return [];
  const placed = new Set(draft.guide.steps.map((s) => s.nodeId));
  const stanced = new Set(draft.guide.stances.map((s) => s.nodeId));
  return searchNodes(draftCatalog(catalog, draft), draft.guide, query)
    .filter((n) => !placed.has(n.id) && !stanced.has(n.id));
}

/** What an Explorer opening the unlisted link would read. */
export function draftPreviewView(catalog: RoadmapCatalog, state: RoadmapState, draftId: GuideId): DraftPreviewVm | null {
  const draft = findDraft(state, draftId);
  if (!draft) return null;
  const scoped = draftCatalog(catalog, draft);
  const view = builderView(scoped, draft.guide);
  const nodeOf = (nodeId: NodeId) => scoped.nodes.find((n) => n.id === nodeId);
  const stepById = new Map(draft.guide.steps.map((s) => [s.id, s]));

  return {
    draftId,
    title: draft.guide.title,
    pathId: draft.guide.pathId,
    pathTitle: catalog.paths.find((p) => p.id === draft.guide.pathId)?.title ?? draft.guide.pathId,
    persona: draft.guide.persona,
    rationale: draft.guide.rationale,
    visibility: draft.visibility,
    steps: view.route.flatMap((step) => {
      const source = stepById.get(step.stepId);
      if (!source) return [];
      return [{
        stepId: step.stepId,
        nodeTitle: step.nodeTitle,
        nodeDescription: nodeOf(source.nodeId)?.description ?? '',
        role: step.role,
        note: step.note,
        branchOf: step.branchOf,
      }];
    }),
    stances: draft.guide.stances.map((s) => ({ nodeTitle: nodeOf(s.nodeId)?.title ?? s.nodeId, reason: s.reason })),
  };
}
