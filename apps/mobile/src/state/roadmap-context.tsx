import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { localRoadmapRepository } from '@/data/local-roadmap-repository';
import type { RoadmapRepository } from '@/data/roadmap-repository';
import { roadmapCatalog } from '@/domain/roadmap/fixtures/catalog';
import type { Guide, NodeType, RouteEdgeKind, RouteRole } from '@/domain/roadmap/catalog';
import type { ArtifactId, BuildId, GuideId, InterestId, NodeId, PathId, StepId } from '@/domain/roadmap/ids';
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
  type DraftVisibility,
  type ProgressState,
  type RoadmapState,
  type ShareSelection,
} from '@/domain/roadmap/state';
import { applyAdoptGuide, applySetInterests, applySetProgress, makeIdFactory } from './roadmap-actions';
import {
  addProvisionalNode as addProvisionalNodeOp,
  clearDraftStance as clearDraftStanceOp,
  connectDraftSteps as connectDraftStepsOp,
  createDraft as createDraftOp,
  deleteDraft as deleteDraftOp,
  placeDraftStep as placeDraftStepOp,
  removeDraftStep as removeDraftStepOp,
  setDraftStance as setDraftStanceOp,
  setDraftStepNote as setDraftStepNoteOp,
  setDraftStepRole as setDraftStepRoleOp,
  setDraftVisibility as setDraftVisibilityOp,
  updateDraftPersona as updateDraftPersonaOp,
} from './draft-actions';

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
  createDraft: (pathId: PathId, title: string) => GuideId;
  updateDraftPersona: (draftId: GuideId, persona: Partial<Guide['persona']> & { title?: string; rationale?: string }) => void;
  placeDraftStep: (draftId: GuideId, nodeId: NodeId) => void;
  setDraftStepRole: (draftId: GuideId, stepId: StepId, role: RouteRole) => void;
  setDraftStepNote: (draftId: GuideId, stepId: StepId, note: string) => void;
  removeDraftStep: (draftId: GuideId, stepId: StepId) => void;
  connectDraftSteps: (draftId: GuideId, from: StepId, to: StepId, kind: RouteEdgeKind) => void;
  setDraftStance: (draftId: GuideId, nodeId: NodeId, reason: string) => void;
  clearDraftStance: (draftId: GuideId, nodeId: NodeId) => void;
  /** Returns true when the proposal landed, so a form can survive a rejection. */
  addProvisionalNode: (draftId: GuideId, node: { title: string; description: string; type: NodeType; domainId: InterestId }) => boolean;
  setDraftVisibility: (draftId: GuideId, visibility: DraftVisibility) => void;
  deleteDraft: (draftId: GuideId) => void;
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

  /**
   * Applies a pure op: issues are surfaced, a failed op leaves state untouched,
   * and the issues are returned so a caller can keep a form open on rejection.
   */
  const runOp = useCallback((op: (current: RoadmapState) => OpResult): OpIssue[] => {
    const current = stateRef.current;
    const { state: next, issues } = op(current);
    setLastIssues(issues);
    if (next === current) return issues;
    touched.current = true;
    stateRef.current = next;
    setState(next);
    void enqueueSave(next);
    return issues;
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

  const now = () => new Date().toISOString();

  const createDraft = useCallback((pathId: PathId, title: string) => {
    const draftId = nextRoadmapId();
    runOp((current) => createDraftOp(current, pathId, title, () => draftId, now()));
    return draftId;
  }, [runOp]);

  const updateDraftPersona = useCallback((draftId: GuideId, persona: Partial<Guide['persona']> & { title?: string; rationale?: string }) => {
    runOp((current) => updateDraftPersonaOp(current, draftId, persona, now()));
  }, [runOp]);

  const placeDraftStep = useCallback((draftId: GuideId, nodeId: NodeId) => {
    runOp((current) => placeDraftStepOp(roadmapCatalog, current, draftId, nodeId, nextRoadmapId, now()));
  }, [runOp]);

  const setDraftStepRole = useCallback((draftId: GuideId, stepId: StepId, role: RouteRole) => {
    runOp((current) => setDraftStepRoleOp(roadmapCatalog, current, draftId, stepId, role, now()));
  }, [runOp]);

  const setDraftStepNote = useCallback((draftId: GuideId, stepId: StepId, note: string) => {
    runOp((current) => setDraftStepNoteOp(current, draftId, stepId, note, now()));
  }, [runOp]);

  const removeDraftStep = useCallback((draftId: GuideId, stepId: StepId) => {
    runOp((current) => removeDraftStepOp(current, draftId, stepId, now()));
  }, [runOp]);

  const connectDraftSteps = useCallback((draftId: GuideId, from: StepId, to: StepId, kind: RouteEdgeKind) => {
    runOp((current) => connectDraftStepsOp(roadmapCatalog, current, draftId, from, to, kind, now()));
  }, [runOp]);

  const setDraftStance = useCallback((draftId: GuideId, nodeId: NodeId, reason: string) => {
    runOp((current) => setDraftStanceOp(roadmapCatalog, current, draftId, nodeId, reason, now()));
  }, [runOp]);

  const clearDraftStance = useCallback((draftId: GuideId, nodeId: NodeId) => {
    runOp((current) => clearDraftStanceOp(roadmapCatalog, current, draftId, nodeId, now()));
  }, [runOp]);

  const addProvisionalNode = useCallback((draftId: GuideId, node: { title: string; description: string; type: NodeType; domainId: InterestId }) => {
    return runOp((current) => addProvisionalNodeOp(roadmapCatalog, current, draftId, node, nextRoadmapId, now())).length === 0;
  }, [runOp]);

  const setDraftVisibility = useCallback((draftId: GuideId, visibility: DraftVisibility) => {
    runOp((current) => setDraftVisibilityOp(current, draftId, visibility, now()));
  }, [runOp]);

  const deleteDraft = useCallback((draftId: GuideId) => {
    runOp((current) => deleteDraftOp(current, draftId));
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
    createDraft,
    updateDraftPersona,
    placeDraftStep,
    setDraftStepRole,
    setDraftStepNote,
    removeDraftStep,
    connectDraftSteps,
    setDraftStance,
    clearDraftStance,
    addProvisionalNode,
    setDraftVisibility,
    deleteDraft,
    flushRoadmap,
    resetRoadmap,
  }), [addArtifact, addProvisionalNode, adoptGuide, attachArtifact, clearDraftStance, clearShare, connectDraftSteps, createDraft, deleteDraft, flushRoadmap, hydrated, lastIssues, persistenceError, placeDraftStep, removeDraftStep, replaceStep, resetRoadmap, selectForShare, setDraftStance, setDraftStepNote, setDraftStepRole, setDraftVisibility, setInterests, setProgress, state, updateDraftPersona]);

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
}

export function useRoadmap() {
  const value = useContext(RoadmapContext);
  if (!value) throw new Error('useRoadmap must be used inside RoadmapProvider');
  return value;
}
