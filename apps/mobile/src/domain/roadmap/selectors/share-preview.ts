import type { RoadmapCatalog, RouteRole } from '../catalog';
import { linearize } from '../graph';
import type { InterestId } from '../ids';
import { interestLabels } from '../ids';
import type { ArtifactKind, ProgressState, RoadmapState } from '../state';

export type SharePreviewVm = {
  interests: { id: InterestId; label: string }[];
  build: { title: string; pathTitle: string; provenance: string | null } | null;
  steps: { nodeTitle: string; role: RouteRole; progressState: ProgressState | null }[];
  artifacts: { title: string; kind: ArtifactKind }[];
};

/**
 * Builds the read-only share page EXCLUSIVELY from state.share — state is
 * consulted only to resolve ids the selection already names. An empty
 * selection renders an empty page.
 */
export function sharePreviewView(catalog: RoadmapCatalog, state: RoadmapState): SharePreviewVm {
  const share = state.share;
  const interests = share.interestIds.map((id) => ({ id, label: interestLabels[id] }));

  const build = share.buildId !== null ? state.builds.find((b) => b.id === share.buildId) ?? null : null;
  const prov = build?.provenance;
  const buildVm = build
    ? {
      title: build.title,
      pathTitle: catalog.paths.find((p) => p.id === build.pathId)?.title ?? build.pathId,
      provenance: prov?.kind === 'adopted'
        ? `Adopted from ${catalog.guides.find((g) => g.id === prov.guideId)?.title ?? prov.guideId}`
        : null,
    }
    : null;

  const selected = new Set(share.stepIds);
  const steps = build
    ? linearize(build.steps, build.edges)
      .filter((stepId) => selected.has(stepId))
      .flatMap((stepId) => {
        const step = build.steps.find((s) => s.id === stepId);
        if (!step) return [];
        return [{
          nodeTitle: catalog.nodes.find((n) => n.id === step.nodeId)?.title ?? step.nodeId,
          role: step.role,
          progressState: state.progress[stepId]?.state ?? null,
        }];
      })
    : [];

  const artifacts = share.artifactIds.flatMap((id) => {
    const artifact = state.artifacts.find((a) => a.id === id);
    return artifact ? [{ title: artifact.title, kind: artifact.kind }] : [];
  });

  return { interests, build: buildVm, steps, artifacts };
}

export type ShareAuditVm = {
  privateBuilds: number;
  privateSteps: number;
  privateArtifacts: number;
  privateInterests: number;
};

/** Everything the current selection does NOT share — the "what remains private" moment. */
export function shareAudit(state: RoadmapState): ShareAuditVm {
  const share = state.share;
  const sharedBuild = share.buildId !== null ? 1 : 0;
  const sharedBuildSteps = state.builds.find((b) => b.id === share.buildId)?.steps.length ?? 0;
  const totalSteps = state.builds.reduce((sum, b) => sum + b.steps.length, 0);
  const stepsOutsideSharedBuild = totalSteps - sharedBuildSteps;
  return {
    privateBuilds: state.builds.length - sharedBuild,
    privateSteps: stepsOutsideSharedBuild + (sharedBuildSteps - share.stepIds.length),
    privateArtifacts: state.artifacts.length - share.artifactIds.length,
    privateInterests: state.interests.length - share.interestIds.length,
  };
}
