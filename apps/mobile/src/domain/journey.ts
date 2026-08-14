import {
  explorationLabels,
  getPostQuestRecommendation,
  interestLabels,
  pullLabels,
  skillLabels,
  timeLabels,
  type AvailableTime,
  type ExplorationId,
  type InterestId,
  type JourneyProfile,
  type PostQuestRecommendation,
  type QuestOutcome,
  type QuestPull,
  type SkillId,
} from './recommendations';
import { getPathExperience, isPlayablePathId, type PlayablePathId } from './path-experiences';
import type { GuideDecision, UserGuide } from './guides';

export type EvidenceKind = 'note' | 'link';
export type QuestStatus = 'not-started' | 'active' | 'completed' | 'stopped';

export type QuestArtifact = {
  id: string;
  kind: 'image' | 'video' | 'file';
  mimeType: string | null;
  name: string;
  size: number | null;
  uri: string;
  createdAt: string;
};

export type QuestDraft = {
  status: QuestStatus;
  outcome: QuestOutcome | null;
  evidenceKind: EvidenceKind;
  evidence: string;
  artifact: QuestArtifact | null;
  reflection: string;
  difficulty: number | null;
  enjoyment: number | null;
  pulledIn: QuestPull | null;
  resolvedAt: string | null;
};

export type JourneyState = {
  version: 3;
  profile: JourneyProfile;
  selectedPathId: PlayablePathId | null;
  pathStartedAt: string | null;
  quest: QuestDraft;
  branchRecommendation: PostQuestRecommendation | null;
  unlockedNodeIds: string[];
  guideDecisions: Record<string, GuideDecision>;
  activeGuideId: string | null;
  userGuides: UserGuide[];
};

export const defaultJourneyState: JourneyState = {
  version: 3,
  profile: {
    completed: false,
    interests: [],
    skills: ['starting-fresh'],
    availableTime: '2-hours',
    explorations: ['find-a-spark'],
  },
  selectedPathId: null,
  pathStartedAt: null,
  quest: {
    status: 'not-started',
    outcome: null,
    evidenceKind: 'note',
    evidence: '',
    artifact: null,
    reflection: '',
    difficulty: null,
    enjoyment: null,
    pulledIn: null,
    resolvedAt: null,
  },
  branchRecommendation: null,
  unlockedNodeIds: [],
  guideDecisions: {},
  activeGuideId: null,
  userGuides: [],
};

