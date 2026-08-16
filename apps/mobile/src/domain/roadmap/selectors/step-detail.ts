import type { NodeType, Quest, RoadmapCatalog, RouteRole } from '../catalog';
import type { BuildId, StepId } from '../ids';
import { progressStates, type Artifact, type ProgressEntry, type ProgressState, type RoadmapState } from '../state';

export type StepDetailVm = {
  stepId: StepId;
  nodeTitle: string;
  nodeType: NodeType;
  nodeDescription: string;
  role: RouteRole;
  note: string;
  quest: Quest | null;
  progress: ProgressEntry | null;
  availableStates: readonly ProgressState[];
  artifacts: Artifact[];
};

export function stepDetailView(catalog: RoadmapCatalog, state: RoadmapState, buildId: BuildId, stepId: StepId): StepDetailVm | null {
  const build = state.builds.find((b) => b.id === buildId);
  const step = build?.steps.find((s) => s.id === stepId);
  if (!build || !step) return null;
  const node = catalog.nodes.find((n) => n.id === step.nodeId);
  const progress = state.progress[stepId] ?? null;
  const artifacts = (progress?.artifactIds ?? []).flatMap((id) => {
    const artifact = state.artifacts.find((a) => a.id === id);
    return artifact ? [artifact] : [];
  });
  return {
    stepId,
    nodeTitle: node?.title ?? step.nodeId,
    nodeType: node?.type ?? 'skill',
    nodeDescription: node?.description ?? '',
    role: step.role,
    note: step.note,
    quest: step.quest ?? null,
    progress,
    availableStates: progressStates,
    artifacts,
  };
}
