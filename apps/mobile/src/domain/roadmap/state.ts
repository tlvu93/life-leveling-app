import type { GuideStep, RouteEdge, RouteRole } from './catalog';
import { validateRoute } from './graph';
import type { ArtifactId, BuildId, GuideId, InterestId, NodeId, PathId, StepId } from './ids';
import { interestLabels } from './ids';

export const ROADMAP_STORAGE_KEY = 'life-leveling.roadmap.v1';

export type ProgressState = 'interested' | 'tried' | 'practicing' | 'demonstrated' | 'paused' | 'skipped' | 'not-for-me';
export const progressStates: readonly ProgressState[] = ['interested', 'tried', 'practicing', 'demonstrated', 'paused', 'skipped', 'not-for-me'];

export type StepOrigin =
  | { kind: 'from-guide' }
  | { kind: 'added' }
  | { kind: 'replaced'; originalNodeId: NodeId };

export type BuildStep = GuideStep & { origin: StepOrigin };

export type BuildProvenance =
  | { kind: 'adopted'; guideId: GuideId; guideVersion: number }
  | { kind: 'scratch' };

export type Build = {
  id: BuildId;
  title: string;
  pathId: PathId;
  provenance: BuildProvenance;
  steps: BuildStep[];
  edges: RouteEdge[];
};

export type ProgressEntry = { state: ProgressState; updatedAt: string; artifactIds: ArtifactId[]; note?: string };

export type ArtifactKind = 'note' | 'link' | 'image' | 'file' | 'recording';
export type Artifact = { id: ArtifactId; kind: ArtifactKind; title: string; value: string; createdAt: string };

export type ShareSelection = {
  interestIds: InterestId[];
  buildId: BuildId | null;
  stepIds: StepId[];
  artifactIds: ArtifactId[];
};

export type RoadmapState = {
  version: 1;
  interests: InterestId[];
  builds: Build[];
  activeBuildId: BuildId | null;
  artifacts: Artifact[];
  progress: Record<StepId, ProgressEntry>;
  share: ShareSelection;
};

export const defaultRoadmapState: RoadmapState = {
  version: 1,
  interests: [],
  builds: [],
  activeBuildId: null,
  artifacts: [],
  progress: {},
  share: { interestIds: [], buildId: null, stepIds: [], artifactIds: [] },
};

function freshDefault(): RoadmapState {
  return {
    ...defaultRoadmapState,
    interests: [],
    builds: [],
    artifacts: [],
    progress: {},
    share: { interestIds: [], buildId: null, stepIds: [], artifactIds: [] },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parseStored(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

const routeRoles: readonly RouteRole[] = ['required', 'recommended', 'optional-depth', 'alternative', 'checkpoint'];
const artifactKinds: readonly ArtifactKind[] = ['note', 'link', 'image', 'file', 'recording'];

function str(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

function originFrom(value: unknown): StepOrigin {
  const record = asRecord(value);
  if (record?.kind === 'added') return { kind: 'added' };
  if (record?.kind === 'replaced' && typeof record.originalNodeId === 'string') {
    return { kind: 'replaced', originalNodeId: record.originalNodeId.slice(0, 120) };
  }
  return { kind: 'from-guide' };
}

function stepFrom(value: unknown): BuildStep | null {
  const record = asRecord(value);
  const id = str(record?.id, 120);
  const nodeId = str(record?.nodeId, 120);
  const role = routeRoles.find((r) => r === record?.role);
  if (!record || !id || !nodeId || !role) return null;
  const questRecord = asRecord(record.quest);
  const questId = str(questRecord?.id, 120);
  const questPrompt = str(questRecord?.prompt, 500);
  const questKind = questRecord?.kind === 'observe' || questRecord?.kind === 'try' || questRecord?.kind === 'make' || questRecord?.kind === 'meet' ? questRecord.kind : null;
  return {
    id,
    nodeId,
    role,
    note: str(record.note, 1000) ?? '',
    sortKey: typeof record.sortKey === 'number' && Number.isFinite(record.sortKey) ? record.sortKey : 0,
    ...(questId && questPrompt && questKind ? { quest: { id: questId, prompt: questPrompt, kind: questKind } } : {}),
    origin: originFrom(record.origin),
  };
}

function edgesFrom(value: unknown, stepIds: ReadonlySet<string>): RouteEdge[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    const record = asRecord(candidate);
    const from = str(record?.from, 120);
    const to = str(record?.to, 120);
    const kind = record?.kind === 'alternative' ? 'alternative' as const : record?.kind === 'next' ? 'next' as const : null;
    return from && to && kind && stepIds.has(from) && stepIds.has(to) ? [{ from, to, kind }] : [];
  });
}

function provenanceFrom(value: unknown): BuildProvenance {
  const record = asRecord(value);
  if (record?.kind === 'adopted' && typeof record.guideId === 'string' && typeof record.guideVersion === 'number') {
    return { kind: 'adopted', guideId: record.guideId.slice(0, 120), guideVersion: record.guideVersion };
  }
  return { kind: 'scratch' };
}

function buildFrom(value: unknown): Build | null {
  const record = asRecord(value);
  const id = str(record?.id, 120);
  const title = str(record?.title, 160)?.trim();
  const pathId = str(record?.pathId, 120);
  if (!record || !id || !title || !pathId || !Array.isArray(record.steps)) return null;
  const steps = record.steps.map(stepFrom).filter((s): s is BuildStep => s !== null);
  if (steps.length !== record.steps.length || steps.length === 0) return null;
  const edges = edgesFrom(record.edges, new Set(steps.map((s) => s.id)));
  if (validateRoute(steps, edges).length > 0) return null;
  return { id, title, pathId, provenance: provenanceFrom(record.provenance), steps, edges };
}

function artifactFrom(value: unknown): Artifact | null {
  const record = asRecord(value);
  const id = str(record?.id, 120);
  const kind = artifactKinds.find((k) => k === record?.kind);
  const title = str(record?.title, 180)?.trim();
  const artifactValue = str(record?.value, 4000);
  const createdAt = str(record?.createdAt, 60);
  if (!record || !id || !kind || !title || artifactValue === null || !createdAt) return null;
  return { id, kind, title, value: artifactValue, createdAt };
}

function interestsFrom(value: unknown): InterestId[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((candidate): candidate is InterestId =>
    typeof candidate === 'string' && Object.prototype.hasOwnProperty.call(interestLabels, candidate))));
}

