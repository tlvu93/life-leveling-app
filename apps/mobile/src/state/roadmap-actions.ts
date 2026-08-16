import type { RoadmapCatalog } from '../domain/roadmap/catalog';
import type { GuideId, InterestId, StepId } from '../domain/roadmap/ids';
import { adoptGuide, setProgress, type OpResult } from '../domain/roadmap/ops';
import type { ProgressState, RoadmapState } from '../domain/roadmap/state';

/**
 * Ids and timestamps live here so the domain layer stays pure. These helpers
 * are also where the provider's only non-trivial logic sits, which keeps it
 * unit-testable without a component renderer.
 */
export function makeIdFactory(prefix: string): () => string {
  let counter = 0;
  const stamp = Date.now().toString(36);
  return () => {
    counter += 1;
    return `${prefix}-${stamp}-${counter.toString(36)}`;
  };
}

export function applySetInterests(state: RoadmapState, interests: InterestId[]): OpResult {
  return { state: { ...state, interests }, issues: [] };
}

export function applyAdoptGuide(
  catalog: RoadmapCatalog, state: RoadmapState, guideId: GuideId, ids: () => string, now: string,
): OpResult {
  return adoptGuide(catalog, state, guideId, ids, now);
}

/** Changing a progress state never drops evidence the person already attached. */
export function applySetProgress(
  state: RoadmapState, stepId: StepId, progress: ProgressState, now: string, note?: string,
): OpResult {
  return setProgress(state, stepId, {
    state: progress,
    updatedAt: now,
    artifactIds: state.progress[stepId]?.artifactIds ?? [],
    ...(note ? { note } : {}),
  });
}
