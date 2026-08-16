import type { NodeSize, NodeType, RoadmapCatalog, UniverseRelationship } from '../catalog';
import type { GuideId, InterestId, NodeId, PathId } from '../ids';
import { interestLabels } from '../ids';
import type { ProgressState, RoadmapState } from '../state';

export type UniverseNodeVm = {
  id: NodeId;
  title: string;
  type: NodeType;
  domainId: InterestId;
  clusterId: string;
  depth: 0 | 1 | 2 | 3;
  size: NodeSize;
  progressState: ProgressState | null;
};

export type UniversePathVm = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  featuredGuideId: GuideId | null;
};

export type UniverseVm = {
  domains: { id: InterestId; label: string }[];
  nodes: UniverseNodeVm[];
  relationships: UniverseRelationship[];
  paths: UniversePathVm[];
};

/**
 * Active engagement outranks resting states, so a node the person practises in
 * one Journey never reads as "skipped" because another Journey dropped it.
 */
const activeRank: readonly ProgressState[] = ['demonstrated', 'practicing', 'tried', 'interested'];
const restingRank: readonly ProgressState[] = ['paused', 'skipped', 'not-for-me'];

export function strongestState(states: readonly ProgressState[]): ProgressState | null {
  for (const candidate of activeRank) if (states.includes(candidate)) return candidate;
  for (const candidate of restingRank) if (states.includes(candidate)) return candidate;
  return null;
}

/** Collects every recorded state per node id, across all of the person's Journeys. */
export function progressStatesByNode(state: RoadmapState): Map<NodeId, ProgressState[]> {
  const byNode = new Map<NodeId, ProgressState[]>();
  for (const build of state.builds) {
    for (const step of build.steps) {
      const entry = state.progress[step.id];
      if (!entry) continue;
      byNode.set(step.nodeId, [...(byNode.get(step.nodeId) ?? []), entry.state]);
    }
  }
  return byNode;
}

export function universeView(catalog: RoadmapCatalog, state: RoadmapState): UniverseVm {
  const statesByNode = progressStatesByNode(state);

  const nodes: UniverseNodeVm[] = catalog.nodes
    .filter((n) => !n.provisional)
    .map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      domainId: n.domainId,
      clusterId: n.clusterId,
      depth: n.depth,
      size: n.size,
      progressState: strongestState(statesByNode.get(n.id) ?? []),
    }));

  const visible = new Set(nodes.map((n) => n.id));
  const domainIds = Array.from(new Set(nodes.map((n) => n.domainId))).sort();

  return {
    domains: domainIds.map((id) => ({ id, label: interestLabels[id] })),
    nodes,
    relationships: catalog.relationships.filter((r) => visible.has(r.from) && visible.has(r.to)),
    paths: catalog.paths.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      featuredGuideId: p.featuredGuideId ?? null,
    })),
  };
}
