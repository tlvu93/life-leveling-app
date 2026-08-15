import type { Guide, GuideStep, RouteEdge } from './catalog';
import type { NodeId, StepId } from './ids';

export type GraphIssueCode =
  | 'missing-step' | 'self-edge' | 'duplicate-edge' | 'duplicate-step' | 'cycle'
  | 'no-entry' | 'unknown-node' | 'stance-on-placed' | 'empty-stance-reason' | 'duplicate-stance';

export type GraphIssue = { code: GraphIssueCode; stepId?: StepId; nodeId?: NodeId; message: string };

export function validateRoute(steps: readonly GuideStep[], edges: readonly RouteEdge[]): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const ids = new Set<string>();
  for (const s of steps) {
    if (ids.has(s.id)) issues.push({ code: 'duplicate-step', stepId: s.id, message: `Duplicate step id "${s.id}".` });
    ids.add(s.id);
  }
  if (steps.length === 0) issues.push({ code: 'no-entry', message: 'A route needs at least one step.' });
  const seen = new Set<string>();
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) {
      issues.push({ code: 'missing-step', message: `Edge ${e.from} -> ${e.to} references a missing step.` });
      continue;
    }
    if (e.from === e.to) issues.push({ code: 'self-edge', stepId: e.from, message: `Step "${e.from}" cannot connect to itself.` });
    const key = `${e.from}|${e.to}|${e.kind}`;
    if (seen.has(key)) issues.push({ code: 'duplicate-edge', message: `Duplicate edge ${e.from} -> ${e.to} (${e.kind}).` });
    seen.add(key);
  }
  if (issues.length === 0 && hasCycle(steps, edges)) issues.push({ code: 'cycle', message: 'The route graph contains a cycle.' });
  return issues;
}

function hasCycle(steps: readonly GuideStep[], edges: readonly RouteEdge[]): boolean {
  return linearize(steps, edges).length < steps.length;
}

/**
 * Kahn's algorithm; at each pick, take the ready step with lowest (sortKey, id).
 * Total for acyclic graphs; steps stuck in cycles are omitted. Isolated steps
 * have no incoming edges and are ordinary entries.
 */
export function linearize(steps: readonly GuideStep[], edges: readonly RouteEdge[]): StepId[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const incoming = new Map<string, number>(steps.map((s) => [s.id, 0]));
  const out = new Map<string, string[]>();
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to) || e.from === e.to) continue;
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  }
  const rank = (id: string) => (byId.get(id) as GuideStep).sortKey;
  const ready = steps.filter((s) => (incoming.get(s.id) ?? 0) === 0).map((s) => s.id);
  const order: StepId[] = [];
  while (ready.length > 0) {
    ready.sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
    const id = ready.shift() as string;
    order.push(id);
    for (const to of out.get(id) ?? []) {
      const left = (incoming.get(to) ?? 0) - 1;
      incoming.set(to, left);
      if (left === 0) ready.push(to);
    }
  }
  return order;
}

/** Full guide validation: route + node existence (shared or provisional-in-scope) + stances. */
export function validateGuide(guide: Guide, knownNodeIds: ReadonlySet<string>): GraphIssue[] {
  const issues = validateRoute(guide.steps, guide.edges);
  const placed = new Set(guide.steps.map((s) => s.nodeId));
  for (const s of guide.steps) {
    if (!knownNodeIds.has(s.nodeId)) issues.push({ code: 'unknown-node', stepId: s.id, nodeId: s.nodeId, message: `Step "${s.id}" places unknown node "${s.nodeId}".` });
  }
  const stanced = new Set<string>();
  for (const st of guide.stances) {
    if (stanced.has(st.nodeId)) issues.push({ code: 'duplicate-stance', nodeId: st.nodeId, message: `Duplicate stance on "${st.nodeId}".` });
    stanced.add(st.nodeId);
    if (placed.has(st.nodeId)) issues.push({ code: 'stance-on-placed', nodeId: st.nodeId, message: `"${st.nodeId}" is placed in the route; a stance is only for unplaced nodes.` });
    if (!st.reason.trim()) issues.push({ code: 'empty-stance-reason', nodeId: st.nodeId, message: `Excluding "${st.nodeId}" requires a reason.` });
  }
  return issues;
}
