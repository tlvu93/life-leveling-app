import type { RoadmapCatalog, RouteRole } from './catalog';
import { validateRoute } from './graph';
import type { ArtifactId, BuildId, GuideId, NodeId, StepId } from './ids';
import type { Artifact, Build, BuildStep, ProgressEntry, RoadmapState, ShareSelection } from './state';

export type OpIssueCode = 'missing-guide' | 'missing-build' | 'missing-step' | 'missing-artifact' | 'missing-progress' | 'invalid-route';
export type OpIssue = { code: OpIssueCode; message: string };
export type OpResult = { state: RoadmapState; issues: OpIssue[] };

const fail = (state: RoadmapState, code: OpIssueCode, message: string): OpResult => ({ state, issues: [{ code, message }] });
const ok = (state: RoadmapState): OpResult => ({ state, issues: [] });

function withBuild(state: RoadmapState, buildId: BuildId, update: (build: Build) => Build): RoadmapState {
  return { ...state, builds: state.builds.map((b) => (b.id === buildId ? update(b) : b)) };
}

export function adoptGuide(catalog: RoadmapCatalog, state: RoadmapState, guideId: GuideId, ids: () => string, now: string): OpResult {
  const guide = catalog.guides.find((g) => g.id === guideId);
  if (!guide) return fail(state, 'missing-guide', `No guide "${guideId}" in the catalog.`);
  void now;
  const idMap = new Map(guide.steps.map((s) => [s.id, ids()]));
  const build: Build = {
    id: ids(),
    title: guide.title,
    pathId: guide.pathId,
    provenance: { kind: 'adopted', guideId: guide.id, guideVersion: guide.version },
    steps: guide.steps.map((s) => ({
      ...s,
      ...(s.quest ? { quest: { ...s.quest } } : {}),
      id: idMap.get(s.id) as StepId,
      origin: { kind: 'from-guide' },
    })),
    edges: guide.edges.map((e) => ({ from: idMap.get(e.from) as StepId, to: idMap.get(e.to) as StepId, kind: e.kind })),
  };
  return ok({ ...state, builds: [...state.builds, build], activeBuildId: build.id });
}

export function replaceStep(state: RoadmapState, buildId: BuildId, stepId: StepId, nodeId: NodeId): OpResult {
  const build = state.builds.find((b) => b.id === buildId);
  if (!build) return fail(state, 'missing-build', `No build "${buildId}".`);
  const step = build.steps.find((s) => s.id === stepId);
  if (!step) return fail(state, 'missing-step', `No step "${stepId}" in build "${buildId}".`);
  return ok(withBuild(state, buildId, (b) => ({
    ...b,
    steps: b.steps.map((s) => (s.id === stepId
      ? { ...s, nodeId, origin: { kind: 'replaced', originalNodeId: s.nodeId } }
      : s)),
  })));
}

export function addStep(
  state: RoadmapState, buildId: BuildId,
  draft: { nodeId: NodeId; role: RouteRole; note: string; sortKey: number },
  afterStepId: StepId | null, ids: () => string,
): OpResult {
  const build = state.builds.find((b) => b.id === buildId);
  if (!build) return fail(state, 'missing-build', `No build "${buildId}".`);
  if (afterStepId !== null && !build.steps.some((s) => s.id === afterStepId)) {
    return fail(state, 'missing-step', `No step "${afterStepId}" to attach after.`);
  }
  const step: BuildStep = { id: ids(), ...draft, origin: { kind: 'added' } };
  const edges = afterStepId ? [...build.edges, { from: afterStepId, to: step.id, kind: 'next' as const }] : build.edges;
  return ok(withBuild(state, buildId, (b) => ({ ...b, steps: [...b.steps, step], edges })));
}

/**
 * Removes a step, splicing next-edges across the gap (pred -> succ).
 * Alternative edges touching the step are dropped. Refuses (input unchanged)
 * if the spliced graph would be invalid.
 */
