import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { localRoadmapRepository } from '@/data/local-roadmap-repository';
import type { RoadmapRepository } from '@/data/roadmap-repository';
import { roadmapCatalog } from '@/domain/roadmap/fixtures/catalog';
import type { ArtifactId, BuildId, GuideId, InterestId, NodeId, StepId } from '@/domain/roadmap/ids';
import {
  addArtifact as addArtifactOp,
  attachArtifact as attachArtifactOp,
  clearShare as clearShareOp,
  replaceStep as replaceStepOp,
  selectForShare as selectForShareOp,
  type OpIssue,
  type OpResult,
} from '@/domain/roadmap/ops';
import {
  defaultRoadmapState,
  migrateRoadmapState,
  type Artifact,
  type ArtifactKind,
  type ProgressState,
  type RoadmapState,
  type ShareSelection,
} from '@/domain/roadmap/state';
import { applyAdoptGuide, applySetInterests, applySetProgress, makeIdFactory } from './roadmap-actions';

export type RoadmapContextValue = {
  hydrated: boolean;
  persistenceError: string | null;
  lastIssues: OpIssue[];
  state: RoadmapState;
  catalog: typeof roadmapCatalog;
  setInterests: (interests: InterestId[]) => void;
  adoptGuide: (guideId: GuideId) => void;
  replaceStep: (buildId: BuildId, stepId: StepId, nodeId: NodeId) => void;
  setProgress: (stepId: StepId, state: ProgressState, note?: string) => void;
  addArtifact: (draft: { kind: ArtifactKind; title: string; value: string }) => ArtifactId;
  attachArtifact: (stepId: StepId, artifactId: ArtifactId) => void;
  selectForShare: (patch: Partial<ShareSelection>) => void;
  clearShare: () => void;
  flushRoadmap: () => Promise<void>;
  resetRoadmap: () => Promise<void>;
};

const RoadmapContext = createContext<RoadmapContextValue | null>(null);

function persistenceMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The journey could not be saved.';
}

const nextRoadmapId = makeIdFactory('r');
const nextArtifactId = makeIdFactory('a');

export function RoadmapProvider({
  children,
  repository = localRoadmapRepository,
}: {
  children: ReactNode;
  repository?: RoadmapRepository;
}) {
  const [state, setState] = useState<RoadmapState>(defaultRoadmapState);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [lastIssues, setLastIssues] = useState<OpIssue[]>([]);
  const repositoryRef = useRef(repository);
  const stateRef = useRef(defaultRoadmapState);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const lastWriteError = useRef<Error | null>(null);
  const mounted = useRef(true);
  /** Set the moment an op lands, so a slow load cannot revert real work. */
  const touched = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const enqueueSave = useCallback((nextState: RoadmapState) => {
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

  /** Applies a pure op: issues are surfaced, and a failed op leaves state untouched. */
  const runOp = useCallback((op: (current: RoadmapState) => OpResult) => {
    const current = stateRef.current;
    const { state: next, issues } = op(current);
    setLastIssues(issues);
    if (next === current) return;
    touched.current = true;
    stateRef.current = next;
    setState(next);
    void enqueueSave(next);
  }, [enqueueSave]);

  useEffect(() => {
    let active = true;
    repositoryRef.current.load()
      .then((loaded) => {
        if (!active) return;
        // If the person already acted while storage was still resolving, their
        // work wins: overwriting it here would revert an adoption and then
        // persist the reverted state.
        if (!touched.current) {
          stateRef.current = loaded;
          setState(loaded);
        }
        setPersistenceError(null);
        setHydrated(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPersistenceError(persistenceMessage(error));
        setHydrated(true);
      });
    return () => { active = false; };
  }, []);

  const setInterests = useCallback((interests: InterestId[]) => {
    runOp((current) => applySetInterests(current, interests));
  }, [runOp]);

  const adoptGuide = useCallback((guideId: GuideId) => {
    runOp((current) => applyAdoptGuide(roadmapCatalog, current, guideId, nextRoadmapId, new Date().toISOString()));
  }, [runOp]);

  const replaceStep = useCallback((buildId: BuildId, stepId: StepId, nodeId: NodeId) => {
    runOp((current) => replaceStepOp(roadmapCatalog, current, buildId, stepId, nodeId));
  }, [runOp]);

  const setProgress = useCallback((stepId: StepId, progress: ProgressState, note?: string) => {
    runOp((current) => applySetProgress(current, stepId, progress, new Date().toISOString(), note));
  }, [runOp]);

  const addArtifact = useCallback((draft: { kind: ArtifactKind; title: string; value: string }) => {
    const artifact: Artifact = { id: nextArtifactId(), createdAt: new Date().toISOString(), ...draft };
    runOp((current) => addArtifactOp(current, artifact));
    return artifact.id;
  }, [runOp]);

  const attachArtifact = useCallback((stepId: StepId, artifactId: ArtifactId) => {
    runOp((current) => attachArtifactOp(current, stepId, artifactId));
  }, [runOp]);

  const selectForShare = useCallback((patch: Partial<ShareSelection>) => {
    runOp((current) => selectForShareOp(current, patch));
  }, [runOp]);

  const clearShare = useCallback(() => {
    runOp((current) => clearShareOp(current));
  }, [runOp]);

  const flushRoadmap = useCallback(async () => {
    await writeQueue.current;
    if (lastWriteError.current) await enqueueSave(stateRef.current);
    if (lastWriteError.current) throw lastWriteError.current;
  }, [enqueueSave]);

  const resetRoadmap = useCallback(async () => {
    await writeQueue.current;
    await repositoryRef.current.clear();
    const reset = migrateRoadmapState(null);
    stateRef.current = reset;
    lastWriteError.current = null;
    setPersistenceError(null);
    setLastIssues([]);
    setState(reset);
  }, []);

  const value = useMemo<RoadmapContextValue>(() => ({
    hydrated,
    persistenceError,
    lastIssues,
    state,
    catalog: roadmapCatalog,
    setInterests,
    adoptGuide,
    replaceStep,
    setProgress,
    addArtifact,
    attachArtifact,
    selectForShare,
    clearShare,
    flushRoadmap,
    resetRoadmap,
  }), [addArtifact, adoptGuide, attachArtifact, clearShare, flushRoadmap, hydrated, lastIssues, persistenceError, replaceStep, resetRoadmap, selectForShare, setInterests, setProgress, state]);

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
}

export function useRoadmap() {
  const value = useContext(RoadmapContext);
  if (!value) throw new Error('useRoadmap must be used inside RoadmapProvider');
  return value;
}
