import type { RoadmapCatalog, RouteRole } from '../catalog';
import { linearize } from '../graph';
import type { BuildId, StepId } from '../ids';
import type { ProgressState, RoadmapState } from '../state';

export type BuildStepVm = {
  stepId: StepId;
  nodeTitle: string;
  role: RouteRole;
  note: string;
  originBadge: string | null;
  progressState: ProgressState | null;
  branchOf: StepId | null;
};

export type BuildVm = {
  id: BuildId;
  title: string;
  pathTitle: string;
  provenance: string | null;
  steps: BuildStepVm[];
};

export function buildView(catalog: RoadmapCatalog, state: RoadmapState, buildId: BuildId): BuildVm | null {
  const build = state.builds.find((b) => b.id === buildId);
  if (!build) return null;
  const nodeTitle = (nodeId: string) => catalog.nodes.find((n) => n.id === nodeId)?.title ?? nodeId;
  const prov = build.provenance;
  const provenance = prov.kind === 'adopted'
    ? `Adopted from ${catalog.guides.find((g) => g.id === prov.guideId)?.title ?? prov.guideId} (v${prov.guideVersion})`
    : null;
  const branchOf = new Map<StepId, StepId>();
  for (const e of build.edges) {
    if (e.kind === 'alternative') branchOf.set(e.to, e.from);
  }
  const byId = new Map(build.steps.map((s) => [s.id, s]));
  const steps = linearize(build.steps, build.edges).flatMap((stepId) => {
    const step = byId.get(stepId);
    if (!step) return [];
    const originBadge = step.origin.kind === 'added'
      ? 'Added by you'
      : step.origin.kind === 'replaced'
        ? `Replaced: ${nodeTitle(step.origin.originalNodeId)}`
        : null;
    return [{
      stepId,
      nodeTitle: nodeTitle(step.nodeId),
      role: step.role,
      note: step.note,
      originBadge,
      progressState: state.progress[stepId]?.state ?? null,
      branchOf: branchOf.get(stepId) ?? null,
    }];
  });
  return {
    id: build.id,
    title: build.title,
    pathTitle: catalog.paths.find((p) => p.id === build.pathId)?.title ?? build.pathId,
    provenance,
    steps,
  };
}
