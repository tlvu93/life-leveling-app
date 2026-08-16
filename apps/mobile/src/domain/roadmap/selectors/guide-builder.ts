import type { Guide, NodeStance, NodeType, RoadmapCatalog, RouteRole } from '../catalog';
import { linearize, validateGuide, type GraphIssue } from '../graph';
import type { NodeId, StepId } from '../ids';

export type BuilderStepVm = { stepId: StepId; nodeTitle: string; role: RouteRole; note: string; branchOf: StepId | null };

export type BuilderNodeVm = { id: NodeId; title: string; type: NodeType; provisional: boolean };

export type GuideBuilderVm = {
  nodes: BuilderNodeVm[];
  route: BuilderStepVm[];
  stances: NodeStance[];
  issues: GraphIssue[];
};

function availableNodes(catalog: RoadmapCatalog, draft: Guide): BuilderNodeVm[] {
  return catalog.nodes
    .filter((n) => !n.provisional || n.provisional.scopeGuideId === draft.id)
    .map((n) => ({ id: n.id, title: n.title, type: n.type, provisional: Boolean(n.provisional) }));
}

export function builderView(catalog: RoadmapCatalog, draft: Guide): GuideBuilderVm {
  const known = new Set(availableNodes(catalog, draft).map((n) => n.id));
  const nodeTitle = (nodeId: NodeId) => catalog.nodes.find((n) => n.id === nodeId)?.title ?? nodeId;
  const branchOf = new Map<StepId, StepId>();
  for (const e of draft.edges) {
    if (e.kind === 'alternative') branchOf.set(e.to, e.from);
  }
  const byId = new Map(draft.steps.map((s) => [s.id, s]));
  // linearize omits steps trapped in a cycle; a builder surface must still show
  // them (with the validator's cycle issue) or the user cannot fix the draft.
  const ordered = linearize(draft.steps, draft.edges);
  const orderedSet = new Set(ordered);
  const leftovers = draft.steps
    .filter((s) => !orderedSet.has(s.id))
    .sort((a, b) => a.sortKey - b.sortKey || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((s) => s.id);
  const route = [...ordered, ...leftovers].flatMap((stepId) => {
    const step = byId.get(stepId);
    return step ? [{
      stepId,
      nodeTitle: nodeTitle(step.nodeId),
      role: step.role,
      note: step.note,
      branchOf: branchOf.get(stepId) ?? null,
    }] : [];
  });
  return {
    nodes: availableNodes(catalog, draft),
    route,
    stances: draft.stances,
    issues: validateGuide(draft, known),
  };
}

export function searchNodes(catalog: RoadmapCatalog, draft: Guide, query: string): BuilderNodeVm[] {
  const needle = query.trim().toLowerCase();
  const nodes = availableNodes(catalog, draft);
  if (!needle) return nodes;
  return nodes.filter((vm) => {
    const node = catalog.nodes.find((n) => n.id === vm.id);
    return vm.title.toLowerCase().includes(needle) || (node?.description.toLowerCase().includes(needle) ?? false);
  });
}
