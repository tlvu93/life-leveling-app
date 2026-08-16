import type { Path, RoadmapCatalog } from '../catalog';
import type { GuideId, PathId } from '../ids';

export type PathOverviewVm = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  overview: Path['overview'];
  guides: { id: GuideId; title: string; audience: string; outcome: string }[];
  neighbors: { id: PathId; title: string; whatItIs: string }[];
};

export function pathOverviewView(catalog: RoadmapCatalog, pathId: PathId): PathOverviewVm | null {
  const path = catalog.paths.find((p) => p.id === pathId);
  if (!path) return null;
  const guides = catalog.guides
    .filter((g) => g.pathId === pathId)
    .map((g) => ({ id: g.id, title: g.title, audience: g.persona.audience, outcome: g.persona.outcome }));
  const neighbors = path.neighborPathIds.flatMap((id) => {
    const neighbor = catalog.paths.find((p) => p.id === id);
    return neighbor ? [{ id: neighbor.id, title: neighbor.title, whatItIs: neighbor.overview.whatItIs }] : [];
  });
  return { id: path.id, title: path.title, status: path.status, overview: path.overview, guides, neighbors };
}