export function migrateRoadmapState(value: unknown): RoadmapState {
  const record = asRecord(parseStored(value));
  if (!record || record.version !== 1) return freshDefault();

  const builds = Array.isArray(record.builds)
    ? record.builds.map(buildFrom).filter((b): b is Build => b !== null)
    : [];
  const buildIds = new Set(builds.map((b) => b.id));
  const stepIds = new Set(builds.flatMap((b) => b.steps.map((s) => s.id)));
  const artifacts = Array.isArray(record.artifacts)
    ? record.artifacts.map(artifactFrom).filter((a): a is Artifact => a !== null)
    : [];
  const artifactIds = new Set(artifacts.map((a) => a.id));

  const progress: Record<StepId, ProgressEntry> = {};
  const progressRecord = asRecord(record.progress);
  if (progressRecord) {
    for (const [stepId, raw] of Object.entries(progressRecord)) {
      if (!stepIds.has(stepId)) continue;
      const entry = asRecord(raw);
      const state = progressStates.find((s) => s === entry?.state);
      const updatedAt = str(entry?.updatedAt, 60);
      if (!state || !updatedAt) continue;
      const note = str(entry?.note, 1000);
      progress[stepId] = {
        state,
        updatedAt,
        artifactIds: Array.isArray(entry?.artifactIds)
          ? entry.artifactIds.filter((id): id is ArtifactId => typeof id === 'string' && artifactIds.has(id))
          : [],
        ...(note ? { note } : {}),
      };
    }
  }

  const shareRecord = asRecord(record.share);
  const shareBuildId = typeof shareRecord?.buildId === 'string' && buildIds.has(shareRecord.buildId) ? shareRecord.buildId : null;
  const shareBuildStepIds = new Set(builds.find((b) => b.id === shareBuildId)?.steps.map((s) => s.id) ?? []);
  const share: ShareSelection = {
    interestIds: interestsFrom(shareRecord?.interestIds),
    buildId: shareBuildId,
    stepIds: shareBuildId && Array.isArray(shareRecord?.stepIds)
      ? shareRecord.stepIds.filter((id): id is StepId => typeof id === 'string' && shareBuildStepIds.has(id))
      : [],
    artifactIds: Array.isArray(shareRecord?.artifactIds)
      ? shareRecord.artifactIds.filter((id): id is ArtifactId => typeof id === 'string' && artifactIds.has(id))
      : [],
  };

  return {
    version: 1,
    interests: interestsFrom(record.interests),
    builds,
    activeBuildId: typeof record.activeBuildId === 'string' && buildIds.has(record.activeBuildId) ? record.activeBuildId : null,
    artifacts,
    progress,
    share,
  };
}
