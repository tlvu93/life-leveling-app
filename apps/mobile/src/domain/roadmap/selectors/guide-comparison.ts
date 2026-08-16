import type { Guide, GuidePersona, RoadmapCatalog, RouteRole } from '../catalog';
import { linearize } from '../graph';
import type { GuideId, NodeId } from '../ids';

export type ComparisonSide =
  | { kind: 'placed'; role: RouteRole; note: string }
  | { kind: 'excluded'; reason: string }
  | { kind: 'absent' };

export type NodeComparisonRow = { nodeId: NodeId; nodeTitle: string; a: ComparisonSide; b: ComparisonSide };

export type GuideComparisonVm = {
  a: { id: GuideId; title: string; persona: GuidePersona };
  b: { id: GuideId; title: string; persona: GuidePersona };
  rows: NodeComparisonRow[];
  personaDiffs: { field: 'audience' | 'startingPoint' | 'outcome' | 'assumptions'; a: string; b: string }[];
  stanceDisagreements: { nodeId: NodeId; nodeTitle: string; placedIn: GuideId; role: RouteRole; excludedIn: GuideId; reason: string }[];
  materialDifferences: string[];
};

/** Node order in a guide: first appearance in the deterministic linearization. */
function nodeOrder(guide: Guide): NodeId[] {
  const byStep = new Map(guide.steps.map((s) => [s.id, s.nodeId]));
  const seen = new Set<NodeId>();
  const order: NodeId[] = [];
  for (const stepId of linearize(guide.steps, guide.edges)) {
    const nodeId = byStep.get(stepId) as NodeId;
    if (!seen.has(nodeId)) { seen.add(nodeId); order.push(nodeId); }
  }
  return order;
}

function side(guide: Guide, nodeId: NodeId): ComparisonSide {
  const order = linearize(guide.steps, guide.edges);
  const stepId = order.find((id) => guide.steps.find((s) => s.id === id)?.nodeId === nodeId);
  const step = guide.steps.find((s) => s.id === stepId);
  if (step) return { kind: 'placed', role: step.role, note: step.note };
  const stance = guide.stances.find((s) => s.nodeId === nodeId);
  if (stance) return { kind: 'excluded', reason: stance.reason };
  return { kind: 'absent' };
}

const strongRoles: readonly RouteRole[] = ['required', 'checkpoint'];

export function compareGuides(catalog: RoadmapCatalog, guideIdA: GuideId, guideIdB: GuideId): GuideComparisonVm | null {
  const a = catalog.guides.find((g) => g.id === guideIdA);
  const b = catalog.guides.find((g) => g.id === guideIdB);
  if (!a || !b) return null;
  const title = (nodeId: NodeId) => catalog.nodes.find((n) => n.id === nodeId)?.title ?? nodeId;

  const inA = nodeOrder(a);
  const inASet = new Set(inA);
  const onlyInB = nodeOrder(b).filter((id) => !inASet.has(id));
  const covered = new Set([...inA, ...onlyInB]);
  const stanceOnly = [...a.stances, ...b.stances]
    .map((s) => s.nodeId)
    .filter((id, index, all) => !covered.has(id) && all.indexOf(id) === index)
    .sort((x, y) => title(x).localeCompare(title(y)));

  const rows: NodeComparisonRow[] = [...inA, ...onlyInB, ...stanceOnly].map((nodeId) => ({
    nodeId,
    nodeTitle: title(nodeId),
    a: side(a, nodeId),
    b: side(b, nodeId),
  }));

  const personaDiffs: GuideComparisonVm['personaDiffs'] = [];
  const fields = [
    ['audience', a.persona.audience, b.persona.audience],
    ['startingPoint', a.persona.startingPoint, b.persona.startingPoint],
    ['outcome', a.persona.outcome, b.persona.outcome],
    ['assumptions', a.persona.assumptions.join(' '), b.persona.assumptions.join(' ')],
  ] as const;
  for (const [field, va, vb] of fields) {
    if (va.trim() !== vb.trim()) personaDiffs.push({ field, a: va, b: vb });
  }

  const stanceDisagreements: GuideComparisonVm['stanceDisagreements'] = [];
  for (const row of rows) {
    if (row.a.kind === 'placed' && row.b.kind === 'excluded') {
      stanceDisagreements.push({ nodeId: row.nodeId, nodeTitle: row.nodeTitle, placedIn: a.id, role: row.a.role, excludedIn: b.id, reason: row.b.reason });
    } else if (row.b.kind === 'placed' && row.a.kind === 'excluded') {
      stanceDisagreements.push({ nodeId: row.nodeId, nodeTitle: row.nodeTitle, placedIn: b.id, role: row.b.role, excludedIn: a.id, reason: row.a.reason });
    }
  }

  const describe = (s: ComparisonSide) =>
    s.kind === 'placed' ? s.role : s.kind === 'excluded' ? 'deliberately excluded' : 'not on the route';
  const materialDifferences: string[] = [];
  const fieldLabels = { audience: 'Audience', startingPoint: 'Starting point', outcome: 'Outcome', assumptions: 'Assumptions' } as const;
  for (const diff of personaDiffs) {
    materialDifferences.push(`${fieldLabels[diff.field]} differs: "${diff.a}" vs "${diff.b}".`);
  }
  for (const row of rows) {
    const aStrong = row.a.kind === 'placed' && strongRoles.includes(row.a.role);
    const bStrong = row.b.kind === 'placed' && strongRoles.includes(row.b.role);
    const aGone = row.a.kind !== 'placed';
    const bGone = row.b.kind !== 'placed';
    const placedVsExcluded = (row.a.kind === 'placed' && row.b.kind === 'excluded') || (row.b.kind === 'placed' && row.a.kind === 'excluded');
    if ((aStrong && bGone) || (bStrong && aGone) || placedVsExcluded) {
      materialDifferences.push(`${row.nodeTitle}: ${describe(row.a)} in ${a.title}, ${describe(row.b)} in ${b.title}.`);
    }
  }

  return {
    a: { id: a.id, title: a.title, persona: a.persona },
    b: { id: b.id, title: b.title, persona: b.persona },
    rows,
    personaDiffs,
    stanceDisagreements,
    materialDifferences,
  };
}
