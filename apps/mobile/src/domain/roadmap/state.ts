import type { AtlasNode, Guide, GuideStep, NodeSize, NodeType, RouteEdge, RouteRole } from './catalog';
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

export type DraftVisibility = 'private' | 'unlisted';

/**
 * A Guide being authored. Provisional Nodes travel with the draft because they
 * are proposals: they are not in the shared catalog until review accepts them.
 */
export type GuideDraft = {
  guide: Guide;
  provisionalNodes: AtlasNode[];
  visibility: DraftVisibility;
  updatedAt: string;
};

export type RoadmapState = {
  version: 2;
  interests: InterestId[];
  builds: Build[];
  activeBuildId: BuildId | null;
  artifacts: Artifact[];
  progress: Record<StepId, ProgressEntry>;
  share: ShareSelection;
  drafts: GuideDraft[];
};

export const defaultRoadmapState: RoadmapState = {
  version: 2,
  interests: [],
  builds: [],
  activeBuildId: null,
  artifacts: [],
  progress: {},
  share: { interestIds: [], buildId: null, stepIds: [], artifactIds: [] },
  drafts: [],
};

function freshDefault(): RoadmapState {
  return {
    ...defaultRoadmapState,
    interests: [],
    builds: [],
    artifacts: [],
    progress: {},
    share: { interestIds: [], buildId: null, stepIds: [], artifactIds: [] },
    drafts: [],
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

const nodeTypes: readonly NodeType[] = ['foundation', 'skill', 'experience', 'project', 'milestone', 'resource'];
const nodeSizes: readonly NodeSize[] = ['major', 'standard', 'minor'];

function provisionalNodeFrom(value: unknown, scopeGuideId: string): AtlasNode | null {
  const record = asRecord(value);
  const id = str(record?.id, 120);
  const title = str(record?.title, 180)?.trim();
  const type = nodeTypes.find((t) => t === record?.type);
  const domainId = typeof record?.domainId === 'string' && Object.prototype.hasOwnProperty.call(interestLabels, record.domainId)
    ? (record.domainId as InterestId)
    : null;
  const clusterId = str(record?.clusterId, 120);
  if (!record || !id || !title || !type || !domainId || !clusterId) return null;
  const depth = record.depth === 0 || record.depth === 1 || record.depth === 2 || record.depth === 3 ? record.depth : 1;
  return {
    id,
    type,
    title,
    description: str(record.description, 2000) ?? '',
    domainId,
    clusterId,
    depth,
    size: nodeSizes.find((s) => s === record.size) ?? 'minor',
    provisional: { scopeGuideId },
  };
}

function guideFrom(value: unknown): Guide | null {
  const record = asRecord(value);
  const id = str(record?.id, 120);
  const pathId = str(record?.pathId, 120);
  const title = str(record?.title, 180);
  if (!record || !id || !pathId || title === null || !Array.isArray(record.steps)) return null;
  const steps = record.steps.map(stepFrom).filter((s): s is BuildStep => s !== null);
  if (steps.length !== record.steps.length) return null;
  const edges = edgesFrom(record.edges, new Set(steps.map((s) => s.id)));
  // A draft may legitimately be empty; only a genuinely broken route is dropped.
  if (steps.length > 0 && validateRoute(steps, edges).length > 0) return null;
  const persona = asRecord(record.persona);
  const stances = Array.isArray(record.stances)
    ? record.stances.flatMap((candidate) => {
      const stance = asRecord(candidate);
      const nodeId = str(stance?.nodeId, 120);
      const reason = str(stance?.reason, 1000);
      return nodeId && stance?.stance === 'excluded' && reason ? [{ nodeId, stance: 'excluded' as const, reason }] : [];
    })
    : [];
  return {
    id,
    version: typeof record.version === 'number' && Number.isFinite(record.version) ? record.version : 1,
    pathId,
    title,
    persona: {
      audience: str(persona?.audience, 1000) ?? '',
      startingPoint: str(persona?.startingPoint, 1000) ?? '',
      outcome: str(persona?.outcome, 1000) ?? '',
      assumptions: Array.isArray(persona?.assumptions)
        ? persona.assumptions.filter((a): a is string => typeof a === 'string').map((a) => a.slice(0, 500))
        : [],
    },
    steps: steps.map(({ origin: _origin, ...step }) => step),
    edges,
    stances,
    rationale: str(record.rationale, 4000) ?? '',
  };
}

function draftFrom(value: unknown): GuideDraft | null {
  const record = asRecord(value);
  const guide = guideFrom(record?.guide);
  if (!record || !guide) return null;
  const provisionalNodes = Array.isArray(record.provisionalNodes)
    ? record.provisionalNodes.map((n) => provisionalNodeFrom(n, guide.id)).filter((n): n is AtlasNode => n !== null)
    : [];
  return {
    guide,
    provisionalNodes,
    visibility: record.visibility === 'unlisted' ? 'unlisted' : 'private',
    updatedAt: str(record.updatedAt, 60) ?? '',
  };
}

export function migrateRoadmapState(value: unknown): RoadmapState {
  const record = asRecord(parseStored(value));
  if (!record || (record.version !== 1 && record.version !== 2)) return freshDefault();

  const interests = interestsFrom(record.interests);

  // Ids must be globally unique — every op and selector assumes it. Duplicate
  // build/artifact ids keep the first; a build whose step ids collide with an
  // earlier build's is dropped whole (this is the sanitizer for untrusted storage).
  const builds: Build[] = [];
  const buildIds = new Set<string>();
  const stepIds = new Set<string>();
  const candidates = Array.isArray(record.builds)
    ? record.builds.map(buildFrom).filter((b): b is Build => b !== null)
    : [];
  for (const build of candidates) {
    if (buildIds.has(build.id)) continue;
    if (build.steps.some((s) => stepIds.has(s.id))) continue;
    buildIds.add(build.id);
    for (const s of build.steps) stepIds.add(s.id);
    builds.push(build);
  }
  const artifacts: Artifact[] = [];
  const artifactIds = new Set<string>();
  const artifactCandidates = Array.isArray(record.artifacts)
    ? record.artifacts.map(artifactFrom).filter((a): a is Artifact => a !== null)
    : [];
  for (const artifact of artifactCandidates) {
    if (artifactIds.has(artifact.id)) continue;
    artifactIds.add(artifact.id);
    artifacts.push(artifact);
  }

  const progressEntries: [StepId, ProgressEntry][] = [];
  const progressRecord = asRecord(record.progress);
  if (progressRecord) {
    for (const [stepId, raw] of Object.entries(progressRecord)) {
      if (!stepIds.has(stepId)) continue;
      const entry = asRecord(raw);
      const state = progressStates.find((s) => s === entry?.state);
      const updatedAt = str(entry?.updatedAt, 60);
      if (!state || !updatedAt) continue;
      const note = str(entry?.note, 1000);
      progressEntries.push([stepId, {
        state,
        updatedAt,
        artifactIds: Array.isArray(entry?.artifactIds)
          ? entry.artifactIds.filter((id): id is ArtifactId => typeof id === 'string' && artifactIds.has(id))
          : [],
        ...(note ? { note } : {}),
      }]);
    }
  }
  // Object.fromEntries defines own data properties, so a stored key named
  // "__proto__" cannot poison the prototype the way plain assignment would.
  const progress: Record<StepId, ProgressEntry> = Object.fromEntries(progressEntries);

  const shareRecord = asRecord(record.share);
  const shareBuildId = typeof shareRecord?.buildId === 'string' && buildIds.has(shareRecord.buildId) ? shareRecord.buildId : null;
  const shareBuildStepIds = new Set(builds.find((b) => b.id === shareBuildId)?.steps.map((s) => s.id) ?? []);
  const share: ShareSelection = {
    // Shared interests must be a subset of the user's own interests — the
    // invariant selectForShare enforces and the share page depends on.
    interestIds: interestsFrom(shareRecord?.interestIds).filter((id) => interests.includes(id)),
    buildId: shareBuildId,
    stepIds: shareBuildId && Array.isArray(shareRecord?.stepIds)
      ? shareRecord.stepIds.filter((id): id is StepId => typeof id === 'string' && shareBuildStepIds.has(id))
      : [],
    artifactIds: Array.isArray(shareRecord?.artifactIds)
      ? shareRecord.artifactIds.filter((id): id is ArtifactId => typeof id === 'string' && artifactIds.has(id))
      : [],
  };

  const draftIds = new Set<string>();
  const drafts = Array.isArray(record.drafts)
    ? record.drafts.map(draftFrom).filter((d): d is GuideDraft => {
      if (!d || draftIds.has(d.guide.id)) return false;
      draftIds.add(d.guide.id);
      return true;
    })
    : [];

  return {
    version: 2,
    interests,
    builds,
    drafts,
    activeBuildId: typeof record.activeBuildId === 'string' && buildIds.has(record.activeBuildId) ? record.activeBuildId : null,
    artifacts,
    progress,
    share,
  };
}
