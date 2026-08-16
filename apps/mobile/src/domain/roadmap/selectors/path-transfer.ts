import type { RoadmapCatalog } from '../catalog';
import type { NodeId, PathId } from '../ids';
import type { ProgressState, RoadmapState } from '../state';
import { progressStatesByNode, strongestState } from './universe';

/** Only hands-on engagement transfers; resting states do not claim relevance. */
const transferring: readonly ProgressState[] = ['tried', 'practicing', 'demonstrated'];

export type PathTransferVm = {
  pathId: PathId;
  pathTitle: string;
  applies: { nodeId: NodeId; title: string; state: ProgressState }[];
  applyCount: number;
  /** Path size, so a UI variant can derive a percentage for A-008 session testing. */
  totalNodes: number;
};

export function pathTransferView(catalog: RoadmapCatalog, state: RoadmapState, pathId: PathId): PathTransferVm | null {
  const path = catalog.paths.find((p) => p.id === pathId);
  if (!path) return null;

  const statesByNode = progressStatesByNode(state);

  const applies = path.nodeIds.flatMap((nodeId) => {
    const best = strongestState(statesByNode.get(nodeId) ?? []);
    if (!best || !transferring.includes(best)) return [];
    return [{ nodeId, title: catalog.nodes.find((n) => n.id === nodeId)?.title ?? nodeId, state: best }];
  });

  return { pathId: path.id, pathTitle: path.title, applies, applyCount: applies.length, totalNodes: path.nodeIds.length };
}
