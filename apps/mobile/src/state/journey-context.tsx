import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { JourneyRepository } from '@/data/journey-repository';
import { localJourneyRepository } from '@/data/local-journey-repository';
import {
  migrateJourneyState,
  resolveJourneyQuest,
  startPathInJourney,
  type JourneyState,
  type QuestDraft,
} from '@/domain/journey';
import type { GuideDecision, UserGuide } from '@/domain/guides';
import type { PlayablePathId } from '@/domain/path-experiences';
import { getPostQuestRecommendation, type JourneyProfile, type QuestOutcome } from '@/domain/recommendations';

export type {
  AvailableTime,
  ExplorationId,
  InterestId,
  JourneyProfile,
  QuestOutcome,
  QuestPull,
  SkillId,
} from '@/domain/recommendations';
export type { EvidenceKind, JourneyState, QuestArtifact, QuestDraft, QuestStatus } from '@/domain/journey';
export type { GuideDecision, UserGuide } from '@/domain/guides';
export type { PlayablePathId } from '@/domain/path-experiences';
export { defaultJourneyState } from '@/domain/journey';

type JourneyContextValue = {
  hydrated: boolean;
  persistenceError: string | null;
  state: JourneyState;
  completeOnboarding: (profile: Omit<JourneyProfile, 'completed'>) => void;
  startPath: (pathId: PlayablePathId) => void;
  updateQuest: (updates: Partial<Omit<QuestDraft, 'status' | 'outcome' | 'resolvedAt'>>) => void;
  resolveQuest: (outcome: QuestOutcome) => boolean;
  setGuideDecision: (guideId: string, decision: GuideDecision) => void;
  adoptGuide: (guideId: string) => void;
  addUserGuide: (guide: UserGuide) => void;
  setUserGuideVisibility: (guideId: string, visibility: UserGuide['visibility']) => void;
  flushJourney: () => Promise<void>;
  resetJourney: () => Promise<void>;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

function persistenceMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The journey could not be saved.';
}

export function JourneyProvider({
  children,
  repository = localJourneyRepository,
}: {
  children: ReactNode;
  repository?: JourneyRepository;
}) {
  const initialState = useMemo(() => migrateJourneyState(null), []);
  const [state, setState] = useState<JourneyState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const repositoryRef = useRef(repository);
  const stateRef = useRef(initialState);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const lastWriteError = useRef<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const enqueueSave = useCallback((nextState: JourneyState) => {
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => repositoryRef.current.save(nextState))
      .then(() => {
        lastWriteError.current = null;
        if (mounted.current) setPersistenceError(null);
      })
      .catch((error: unknown) => {
        const normalized = error instanceof Error ? error : new Error(persistenceMessage(error));
        lastWriteError.current = normalized;
        if (mounted.current) setPersistenceError(normalized.message);
      });
    return writeQueue.current;
  }, []);

  const commitState = useCallback((update: (current: JourneyState) => JourneyState) => {
    const current = stateRef.current;
    const next = update(current);
    if (next === current) return current;
    stateRef.current = next;
    setState(next);
    void enqueueSave(next);
    return next;
  }, [enqueueSave]);

  useEffect(() => {
    let active = true;
    repositoryRef.current.load()
      .then((loaded) => {
        if (!active) return;
        stateRef.current = loaded;
        setState(loaded);
        setPersistenceError(null);
        setHydrated(true);
        void enqueueSave(loaded);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPersistenceError(persistenceMessage(error));
        setHydrated(true);
      });
    return () => { active = false; };
  }, [enqueueSave]);

  const completeOnboarding = useCallback((profile: Omit<JourneyProfile, 'completed'>) => {
    commitState((current) => {
      const completedProfile = { ...profile, completed: true };
      const branchRecommendation = current.quest.outcome && current.selectedPathId
        ? getPostQuestRecommendation(completedProfile, current.quest, current.selectedPathId)
        : null;
      return {
        ...current,
        profile: completedProfile,
        branchRecommendation,
        unlockedNodeIds: Array.from(new Set([
          ...current.unlockedNodeIds,
          ...(branchRecommendation?.unlockedNodeIds ?? []),
        ])),
      };
    });
  }, [commitState]);

  const startPath = useCallback((pathId: PlayablePathId) => {
    commitState((current) => startPathInJourney(current, pathId));
  }, [commitState]);

  const updateQuest = useCallback((updates: Partial<Omit<QuestDraft, 'status' | 'outcome' | 'resolvedAt'>>) => {
    commitState((current) => {
      if (current.quest.status === 'completed' || current.quest.status === 'stopped') return current;
      return { ...current, quest: { ...current.quest, ...updates } };
    });
  }, [commitState]);

  const resolveQuest = useCallback((outcome: QuestOutcome) => {
    const resolved = resolveJourneyQuest(stateRef.current, outcome);
    if (!resolved) return false;
    commitState(() => resolved);
    return true;
  }, [commitState]);

  const setGuideDecision = useCallback((guideId: string, decision: GuideDecision) => {
    commitState((current) => ({ ...current, guideDecisions: { ...current.guideDecisions, [guideId]: decision } }));
  }, [commitState]);

  const adoptGuide = useCallback((guideId: string) => {
    commitState((current) => ({
      ...current,
      activeGuideId: guideId,
      guideDecisions: { ...current.guideDecisions, [guideId]: 'saved' },
    }));
  }, [commitState]);

  const addUserGuide = useCallback((guide: UserGuide) => {
    commitState((current) => ({
      ...current,
      userGuides: [guide, ...current.userGuides.filter((candidate) => candidate.id !== guide.id)],
    }));
  }, [commitState]);

  const setUserGuideVisibility = useCallback((guideId: string, visibility: UserGuide['visibility']) => {
    commitState((current) => ({
      ...current,
      userGuides: current.userGuides.map((guide) => guide.id === guideId ? { ...guide, visibility } : guide),
    }));
  }, [commitState]);

  const flushJourney = useCallback(async () => {
    await writeQueue.current;
    if (lastWriteError.current) await enqueueSave(stateRef.current);
    if (lastWriteError.current) throw lastWriteError.current;
  }, [enqueueSave]);

  const resetJourney = useCallback(async () => {
    await writeQueue.current;
    await repositoryRef.current.clear();
    const reset = migrateJourneyState(null);
    stateRef.current = reset;
    lastWriteError.current = null;
    setPersistenceError(null);
    setState(reset);
  }, []);

  const value = useMemo<JourneyContextValue>(() => ({
    hydrated,
    persistenceError,
    state,
    completeOnboarding,
    startPath,
    updateQuest,
    resolveQuest,
    setGuideDecision,
    adoptGuide,
    addUserGuide,
    setUserGuideVisibility,
    flushJourney,
    resetJourney,
  }), [addUserGuide, adoptGuide, completeOnboarding, flushJourney, hydrated, persistenceError, resetJourney, resolveQuest, setGuideDecision, setUserGuideVisibility, startPath, state, updateQuest]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) throw new Error('useJourney must be used inside JourneyProvider');
  return value;
}
