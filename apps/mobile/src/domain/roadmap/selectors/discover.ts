import type { RoadmapCatalog } from '../catalog';
import type { InterestId, PathId } from '../ids';
import { interestLabels } from '../ids';
import type { RoadmapState } from '../state';

export type DiscoverPathVm = {
  id: PathId;
  title: string;
  whatItIs: string;
  status: 'full' | 'stub';
  matchedInterests: InterestId[];
};

export type DiscoverVm = {
  interests: { id: InterestId; label: string; selected: boolean }[];
  paths: DiscoverPathVm[];
};

export function discoverView(catalog: RoadmapCatalog, state: RoadmapState): DiscoverVm {
  const interests = (Object.keys(interestLabels) as InterestId[]).map((id) => ({
    id,
    label: interestLabels[id],
    selected: state.interests.includes(id),
  }));
  const paths = catalog.paths
    .map((p) => ({
      id: p.id,
      title: p.title,
      whatItIs: p.overview.whatItIs,
      status: p.status,
      matchedInterests: p.interestIds.filter((i) => state.interests.includes(i)),
    }))
    .sort((a, b) =>
      b.matchedInterests.length - a.matchedInterests.length
      || (a.status === b.status ? 0 : a.status === 'full' ? -1 : 1)
      || a.title.localeCompare(b.title));
  return { interests, paths };
}