export function removeStep(state: RoadmapState, buildId: BuildId, stepId: StepId): OpResult {
  const build = state.builds.find((b) => b.id === buildId);
  if (!build) return fail(state, 'missing-build', `No build "${buildId}".`);
  if (!build.steps.some((s) => s.id === stepId)) return fail(state, 'missing-step', `No step "${stepId}".`);
  const preds = build.edges.filter((e) => e.to === stepId && e.kind === 'next').map((e) => e.from);
  const succs = build.edges.filter((e) => e.from === stepId && e.kind === 'next').map((e) => e.to);
  const kept = build.edges.filter((e) => e.from !== stepId && e.to !== stepId);
  const spliced = [...kept];
  for (const p of preds) for (const s of succs) {
    if (!spliced.some((e) => e.from === p && e.to === s && e.kind === 'next')) spliced.push({ from: p, to: s, kind: 'next' });
  }
  const steps = build.steps.filter((s) => s.id !== stepId);
  if (validateRoute(steps, spliced).length > 0) {
    return fail(state, 'invalid-route', `Removing "${stepId}" would break the route.`);
  }
  const progress = { ...state.progress };
  delete progress[stepId];
  const next = withBuild(state, buildId, (b) => ({ ...b, steps, edges: spliced }));
  return ok({
    ...next,
    progress,
    share: { ...next.share, stepIds: next.share.stepIds.filter((id) => id !== stepId) },
  });
}

export function setProgress(state: RoadmapState, stepId: StepId, entry: ProgressEntry): OpResult {
  if (!state.builds.some((b) => b.steps.some((s) => s.id === stepId))) {
    return fail(state, 'missing-step', `No step "${stepId}" in any build.`);
  }
  const artifactIds = entry.artifactIds.filter((id) => state.artifacts.some((a) => a.id === id));
  return ok({ ...state, progress: { ...state.progress, [stepId]: { ...entry, artifactIds } } });
}

export function addArtifact(state: RoadmapState, artifact: Artifact): OpResult {
  return ok({ ...state, artifacts: [...state.artifacts, artifact] });
}

export function attachArtifact(state: RoadmapState, stepId: StepId, artifactId: ArtifactId): OpResult {
  if (!state.artifacts.some((a) => a.id === artifactId)) return fail(state, 'missing-artifact', `No artifact "${artifactId}".`);
  const entry = state.progress[stepId];
  if (!entry) return fail(state, 'missing-progress', `Record progress on "${stepId}" before attaching evidence.`);
  if (entry.artifactIds.includes(artifactId)) return ok(state);
  return ok({ ...state, progress: { ...state.progress, [stepId]: { ...entry, artifactIds: [...entry.artifactIds, artifactId] } } });
}

/**
 * The ONLY writer of ShareSelection (with removeStep's pruning). Merges the
 * patch, then prunes: interests must be the user's own, stepIds must belong to
 * the shared build, artifactIds must exist.
 */
export function selectForShare(state: RoadmapState, patch: Partial<ShareSelection>): OpResult {
  const merged: ShareSelection = { ...state.share, ...patch };
  const buildId = merged.buildId !== null && state.builds.some((b) => b.id === merged.buildId) ? merged.buildId : null;
  const buildStepIds = new Set(state.builds.find((b) => b.id === buildId)?.steps.map((s) => s.id) ?? []);
  return ok({
    ...state,
    share: {
      interestIds: merged.interestIds.filter((id) => state.interests.includes(id)),
      buildId,
      stepIds: buildId ? merged.stepIds.filter((id) => buildStepIds.has(id)) : [],
      artifactIds: merged.artifactIds.filter((id) => state.artifacts.some((a) => a.id === id)),
    },
  });
}

export function clearShare(state: RoadmapState): OpResult {
  return ok({ ...state, share: { interestIds: [], buildId: null, stepIds: [], artifactIds: [] } });
}