function freshDefault(): JourneyState {
  return {
    ...defaultJourneyState,
    profile: { ...defaultJourneyState.profile, interests: [...defaultJourneyState.profile.interests], skills: [...defaultJourneyState.profile.skills], explorations: [...defaultJourneyState.profile.explorations] },
    quest: { ...defaultJourneyState.quest },
    unlockedNodeIds: [],
    guideDecisions: {},
    activeGuideId: null,
    userGuides: [],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function parseStored(value: unknown) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function hasOwn<T extends string>(record: Record<T, unknown>, value: unknown): value is T {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(record, value);
}

function enumArray<T extends string>(value: unknown, record: Record<T, unknown>, fallback: T[]) {
  if (!Array.isArray(value)) return [...fallback];
  return Array.from(new Set(value.filter((candidate): candidate is T => hasOwn(record, candidate))));
}

function profileFrom(value: unknown): JourneyProfile {
  const record = asRecord(value);
  const fallback = defaultJourneyState.profile;
  return {
    completed: typeof record?.completed === 'boolean' ? record.completed : fallback.completed,
    interests: enumArray<InterestId>(record?.interests, interestLabels, fallback.interests),
    skills: enumArray<SkillId>(record?.skills, skillLabels, fallback.skills),
    availableTime: hasOwn<AvailableTime>(timeLabels, record?.availableTime) ? record.availableTime : fallback.availableTime,
    explorations: enumArray<ExplorationId>(record?.explorations, explorationLabels, fallback.explorations),
  };
}

function artifactFrom(value: unknown): QuestArtifact | null {
  const record = asRecord(value);
  if (!record
    || typeof record.id !== 'string'
    || (record.kind !== 'image' && record.kind !== 'video' && record.kind !== 'file')
    || typeof record.name !== 'string'
    || typeof record.createdAt !== 'string') return null;
  return {
    id: record.id.slice(0, 120),
    kind: record.kind,
    mimeType: typeof record.mimeType === 'string' ? record.mimeType.slice(0, 160) : null,
    name: record.name.trim().slice(0, 180) || 'Quest evidence',
    size: typeof record.size === 'number' && Number.isFinite(record.size) && record.size >= 0 ? record.size : null,
    uri: typeof record.uri === 'string' ? record.uri : '',
    createdAt: record.createdAt,
  };
}

function ratingFrom(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

function questFrom(value: unknown, version: 1 | 2 | 3): QuestDraft {
  const record = asRecord(value);
  const legacyCompleted = version === 1 && record?.status === 'completed';
  const status = record?.status === 'active' || record?.status === 'completed' || record?.status === 'stopped'
    ? record.status
    : 'not-started';
  const outcome = version === 1
    ? legacyCompleted ? 'completed' : null
    : record?.outcome === 'completed' || record?.outcome === 'stopped' ? record.outcome : null;
  return {
    ...defaultJourneyState.quest,
    status: version === 1 && status === 'stopped' ? 'not-started' : status,
    outcome,
    evidenceKind: record?.evidenceKind === 'link' ? 'link' : 'note',
    evidence: typeof record?.evidence === 'string' ? record.evidence : '',
    artifact: artifactFrom(record?.artifact),
    reflection: typeof record?.reflection === 'string' ? record.reflection : '',
    difficulty: ratingFrom(record?.difficulty),
    enjoyment: ratingFrom(record?.enjoyment),
    pulledIn: hasOwn<QuestPull>(pullLabels, record?.pulledIn) ? record.pulledIn : null,
    resolvedAt: version === 1
      ? typeof record?.completedAt === 'string' ? record.completedAt : null
      : typeof record?.resolvedAt === 'string' ? record.resolvedAt : null,
  };
}

function guideDecisionsFrom(value: unknown): Record<string, GuideDecision> {
  const record = asRecord(value);
  if (!record) return {};
  return Object.fromEntries(Object.entries(record).filter((entry): entry is [string, GuideDecision] => entry[1] === 'saved' || entry[1] === 'skipped'));
}

function userGuidesFrom(value: unknown): UserGuide[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    const record = asRecord(candidate);
    if (!record || typeof record.id !== 'string' || typeof record.title !== 'string' || typeof record.outcome !== 'string' || !Array.isArray(record.steps)) return [];
    const steps = record.steps.filter((step): step is string => typeof step === 'string').map((step) => step.trim()).filter(Boolean).slice(0, 6);
    if (!record.title.trim() || !record.outcome.trim() || steps.length < 2) return [];
    return [{
      id: record.id.slice(0, 100),
      title: record.title.trim().slice(0, 80),
      outcome: record.outcome.trim().slice(0, 180),
      steps,
      visibility: record.visibility === 'unlisted' ? 'unlisted' as const : 'private' as const,
      source: record.source === 'imported' ? 'imported' as const : 'created' as const,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date(0).toISOString(),
    }];
  });
}

export function migrateJourneyState(value: unknown): JourneyState {
  const record = asRecord(parseStored(value));
  if (!record || (record.version !== 1 && record.version !== 2 && record.version !== 3)) return freshDefault();
  const version = record.version;
  const profile = profileFrom(record.profile);
  const quest = questFrom(record.quest, version);
  const selectedPathId = isPlayablePathId(record.selectedPathId) ? record.selectedPathId : null;
  const branchRecommendation = quest.outcome && selectedPathId ? getPostQuestRecommendation(profile, quest, selectedPathId) : null;
  const storedUnlocks = Array.isArray(record.unlockedNodeIds) ? record.unlockedNodeIds.filter((id): id is string => typeof id === 'string') : [];
  return {
    version: 3,
    profile,
    selectedPathId,
    pathStartedAt: typeof record.pathStartedAt === 'string' ? record.pathStartedAt : null,
    quest,
    branchRecommendation,
    unlockedNodeIds: Array.from(new Set([
      ...storedUnlocks,
      ...(quest.outcome && selectedPathId ? [getPathExperience(selectedPathId).quest.nodeId] : []),
      ...(branchRecommendation?.unlockedNodeIds ?? []),
    ])),
    guideDecisions: guideDecisionsFrom(record.guideDecisions),
    activeGuideId: typeof record.activeGuideId === 'string' ? record.activeGuideId : null,
    userGuides: userGuidesFrom(record.userGuides),
  };
}

export function canResolveQuest(quest: QuestDraft) {
  return quest.status === 'active'
    && Boolean(quest.reflection.trim())
    && quest.difficulty !== null && quest.difficulty >= 1 && quest.difficulty <= 5
    && quest.enjoyment !== null && quest.enjoyment >= 1 && quest.enjoyment <= 5
    && quest.pulledIn !== null;
}

export function startPathInJourney(state: JourneyState, pathId: PlayablePathId = 'live-av', startedAt = new Date().toISOString()): JourneyState {
  const switchingPath = state.selectedPathId !== pathId;
  const resolved = state.quest.status === 'completed' || state.quest.status === 'stopped';
  const quest = switchingPath ? { ...defaultJourneyState.quest, status: 'active' as const } : { ...state.quest, status: resolved ? state.quest.status : 'active' as const };
  return {
    ...state,
    selectedPathId: pathId,
    pathStartedAt: switchingPath ? startedAt : state.pathStartedAt ?? startedAt,
    quest,
    branchRecommendation: switchingPath ? null : state.branchRecommendation,
    unlockedNodeIds: Array.from(new Set([...state.unlockedNodeIds, pathId, getPathExperience(pathId).quest.nodeId])),
  };
}

export function resolveJourneyQuest(state: JourneyState, outcome: QuestOutcome, resolvedAt = new Date().toISOString()): JourneyState | null {
  if (!canResolveQuest(state.quest) || !state.selectedPathId) return null;
  const resolvedQuest: QuestDraft = {
    ...state.quest,
    status: outcome,
    outcome,
    resolvedAt,
  };
  const branchRecommendation = getPostQuestRecommendation(state.profile, resolvedQuest, state.selectedPathId);
  if (!branchRecommendation) return null;
  return {
    ...state,
    quest: resolvedQuest,
    branchRecommendation,
    unlockedNodeIds: Array.from(new Set([
      ...state.unlockedNodeIds,
      getPathExperience(state.selectedPathId).quest.nodeId,
      ...branchRecommendation.unlockedNodeIds,
    ])),
  };
}
