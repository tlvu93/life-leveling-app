import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  defaultJourneyState,
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

export const JOURNEY_STORAGE_KEY = 'life-leveling.alpha-1.journey.v2';
export const LEGACY_JOURNEY_STORAGE_KEY = 'life-leveling.alpha-1.journey.v1';

type JourneyContextValue = {
  hydrated: boolean;
  state: JourneyState;
  completeOnboarding: (profile: Omit<JourneyProfile, 'completed'>) => void;
  startPath: (pathId: PlayablePathId) => void;
  updateQuest: (updates: Partial<Omit<QuestDraft, 'status' | 'outcome' | 'resolvedAt'>>) => void;
  resolveQuest: (outcome: QuestOutcome) => boolean;
  setGuideDecision: (guideId: string, decision: GuideDecision) => void;
  adoptGuide: (guideId: string) => void;
  addUserGuide: (guide: UserGuide) => void;
  setUserGuideVisibility: (guideId: string, visibility: UserGuide['visibility']) => void;
  resetJourney: () => Promise<void>;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(defaultJourneyState);
  const [hydrated, setHydrated] = useState(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(JOURNEY_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_JOURNEY_STORAGE_KEY),
    ])
      .then(([current, legacy]) => {
        if (active && (current || legacy)) setState(migrateJourneyState(current ?? legacy));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const serialized = JSON.stringify(state);
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(JOURNEY_STORAGE_KEY, serialized));
  }, [hydrated, state]);

  const completeOnboarding = useCallback((profile: Omit<JourneyProfile, 'completed'>) => {
    setState((current) => {
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
  }, []);

  const startPath = useCallback((pathId: PlayablePathId) => {
    setState((current) => startPathInJourney(current, pathId));
  }, []);

  const updateQuest = useCallback((updates: Partial<Omit<QuestDraft, 'status' | 'outcome' | 'resolvedAt'>>) => {
    setState((current) => {
      if (current.quest.status === 'completed' || current.quest.status === 'stopped') return current;
      return { ...current, quest: { ...current.quest, ...updates } };
    });
  }, []);

  const resolveQuest = useCallback((outcome: QuestOutcome) => {
    const resolved = resolveJourneyQuest(state, outcome);
    if (!resolved) return false;
    setState(resolved);
    return true;
  }, [state]);

  const setGuideDecision = useCallback((guideId: string, decision: GuideDecision) => {
    setState((current) => ({ ...current, guideDecisions: { ...current.guideDecisions, [guideId]: decision } }));
  }, []);

  const adoptGuide = useCallback((guideId: string) => {
    setState((current) => ({
      ...current,
      activeGuideId: guideId,
      guideDecisions: { ...current.guideDecisions, [guideId]: 'saved' },
    }));
  }, []);

  const addUserGuide = useCallback((guide: UserGuide) => {
    setState((current) => ({
      ...current,
      userGuides: [guide, ...current.userGuides.filter((candidate) => candidate.id !== guide.id)],
    }));
  }, []);

  const setUserGuideVisibility = useCallback((guideId: string, visibility: UserGuide['visibility']) => {
    setState((current) => ({
      ...current,
      userGuides: current.userGuides.map((guide) => guide.id === guideId ? { ...guide, visibility } : guide),
    }));
  }, []);

  const resetJourney = useCallback(async () => {
    await writeQueue.current.catch(() => undefined);
    await AsyncStorage.multiRemove([JOURNEY_STORAGE_KEY, LEGACY_JOURNEY_STORAGE_KEY]);
    setState(migrateJourneyState(null));
  }, []);

  const value = useMemo<JourneyContextValue>(() => ({
    hydrated,
    state,
    completeOnboarding,
    startPath,
    updateQuest,
    resolveQuest,
    setGuideDecision,
    adoptGuide,
    addUserGuide,
    setUserGuideVisibility,
    resetJourney,
  }), [addUserGuide, adoptGuide, completeOnboarding, hydrated, resetJourney, resolveQuest, setGuideDecision, setUserGuideVisibility, startPath, state, updateQuest]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) throw new Error('useJourney must be used inside JourneyProvider');
  return value;
}
