import type { AtlasNode, Guide, NodeType, RouteEdgeKind, RouteRole } from './catalog';
import { validateGuide, type GraphIssue } from './graph';
import type { NodeId, StepId } from './ids';

export type GuideEditResult = { guide: Guide; issues: GraphIssue[] };

function known(nodes: readonly AtlasNode[], guide: Guide): Set<string> {
  return new Set(nodes
    .filter((n) => !n.provisional || n.provisional.scopeGuideId === guide.id)
    .map((n) => n.id));
}

function validated(nodes: readonly AtlasNode[], guide: Guide): GuideEditResult {
  return { guide, issues: validateGuide(guide, known(nodes, guide)) };
}

export function placeStep(
  nodes: readonly AtlasNode[], guide: Guide,
  draft: { nodeId: NodeId; role: RouteRole; note: string; sortKey: number }, stepId: StepId,
): GuideEditResult {
  if (guide.steps.some((s) => s.id === stepId)) {
    return { guide, issues: [{ code: 'duplicate-step', stepId, message: `Step id "${stepId}" is already in the draft.` }] };
  }
  return validated(nodes, { ...guide, steps: [...guide.steps, { id: stepId, ...draft }] });
}

export function connectEdge(nodes: readonly AtlasNode[], guide: Guide, from: StepId, to: StepId, kind: RouteEdgeKind): GuideEditResult {
  const has = (id: StepId) => guide.steps.some((s) => s.id === id);
  if (!has(from) || !has(to)) {
    return { guide, issues: [{ code: 'missing-step', message: `Cannot connect ${from} -> ${to}: step not in draft.` }] };
  }
  return validated(nodes, { ...guide, edges: [...guide.edges, { from, to, kind }] });
}

export function setRole(nodes: readonly AtlasNode[], guide: Guide, stepId: StepId, role: RouteRole): GuideEditResult {
  if (!guide.steps.some((s) => s.id === stepId)) {
    return { guide, issues: [{ code: 'missing-step', stepId, message: `No step "${stepId}" in draft.` }] };
  }
  return validated(nodes, { ...guide, steps: guide.steps.map((s) => (s.id === stepId ? { ...s, role } : s)) });
}

export function setStance(nodes: readonly AtlasNode[], guide: Guide, nodeId: NodeId, reason: string): GuideEditResult {
  const next = { ...guide, stances: [...guide.stances.filter((s) => s.nodeId !== nodeId), { nodeId, stance: 'excluded' as const, reason }] };
  return validated(nodes, next);
}

export function clearStance(nodes: readonly AtlasNode[], guide: Guide, nodeId: NodeId): GuideEditResult {
  return validated(nodes, { ...guide, stances: guide.stances.filter((s) => s.nodeId !== nodeId) });
}

export function createProvisionalNode(
  nodes: readonly AtlasNode[], guide: Guide,
  draft: { title: string; description: string; type: NodeType }, nodeId: NodeId, stepId: StepId,
): GuideEditResult & { node: AtlasNode } {
  const node: AtlasNode = { id: nodeId, ...draft, provisional: { scopeGuideId: guide.id } };
  const result = placeStep([...nodes, node], guide,
    { nodeId, role: 'optional-depth', note: '', sortKey: guide.steps.length }, stepId);
  return { ...result, node };
}
