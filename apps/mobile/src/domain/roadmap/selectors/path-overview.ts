import type { Path, RoadmapCatalog } from '../catalog';
import type { GuideId, PathId } from '../ids';

export type PathNeighborVm = {
  id: PathId;
  title: string;
  whatItIs: string;
  /** How the two Paths are connected: an editorial link, or an explained bridge. */
  via: 'curated' | 'bridge';
  /** The bridge's story, when the connection came from one. */
  bridgeNote?: string;
};

export type PathOverviewVm = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  overview: Path['overview'];
  guides: { id: GuideId; title: string; audience: string; outcome: string }[];
  neighbors: PathNeighborVm[];
};

/**
 * Neighbours are derived, never stored twice: the curated `neighborPathIds`
 * come first, then any Path reached by a bridge out of this constellation.
 * Authoring a bridge is therefore enough to make two Paths visibly adjacent.
 */
export function pathOverviewView(catalog: RoadmapCatalog, pathId: PathId): PathOverviewVm | null {
  const path = catalog.paths.find((p) => p.id === pathId);
  if (!path) return null;

  const guides = catalog.guides
    .filter((g) => g.pathId === pathId)
    .map((g) => ({ id: g.id, title: g.title, audience: g.persona.audience, outcome: g.persona.outcome }));

  const clusterOf = (nodeId: string) => catalog.nodes.find((n) => n.id === nodeId)?.clusterId;
  const bridgedNotes = new Map<PathId, string | undefined>();
  for (const rel of catalog.relationships) {
    if (rel.kind !== 'bridge') continue;
    const fromCluster = clusterOf(rel.from);
    const toCluster = clusterOf(rel.to);
    const other = fromCluster === pathId ? toCluster : toCluster === pathId ? fromCluster : undefined;
    if (other && other !== pathId && !bridgedNotes.has(other)) bridgedNotes.set(other, rel.note);
  }

  const seen = new Set<PathId>();
  const neighbors: PathNeighborVm[] = [];
  const push = (id: PathId, via: 'curated' | 'bridge', bridgeNote?: string) => {
    if (seen.has(id) || id === pathId) return;
    const neighbor = catalog.paths.find((p) => p.id === id);
    if (!neighbor) return;
    seen.add(id);
    neighbors.push({
      id: neighbor.id,
      title: neighbor.title,
      whatItIs: neighbor.overview.whatItIs,
      via,
      ...(via === 'bridge' && bridgeNote ? { bridgeNote } : {}),
    });
  };

  for (const id of path.neighborPathIds) push(id, 'curated');
  for (const [id, note] of bridgedNotes) push(id, 'bridge', note);

  return { id: path.id, title: path.title, status: path.status, overview: path.overview, guides, neighbors };
}
