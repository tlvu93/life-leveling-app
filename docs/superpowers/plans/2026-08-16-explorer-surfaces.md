# Explorer Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (inline execution — the screens share one context and one route group). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Explorer golden journey — storage wiring plus six screens over the existing tested selectors — with the roadmap prototype as the app's home.

**Architecture:** A `RoadmapRepository` + `RoadmapProvider` mirroring the Alpha's proven repository/write-queue pattern; six thin screens that each call one pure selector; shared presentational pieces in `components/roadmap/`. Roadmap screens use their own `RoadmapScaffold`/`RoadmapNav` so the Alpha's `ScreenScaffold`/`BottomNav` and its e2e assertions stay untouched.

**Tech Stack:** Expo Router, React Native, TypeScript (strict), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-16-explorer-surfaces-design.md`

All commands run from the repo root. Test: `npm --prefix life-leveling-app/apps/mobile test -- <path>`. Commit after every task.

---

### Task 1: Roadmap repository

**Files:**
- Create: `apps/mobile/src/data/roadmap-repository.ts`
- Create: `apps/mobile/src/data/local-roadmap-repository.ts`
- Test: `apps/mobile/src/data/roadmap-repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { defaultRoadmapState, ROADMAP_STORAGE_KEY, type RoadmapState } from '../domain/roadmap/state';
import { InMemoryRoadmapRepository, KeyValueRoadmapRepository, type RoadmapKeyValueStorage } from './roadmap-repository';

function fakeStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const storage: RoadmapKeyValueStorage = {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => { store.set(key, value); },
    multiRemove: async (keys) => { for (const key of keys) store.delete(key); },
  };
  return { storage, store };
}

const withInterests: RoadmapState = { ...defaultRoadmapState, interests: ['music', 'technology'] };

describe('KeyValueRoadmapRepository', () => {
  it('returns the default state when nothing is stored', async () => {
    const { storage } = fakeStorage();
    expect(await new KeyValueRoadmapRepository(storage).load()).toEqual(defaultRoadmapState);
  });
  it('round trips a saved state', async () => {
    const { storage } = fakeStorage();
    const repository = new KeyValueRoadmapRepository(storage);
    await repository.save(withInterests);
    expect(await repository.load()).toEqual(withInterests);
  });
  it('falls back to the default when the payload is corrupt', async () => {
    const { storage } = fakeStorage({ [ROADMAP_STORAGE_KEY]: 'not json {' });
    expect(await new KeyValueRoadmapRepository(storage).load()).toEqual(defaultRoadmapState);
  });
  it('clear removes the key', async () => {
    const { storage, store } = fakeStorage();
    const repository = new KeyValueRoadmapRepository(storage);
    await repository.save(withInterests);
    await repository.clear();
    expect(store.has(ROADMAP_STORAGE_KEY)).toBe(false);
    expect(await repository.load()).toEqual(defaultRoadmapState);
  });
});

describe('InMemoryRoadmapRepository', () => {
  it('starts empty, stores a clone, and clears', async () => {
    const repository = new InMemoryRoadmapRepository();
    expect(await repository.load()).toEqual(defaultRoadmapState);
    await repository.save(withInterests);
    const loaded = await repository.load();
    expect(loaded).toEqual(withInterests);
    expect(loaded).not.toBe(withInterests);
    await repository.clear();
    expect(await repository.load()).toEqual(defaultRoadmapState);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/data/roadmap-repository.test.ts`
Expected: FAIL — module `./roadmap-repository` not found.

- [ ] **Step 3: Write `roadmap-repository.ts`**

```ts
import { defaultRoadmapState, migrateRoadmapState, ROADMAP_STORAGE_KEY, type RoadmapState } from '../domain/roadmap/state';

export { ROADMAP_STORAGE_KEY };

export type RoadmapRepository = {
  load: () => Promise<RoadmapState>;
  save: (state: RoadmapState) => Promise<void>;
  clear: () => Promise<void>;
};

export type RoadmapKeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
};

function cloneState(value: unknown) {
  return migrateRoadmapState(JSON.stringify(value));
}

export class KeyValueRoadmapRepository implements RoadmapRepository {
  constructor(private readonly storage: RoadmapKeyValueStorage) {}

  async load() {
    return migrateRoadmapState(await this.storage.getItem(ROADMAP_STORAGE_KEY));
  }

  async save(state: RoadmapState) {
    await this.storage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(state));
  }

  async clear() {
    await this.storage.multiRemove([ROADMAP_STORAGE_KEY]);
  }
}

export class InMemoryRoadmapRepository implements RoadmapRepository {
  private stored: RoadmapState | null;

  constructor(initialState: unknown = null) {
    this.stored = initialState === null ? null : cloneState(initialState);
  }

  async load() {
    return this.stored ? cloneState(this.stored) : cloneState(defaultRoadmapState);
  }

  async save(state: RoadmapState) {
    this.stored = cloneState(state);
  }

  async clear() {
    this.stored = null;
  }
}
```

- [ ] **Step 4: Write `local-roadmap-repository.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { KeyValueRoadmapRepository } from './roadmap-repository';

export const localRoadmapRepository = new KeyValueRoadmapRepository(AsyncStorage);
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/data/roadmap-repository.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/data
git -C life-leveling-app commit -m "feat(roadmap): persistence repository for RoadmapState"
```

---

### Task 2: Roadmap context provider

**Files:**
- Create: `apps/mobile/src/state/roadmap-actions.ts`
- Create: `apps/mobile/src/state/roadmap-context.tsx`
- Test: `apps/mobile/src/state/roadmap-actions.test.ts`

**Testing note:** this repo has no component-rendering test setup — `JourneyProvider` has no unit test either, and `@testing-library/react-native` is not a dependency. Rather than add a renderer, the provider's only non-trivial logic is extracted into a pure `roadmap-actions.ts` and unit-tested there; the React glue is covered by the golden-journey e2e in Task 10.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '@/domain/roadmap/fixtures/catalog';
import { defaultRoadmapState } from '@/domain/roadmap/state';
import { applyAdoptGuide, applySetInterests, applySetProgress, makeIdFactory } from './roadmap-actions';

const ids = () => makeIdFactory('t');

describe('makeIdFactory', () => {
  it('produces unique prefixed ids', () => {
    const next = ids();
    const produced = [next(), next(), next()];
    expect(new Set(produced).size).toBe(3);
    expect(produced.every((id) => id.startsWith('t-'))).toBe(true);
  });
});

describe('applySetInterests', () => {
  it('replaces the interest list and reports no issues', () => {
    const { state, issues } = applySetInterests(defaultRoadmapState, ['music', 'technology']);
    expect(state.interests).toEqual(['music', 'technology']);
    expect(issues).toEqual([]);
  });
});

describe('applyAdoptGuide', () => {
  it('adopts a real guide', () => {
    const { state, issues } = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', ids(), 't0');
    expect(issues).toEqual([]);
    expect(state.builds).toHaveLength(1);
    expect(state.activeBuildId).toBe(state.builds[0].id);
  });
  it('reports a missing guide without changing state', () => {
    const { state, issues } = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'ghost', ids(), 't0');
    expect(state).toBe(defaultRoadmapState);
    expect(issues.map((i) => i.code)).toEqual(['missing-guide']);
  });
});

describe('applySetProgress', () => {
  it('preserves already attached evidence when the state changes', () => {
    const adopted = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', ids(), 't0').state;
    const stepId = adopted.builds[0].steps[0].id;
    const seeded = {
      ...adopted,
      artifacts: [{ id: 'a1', kind: 'note' as const, title: 'n', value: 'v', createdAt: 't' }],
      progress: { [stepId]: { state: 'tried' as const, updatedAt: 't1', artifactIds: ['a1'] } },
    };
    const { state } = applySetProgress(seeded, stepId, 'practicing', 't2');
    expect(state.progress[stepId]).toEqual({ state: 'practicing', updatedAt: 't2', artifactIds: ['a1'] });
  });
  it('attaches an optional note', () => {
    const adopted = applyAdoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', ids(), 't0').state;
    const stepId = adopted.builds[0].steps[0].id;
    const { state } = applySetProgress(adopted, stepId, 'tried', 't2', 'went ok');
    expect(state.progress[stepId].note).toBe('went ok');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/state/roadmap-actions.test.ts`
Expected: FAIL — module `./roadmap-actions` not found.

- [ ] **Step 3: Write `roadmap-actions.ts`**

```ts
import type { RoadmapCatalog } from '@/domain/roadmap/catalog';
import type { GuideId, InterestId, StepId } from '@/domain/roadmap/ids';
import { adoptGuide, setProgress, type OpResult } from '@/domain/roadmap/ops';
import type { ProgressState, RoadmapState } from '@/domain/roadmap/state';

/** Ids and timestamps live here so the domain layer stays pure. */
export function makeIdFactory(prefix: string): () => string {
  let counter = 0;
  const stamp = Date.now().toString(36);
  return () => {
    counter += 1;
    return `${prefix}-${stamp}-${counter.toString(36)}`;
  };
}

export function applySetInterests(state: RoadmapState, interests: InterestId[]): OpResult {
  return { state: { ...state, interests }, issues: [] };
}

export function applyAdoptGuide(
  catalog: RoadmapCatalog, state: RoadmapState, guideId: GuideId, ids: () => string, now: string,
): OpResult {
  return adoptGuide(catalog, state, guideId, ids, now);
}

/** Changing a progress state never drops evidence the person already attached. */
export function applySetProgress(
  state: RoadmapState, stepId: StepId, progress: ProgressState, now: string, note?: string,
): OpResult {
  return setProgress(state, stepId, {
    state: progress,
    updatedAt: now,
    artifactIds: state.progress[stepId]?.artifactIds ?? [],
    ...(note ? { note } : {}),
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/state/roadmap-actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `roadmap-context.tsx`**

```tsx
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
import { applyAdoptGuide, applySetInterests, applySetProgress, makeIdFactory } from './roadmap-actions';
import {
  defaultRoadmapState,
  migrateRoadmapState,
  type Artifact,
  type ArtifactKind,
  type ProgressState,
  type RoadmapState,
  type ShareSelection,
} from '@/domain/roadmap/state';

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
    stateRef.current = next;
    setState(next);
    void enqueueSave(next);
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/state/roadmap-context.test.tsx`
Expected: PASS.

- [ ] **Step 5: Mount the provider**

In `apps/mobile/src/app/_layout.tsx`, import `RoadmapProvider` from `@/state/roadmap-context` and wrap it directly inside `JourneyProvider`:

```tsx
          <JourneyProvider>
            <RoadmapProvider>
              <RootNavigation />
            </RoadmapProvider>
          </JourneyProvider>
```

- [ ] **Step 6: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/state apps/mobile/src/app/_layout.tsx
git -C life-leveling-app commit -m "feat(roadmap): roadmap state provider wired to persistence"
```

---

### Task 3: Move the Atlas to /atlas

**Files:**
- Create: `apps/mobile/src/app/atlas.tsx`
- Modify: `apps/mobile/src/app/index.tsx`
- Modify: `apps/mobile/src/components/BottomNav.tsx:11`
- Modify: `apps/mobile/e2e/atlas.spec.ts` (3 call sites)
- Modify: `apps/mobile/e2e/atlas-visual.spec.ts:15`

- [ ] **Step 1: Create the Atlas route**

`apps/mobile/src/app/atlas.tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import AtlasScreen from '@/screens/AtlasScreen';

export default function AtlasRoute() {
  return <ClientOnly><AtlasScreen /></ClientOnly>;
}
```

- [ ] **Step 2: Point the home route at a placeholder**

Replace the contents of `apps/mobile/src/app/index.tsx` (Task 5 swaps the placeholder for the real screen):

```tsx
import { Text, View } from 'react-native';

export default function HomeRoute() {
  return <View><Text>Discover</Text></View>;
}
```

- [ ] **Step 3: Repoint the Alpha nav's Atlas item**

In `apps/mobile/src/components/BottomNav.tsx`, change the first item's href:

```ts
  { label: 'Atlas', href: '/atlas', icon: Orbit },
```

- [ ] **Step 4: Repoint the e2e specs**

In `apps/mobile/e2e/atlas.spec.ts`, change the three `goto('/')` calls (lines 49, 103, 190) to `goto('/atlas')`. Preserve any query strings already present on those calls.

In `apps/mobile/e2e/atlas-visual.spec.ts:15`, change:

```ts
  await page.goto(`/atlas?showcase=1&static=1&theme=${theme}`, { waitUntil: 'domcontentloaded' });
```

Do NOT re-record the visual baselines: the screen is unchanged, only its URL.

- [ ] **Step 5: Verify the Atlas still renders at its new URL**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.
Run: `npx playwright test --config life-leveling-app/apps/mobile/playwright.config.ts` from `life-leveling-app/apps/mobile` (i.e. `cd` there and run `npx playwright test`).
Expected: all specs pass, including the three visual baselines within their 2% threshold. If a visual spec fails, STOP: the screen was not supposed to change.

- [ ] **Step 6: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/app apps/mobile/src/components/BottomNav.tsx apps/mobile/e2e
git -C life-leveling-app commit -m "refactor(app): move the Living Universe to /atlas so the roadmap owns the entry"
```

---

### Task 4: Shared roadmap presentation pieces

**Files:**
- Create: `apps/mobile/src/components/roadmap/RoadmapScaffold.tsx`
- Create: `apps/mobile/src/components/roadmap/pieces.tsx`
- Create: `apps/mobile/src/lib/framing-flags.ts`
- Test: `apps/mobile/src/lib/framing-flags.test.ts`

- [ ] **Step 1: Write the failing framing-flag test**

```ts
import { describe, expect, it } from 'vitest';
import { framingFlagsFrom, progressLabel } from './framing-flags';

describe('framingFlagsFrom', () => {
  it('defaults to count framing with no marker', () => {
    expect(framingFlagsFrom({})).toEqual({ framing: 'count', marker: false });
  });
  it('reads the moderator overrides', () => {
    expect(framingFlagsFrom({ framing: 'percent' })).toEqual({ framing: 'percent', marker: false });
    expect(framingFlagsFrom({ marker: '1' })).toEqual({ framing: 'count', marker: true });
  });
  it('ignores unknown framing values', () => {
    expect(framingFlagsFrom({ framing: 'nonsense' }).framing).toBe('count');
  });
});

describe('progressLabel', () => {
  it('counts by default, never implying a deficit', () => {
    expect(progressLabel({ framing: 'count', marker: false }, 3, 17)).toBe('3 things you have practised apply here');
    expect(progressLabel({ framing: 'count', marker: false }, 1, 17)).toBe('1 thing you have practised apply here');
    expect(progressLabel({ framing: 'count', marker: false }, 0, 17)).toBe('Nothing here yet — that is a starting point, not a gap');
  });
  it('switches to the percentage variant under test', () => {
    expect(progressLabel({ framing: 'percent', marker: false }, 3, 12)).toBe('25% explored');
    expect(progressLabel({ framing: 'percent', marker: false }, 0, 0)).toBe('0% explored');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/lib/framing-flags.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `framing-flags.ts`**

```ts
/**
 * Progress framing is an open assumption (decisions A-008/A-009), not a settled
 * rule: the build ships count framing and no marker, and a moderator can switch
 * mid-session to gather evidence.
 */
export type ProgressFraming = 'count' | 'percent';
export type FramingFlags = { framing: ProgressFraming; marker: boolean };

export function framingFlagsFrom(params: Record<string, string | string[] | undefined>): FramingFlags {
  const raw = params.framing;
  const framing = (Array.isArray(raw) ? raw[0] : raw) === 'percent' ? 'percent' : 'count';
  const markerRaw = params.marker;
  const marker = (Array.isArray(markerRaw) ? markerRaw[0] : markerRaw) === '1';
  return { framing, marker };
}

export function progressLabel(flags: FramingFlags, applyCount: number, totalNodes: number): string {
  if (flags.framing === 'percent') {
    const percent = totalNodes === 0 ? 0 : Math.round((applyCount / totalNodes) * 100);
    return `${percent}% explored`;
  }
  if (applyCount === 0) return 'Nothing here yet — that is a starting point, not a gap';
  return `${applyCount} thing${applyCount === 1 ? '' : 's'} you have practised apply here`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/lib/framing-flags.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `RoadmapScaffold.tsx`**

Its own scaffold and nav, so the Alpha's `ScreenScaffold`/`BottomNav` and their e2e assertions stay untouched.

```tsx
import { Compass, Orbit, Route as RouteIcon } from 'lucide-react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLifeTheme } from '@/state/theme-context';
import { useRoadmap } from '@/state/roadmap-context';

const items: { label: string; href: Href; icon: typeof Compass }[] = [
  { label: 'Discover', href: '/', icon: Compass },
  { label: 'Journey', href: '/journey', icon: RouteIcon },
  { label: 'Universe', href: '/atlas', icon: Orbit },
];

export function RoadmapScaffold({ children, title }: { children: ReactNode; title: string }) {
  const { theme } = useLifeTheme();
  const { persistenceError } = useRoadmap();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View testID="roadmap-screen" style={[styles.root, { backgroundColor: theme.surfaceStrong }]}>
      <View style={[styles.header, { borderBottomColor: theme.borderSoft, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      </View>
      {persistenceError && (
        <View testID="persistence-error" style={[styles.banner, { backgroundColor: `${theme.amber}22`, borderColor: theme.amber }]}>
          <Text style={{ color: theme.ink }}>{persistenceError}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      <View testID="roadmap-nav" style={[styles.nav, { backgroundColor: theme.nav, borderTopColor: theme.borderSoft, paddingBottom: insets.bottom }]}>
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(String(href));
          return (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(href)}
              style={styles.navItem}>
              <Icon color={active ? theme.accent : theme.navInk} size={22} />
              <Text style={[styles.navLabel, { color: active ? theme.accent : theme.navInk }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  banner: { marginHorizontal: 18, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 18, paddingBottom: 120, gap: 14 },
  nav: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6 },
  navLabel: { fontSize: 11, fontWeight: '700' },
});
```

- [ ] **Step 6: Write `pieces.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RouteRole } from '@/domain/roadmap/catalog';
import { progressStates, type ProgressState } from '@/domain/roadmap/state';
import { useLifeTheme } from '@/state/theme-context';

const roleLabels: Record<RouteRole, string> = {
  required: 'Required',
  recommended: 'Recommended',
  'optional-depth': 'Optional depth',
  alternative: 'Alternative',
  checkpoint: 'Checkpoint',
};

export const progressLabels: Record<ProgressState, string> = {
  interested: 'Interested',
  tried: 'Tried',
  practicing: 'Practising',
  demonstrated: 'Demonstrated',
  paused: 'Paused',
  skipped: 'Skipped',
  'not-for-me': 'Not for me',
};

export function RoleChip({ role }: { role: RouteRole }) {
  const { theme } = useLifeTheme();
  return (
    <View style={[styles.chip, { borderColor: theme.borderSoft }]}>
      <Text style={[styles.chipText, { color: theme.inkSecondary }]}>{roleLabels[role]}</Text>
    </View>
  );
}

export function Card({ children, onPress, testID }: { children: React.ReactNode; onPress?: () => void; testID?: string }) {
  const { theme } = useLifeTheme();
  const style = [styles.card, { borderColor: theme.borderSoft, backgroundColor: theme.surfaceMuted }];
  if (!onPress) return <View testID={testID} style={style}>{children}</View>;
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useLifeTheme();
  return <Text style={[styles.sectionTitle, { color: theme.ink }]}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  const { theme } = useLifeTheme();
  return <Text style={[styles.body, { color: theme.inkSecondary }]}>{children}</Text>;
}

export function ProgressStatePicker({ value, onChange }: { value: ProgressState | null; onChange: (next: ProgressState) => void }) {
  const { theme } = useLifeTheme();
  return (
    <View style={styles.picker}>
      {progressStates.map((candidate) => {
        const active = candidate === value;
        return (
          <Pressable
            key={candidate}
            testID={`progress-${candidate}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(candidate)}
            style={[styles.chip, { borderColor: active ? theme.accent : theme.borderSoft, backgroundColor: active ? `${theme.accent}18` : 'transparent' }]}>
            <Text style={[styles.chipText, { color: active ? theme.accent : theme.inkSecondary }]}>{progressLabels[candidate]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NotFound({ what }: { what: string }) {
  const { theme } = useLifeTheme();
  return <Text testID="not-found" style={[styles.body, { color: theme.ink }]}>{`We could not find that ${what}.`}</Text>;
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  pressed: { opacity: 0.75 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  body: { fontSize: 14, lineHeight: 20 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
```

- [ ] **Step 7: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/components/roadmap apps/mobile/src/lib/framing-flags.ts apps/mobile/src/lib/framing-flags.test.ts
git -C life-leveling-app commit -m "feat(roadmap): scaffold, shared pieces, and moderator framing flags"
```

---

### Task 5: Discover screen (the new home)

**Files:**
- Create: `apps/mobile/src/screens/roadmap/RoadmapDiscoverScreen.tsx`
- Modify: `apps/mobile/src/app/index.tsx`

- [ ] **Step 1: Write the screen**

```tsx
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { discoverView } from '@/domain/roadmap/selectors/discover';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function RoadmapDiscoverScreen() {
  const { theme } = useLifeTheme();
  const { hydrated, state, catalog, setInterests } = useRoadmap();
  const router = useRouter();

  if (!hydrated) return <View style={styles.loading}><ActivityIndicator color={theme.accent} /></View>;

  const vm = discoverView(catalog, state);
  const toggle = (id: (typeof vm.interests)[number]['id']) => {
    setInterests(state.interests.includes(id) ? state.interests.filter((x) => x !== id) : [...state.interests, id]);
  };

  return (
    <RoadmapScaffold title="Discover">
      <Body>Pick what you are drawn to. Nothing here is a commitment, and undiscovered territory is not a gap.</Body>
      <View style={styles.interests}>
        {vm.interests.map((interest) => (
          <Pressable
            key={interest.id}
            testID={`interest-${interest.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected: interest.selected }}
            onPress={() => toggle(interest.id)}
            style={[styles.chip, { borderColor: interest.selected ? theme.accent : theme.borderSoft, backgroundColor: interest.selected ? `${theme.accent}18` : 'transparent' }]}>
            <Text style={[styles.chipText, { color: interest.selected ? theme.accent : theme.inkSecondary }]}>{interest.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Paths</SectionTitle>
      {vm.paths.map((path) => (
        <Card key={path.id} testID={`path-${path.id}`} onPress={() => router.push(`/paths/${path.id}`)}>
          <View style={styles.pathHead}>
            <Text style={[styles.pathTitle, { color: theme.ink }]}>{path.title}</Text>
            {path.status === 'stub' && (
              <Text testID={`stub-${path.id}`} style={[styles.stub, { color: theme.inkSecondary, borderColor: theme.borderSoft }]}>OUTLINE ONLY</Text>
            )}
          </View>
          <Body>{path.whatItIs}</Body>
          {path.matchedInterests.length > 0 && (
            <Text style={[styles.match, { color: theme.accent }]}>
              {`Matches ${path.matchedInterests.join(' + ')}`}
            </Text>
          )}
        </Card>
      ))}

      <Pressable accessibilityRole="link" onPress={() => router.push('/discover')} style={styles.legacy}>
        <Text style={[styles.legacyText, { color: theme.inkSecondary }]}>Open the earlier prototype</Text>
      </Pressable>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '700' },
  pathHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pathTitle: { fontSize: 17, fontWeight: '700' },
  stub: { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  match: { fontSize: 12, fontWeight: '700' },
  legacy: { marginTop: 20, alignItems: 'center' },
  legacyText: { fontSize: 12, textDecorationLine: 'underline' },
});
```

- [ ] **Step 2: Point the home route at it**

`apps/mobile/src/app/index.tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import RoadmapDiscoverScreen from '@/screens/roadmap/RoadmapDiscoverScreen';

export default function HomeRoute() {
  return <ClientOnly><RoadmapDiscoverScreen /></ClientOnly>;
}
```

- [ ] **Step 3: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/screens/roadmap apps/mobile/src/app/index.tsx
git -C life-leveling-app commit -m "feat(roadmap): discover screen as the app entry"
```

---

### Task 6: Path overview screen

**Files:**
- Create: `apps/mobile/src/screens/roadmap/PathOverviewScreen.tsx`
- Create: `apps/mobile/src/app/paths/[pathId].tsx`

- [ ] **Step 1: Write the screen**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { pathOverviewView } from '@/domain/roadmap/selectors/path-overview';
import { pathTransferView } from '@/domain/roadmap/selectors/path-transfer';
import { framingFlagsFrom, progressLabel } from '@/lib/framing-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function PathOverviewScreen() {
  const params = useLocalSearchParams<{ pathId?: string; framing?: string; marker?: string }>();
  const pathId = params.pathId ?? '';
  const { theme } = useLifeTheme();
  const { state, catalog, adoptGuide } = useRoadmap();
  const router = useRouter();

  const vm = pathOverviewView(catalog, pathId);
  if (!vm) return <RoadmapScaffold title="Path"><NotFound what="Path" /></RoadmapScaffold>;

  const transfer = pathTransferView(catalog, state, pathId);
  const flags = framingFlagsFrom(params);
  const comparable = vm.guides.length >= 2;

  return (
    <RoadmapScaffold title={vm.title}>
      {transfer && (
        <Text testID="transfer-line" style={[styles.transfer, { color: theme.accent }]}>
          {progressLabel(flags, transfer.applyCount, transfer.totalNodes)}
        </Text>
      )}

      <Body>{vm.overview.whatItIs}</Body>

      <SectionTitle>Where it happens</SectionTitle>
      {vm.overview.settings.map((line) => <Body key={line}>{`• ${line}`}</Body>)}

      <SectionTitle>Variants</SectionTitle>
      {vm.overview.variants.map((line) => <Body key={line}>{`• ${line}`}</Body>)}

      <SectionTitle>Realities</SectionTitle>
      {vm.overview.realities.map((line) => <Body key={line}>{`• ${line}`}</Body>)}

      <SectionTitle>Common ground, and what is contested</SectionTitle>
      <Body>{vm.overview.foundations}</Body>

      <SectionTitle>Guides through this Path</SectionTitle>
      {comparable && (
        <Card testID="compare-guides" onPress={() => router.push(`/compare?a=${vm.guides[0].id}&b=${vm.guides[1].id}`)}>
          <Text style={[styles.action, { color: theme.accent }]}>Compare these two routes</Text>
          <Body>They disagree in ways worth seeing before you pick one.</Body>
        </Card>
      )}
      {vm.guides.map((guide) => (
        <Card key={guide.id} testID={`guide-${guide.id}`}>
          <View style={styles.guideHead}>
            <Text style={[styles.guideTitle, { color: theme.ink }]}>{guide.title}</Text>
            {guide.id === catalog.paths.find((p) => p.id === pathId)?.featuredGuideId && (
              <Text testID={`featured-${guide.id}`} style={[styles.featured, { color: theme.accent, borderColor: theme.accent }]}>FEATURED</Text>
            )}
          </View>
          <Body>{`For: ${guide.audience}`}</Body>
          <Body>{`Outcome: ${guide.outcome}`}</Body>
          <Text
            testID={`adopt-${guide.id}`}
            accessibilityRole="button"
            onPress={() => { adoptGuide(guide.id); router.push('/journey'); }}
            style={[styles.action, { color: theme.accent }]}>
            Make this my Journey
          </Text>
        </Card>
      ))}

      {vm.neighbors.length > 0 && <SectionTitle>Nearby Paths</SectionTitle>}
      {vm.neighbors.map((neighbor) => (
        <Card key={neighbor.id} testID={`neighbor-${neighbor.id}`} onPress={() => router.push(`/paths/${neighbor.id}`)}>
          <Text style={[styles.guideTitle, { color: theme.ink }]}>{neighbor.title}</Text>
          {neighbor.via === 'bridge' && neighbor.bridgeNote && (
            <Text testID={`bridge-${neighbor.id}`} style={[styles.bridge, { color: theme.accent }]}>{neighbor.bridgeNote}</Text>
          )}
          <Body>{neighbor.whatItIs}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  transfer: { fontSize: 14, fontWeight: '700' },
  guideHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  guideTitle: { fontSize: 16, fontWeight: '700' },
  featured: { fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  bridge: { fontSize: 13, fontStyle: 'italic' },
  action: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
```

- [ ] **Step 2: Create the route**

`apps/mobile/src/app/paths/[pathId].tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import PathOverviewScreen from '@/screens/roadmap/PathOverviewScreen';

export default function PathOverviewRoute() {
  return <ClientOnly><PathOverviewScreen /></ClientOnly>;
}
```

- [ ] **Step 3: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/screens/roadmap apps/mobile/src/app/paths
git -C life-leveling-app commit -m "feat(roadmap): path overview with bridges and transfer line"
```

---

### Task 7: Guide comparison screen

**Files:**
- Create: `apps/mobile/src/screens/roadmap/GuideComparisonScreen.tsx`
- Create: `apps/mobile/src/app/compare.tsx`

- [ ] **Step 1: Write the screen**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { compareGuides, type ComparisonSide } from '@/domain/roadmap/selectors/guide-comparison';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

const roleWords: Record<string, string> = {
  required: 'Required',
  recommended: 'Recommended',
  'optional-depth': 'Optional depth',
  alternative: 'Alternative',
  checkpoint: 'Checkpoint',
};

function sideText(side: ComparisonSide) {
  if (side.kind === 'placed') return roleWords[side.role] ?? side.role;
  if (side.kind === 'excluded') return 'Left out on purpose';
  return 'Not on this route';
}

export default function GuideComparisonScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const { theme } = useLifeTheme();
  const { catalog, adoptGuide } = useRoadmap();
  const router = useRouter();

  const vm = compareGuides(catalog, params.a ?? '', params.b ?? '');
  if (!vm) return <RoadmapScaffold title="Compare"><NotFound what="pair of Guides" /></RoadmapScaffold>;

  return (
    <RoadmapScaffold title="Compare routes">
      <View style={styles.heads}>
        {[vm.a, vm.b].map((guide) => (
          <Card key={guide.id} testID={`compare-head-${guide.id}`}>
            <Text style={[styles.title, { color: theme.ink }]}>{guide.title}</Text>
            <Body>{`For: ${guide.persona.audience}`}</Body>
            <Body>{`Outcome: ${guide.persona.outcome}`}</Body>
            <Text
              testID={`adopt-${guide.id}`}
              accessibilityRole="button"
              onPress={() => { adoptGuide(guide.id); router.push('/journey'); }}
              style={[styles.action, { color: theme.accent }]}>
              Make this my Journey
            </Text>
          </Card>
        ))}
      </View>

      <SectionTitle>What actually differs</SectionTitle>
      {vm.materialDifferences.map((difference) => (
        <Text key={difference} testID="material-difference" style={[styles.difference, { color: theme.ink }]}>{`• ${difference}`}</Text>
      ))}

      {vm.stanceDisagreements.length > 0 && <SectionTitle>Where the authors disagree</SectionTitle>}
      {vm.stanceDisagreements.map((disagreement) => (
        <Card key={disagreement.nodeId} testID={`disagreement-${disagreement.nodeId}`}>
          <Text style={[styles.title, { color: theme.ink }]}>{disagreement.nodeTitle}</Text>
          <Body>{`${catalog.guides.find((g) => g.id === disagreement.placedIn)?.title ?? disagreement.placedIn} keeps it (${roleWords[disagreement.role] ?? disagreement.role}).`}</Body>
          <Body>{`${catalog.guides.find((g) => g.id === disagreement.excludedIn)?.title ?? disagreement.excludedIn} leaves it out: “${disagreement.reason}”`}</Body>
        </Card>
      ))}

      <SectionTitle>Every concept, side by side</SectionTitle>
      {vm.rows.map((row) => (
        <View key={row.nodeId} testID={`row-${row.nodeId}`} style={[styles.row, { borderColor: theme.borderSoft }]}>
          <Text style={[styles.rowTitle, { color: theme.ink }]}>{row.nodeTitle}</Text>
          <View style={styles.rowSides}>
            <Text style={[styles.rowSide, { color: theme.inkSecondary }]}>{sideText(row.a)}</Text>
            <Text style={[styles.rowSide, { color: theme.inkSecondary }]}>{sideText(row.b)}</Text>
          </View>
        </View>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  heads: { gap: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  action: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  difference: { fontSize: 14, lineHeight: 20 },
  row: { borderBottomWidth: 1, paddingVertical: 8, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSides: { flexDirection: 'row', gap: 12 },
  rowSide: { flex: 1, fontSize: 13 },
});
```

- [ ] **Step 2: Create the route**

`apps/mobile/src/app/compare.tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import GuideComparisonScreen from '@/screens/roadmap/GuideComparisonScreen';

export default function CompareRoute() {
  return <ClientOnly><GuideComparisonScreen /></ClientOnly>;
}
```

- [ ] **Step 3: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/screens/roadmap apps/mobile/src/app/compare.tsx
git -C life-leveling-app commit -m "feat(roadmap): guide comparison exposing route and stance differences"
```

---

### Task 8: Journey and Step detail screens

**Files:**
- Create: `apps/mobile/src/screens/roadmap/JourneyScreen.tsx`
- Create: `apps/mobile/src/screens/roadmap/StepDetailScreen.tsx`
- Create: `apps/mobile/src/app/journey/index.tsx`
- Create: `apps/mobile/src/app/journey/step/[stepId].tsx`

- [ ] **Step 1: Write `JourneyScreen.tsx`**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, RoleChip, SectionTitle, progressLabels } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { buildView } from '@/domain/roadmap/selectors/build';
import { pathTransferView } from '@/domain/roadmap/selectors/path-transfer';
import { framingFlagsFrom, progressLabel } from '@/lib/framing-flags';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function JourneyScreen() {
  const params = useLocalSearchParams<{ framing?: string; marker?: string }>();
  const { theme } = useLifeTheme();
  const { state, catalog } = useRoadmap();
  const router = useRouter();

  const activeId = state.activeBuildId ?? state.builds[0]?.id ?? null;
  const vm = activeId ? buildView(catalog, state, activeId) : null;

  if (!vm) {
    return (
      <RoadmapScaffold title="Your Journey">
        <Body>You have not adopted a route yet. Open a Path and choose a Guide that fits you.</Body>
        <Card testID="journey-empty-cta" onPress={() => router.push('/')}>
          <Text style={[styles.action, { color: theme.accent }]}>Find a Path</Text>
        </Card>
      </RoadmapScaffold>
    );
  }

  const pathId = state.builds.find((b) => b.id === activeId)?.pathId ?? '';
  const transfer = pathTransferView(catalog, state, pathId);
  const flags = framingFlagsFrom(params);

  return (
    <RoadmapScaffold title={vm.title}>
      {vm.provenance && <Text testID="provenance" style={[styles.provenance, { color: theme.inkSecondary }]}>{vm.provenance}</Text>}
      {flags.marker && <Text testID="identity-marker" style={[styles.marker, { color: theme.accent }]}>Explorer 04</Text>}
      {transfer && (
        <Text testID="transfer-line" style={[styles.transfer, { color: theme.accent }]}>
          {progressLabel(flags, transfer.applyCount, transfer.totalNodes)}
        </Text>
      )}

      <SectionTitle>Your route</SectionTitle>
      {vm.steps.map((step) => (
        <Card key={step.stepId} testID={`step-${step.stepId}`} onPress={() => router.push(`/journey/step/${step.stepId}`)}>
          <View style={styles.stepHead}>
            <Text style={[styles.stepTitle, { color: theme.ink }]}>{step.nodeTitle}</Text>
            <RoleChip role={step.role} />
            {step.progressState && (
              <Text testID={`state-${step.stepId}`} style={[styles.state, { color: theme.accent }]}>{progressLabels[step.progressState]}</Text>
            )}
          </View>
          {step.originBadge && <Text testID={`origin-${step.stepId}`} style={[styles.origin, { color: theme.inkSecondary }]}>{step.originBadge}</Text>}
          {step.note.length > 0 && <Body>{step.note}</Body>}
        </Card>
      ))}

      <Card testID="open-share" onPress={() => router.push('/share')}>
        <Text style={[styles.action, { color: theme.accent }]}>Share part of this</Text>
        <Body>Nothing is shared until you choose it.</Body>
      </Card>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  provenance: { fontSize: 13 },
  marker: { fontSize: 13, fontWeight: '700' },
  transfer: { fontSize: 14, fontWeight: '700' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  state: { fontSize: 12, fontWeight: '700' },
  origin: { fontSize: 12, fontStyle: 'italic' },
  action: { fontSize: 14, fontWeight: '700' },
});
```

- [ ] **Step 2: Write `StepDetailScreen.tsx`**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, NotFound, ProgressStatePicker, RoleChip, SectionTitle } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { stepDetailView } from '@/domain/roadmap/selectors/step-detail';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function StepDetailScreen() {
  const params = useLocalSearchParams<{ stepId?: string }>();
  const stepId = params.stepId ?? '';
  const { theme } = useLifeTheme();
  const { state, catalog, setProgress, replaceStep } = useRoadmap();
  const router = useRouter();
  const [showAlternatives, setShowAlternatives] = useState(false);

  const buildId = state.builds.find((b) => b.steps.some((s) => s.id === stepId))?.id ?? '';
  const vm = buildId ? stepDetailView(catalog, state, buildId, stepId) : null;
  if (!vm) return <RoadmapScaffold title="Step"><NotFound what="Step" /></RoadmapScaffold>;

  const build = state.builds.find((b) => b.id === buildId);
  const path = catalog.paths.find((p) => p.id === build?.pathId);
  const alternatives = (path?.nodeIds ?? [])
    .filter((id) => id !== vm.stepId && !build?.steps.some((s) => s.nodeId === id))
    .map((id) => catalog.nodes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  return (
    <RoadmapScaffold title={vm.nodeTitle}>
      <View style={styles.head}>
        <RoleChip role={vm.role} />
        <Text style={[styles.type, { color: theme.inkSecondary }]}>{vm.nodeType}</Text>
      </View>
      <Body>{vm.nodeDescription}</Body>
      {vm.note.length > 0 && (
        <Card testID="author-note"><Body>{`The author's note: ${vm.note}`}</Body></Card>
      )}

      {vm.quest && (
        <Card testID="quest">
          <SectionTitle>Something you could try</SectionTitle>
          <Body>{vm.quest.prompt}</Body>
        </Card>
      )}

      <SectionTitle>Where are you with this?</SectionTitle>
      <ProgressStatePicker value={vm.progress?.state ?? null} onChange={(next) => setProgress(stepId, next)} />

      <SectionTitle>Change this Step</SectionTitle>
      <Pressable testID="show-alternatives" accessibilityRole="button" onPress={() => setShowAlternatives((open) => !open)}>
        <Text style={[styles.action, { color: theme.accent }]}>{showAlternatives ? 'Never mind' : 'Swap this for something else'}</Text>
      </Pressable>
      {showAlternatives && alternatives.map((node) => (
        <Card
          key={node.id}
          testID={`swap-${node.id}`}
          onPress={() => { replaceStep(buildId, stepId, node.id); router.replace('/journey'); }}>
          <Text style={[styles.swapTitle, { color: theme.ink }]}>{node.title}</Text>
          <Body>{node.description}</Body>
        </Card>
      ))}
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  type: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  action: { fontSize: 14, fontWeight: '700' },
  swapTitle: { fontSize: 15, fontWeight: '700' },
});
```

- [ ] **Step 3: Create both routes**

`apps/mobile/src/app/journey/index.tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import JourneyScreen from '@/screens/roadmap/JourneyScreen';

export default function JourneyRoute() {
  return <ClientOnly><JourneyScreen /></ClientOnly>;
}
```

`apps/mobile/src/app/journey/step/[stepId].tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import StepDetailScreen from '@/screens/roadmap/StepDetailScreen';

export default function StepDetailRoute() {
  return <ClientOnly><StepDetailScreen /></ClientOnly>;
}
```

- [ ] **Step 4: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/screens/roadmap apps/mobile/src/app/journey
git -C life-leveling-app commit -m "feat(roadmap): journey and step detail with progress and remixing"
```

---

### Task 9: Share preview screen

**Files:**
- Create: `apps/mobile/src/screens/roadmap/SharePreviewScreen.tsx`
- Create: `apps/mobile/src/app/share.tsx`

- [ ] **Step 1: Write the screen**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, SectionTitle, progressLabels } from '@/components/roadmap/pieces';
import { RoadmapScaffold } from '@/components/roadmap/RoadmapScaffold';
import { buildView } from '@/domain/roadmap/selectors/build';
import { shareAudit, sharePreviewView } from '@/domain/roadmap/selectors/share-preview';
import { useRoadmap } from '@/state/roadmap-context';
import { useLifeTheme } from '@/state/theme-context';

export default function SharePreviewScreen() {
  const { theme } = useLifeTheme();
  const { state, catalog, selectForShare, clearShare } = useRoadmap();

  const activeId = state.activeBuildId ?? state.builds[0]?.id ?? null;
  const journey = activeId ? buildView(catalog, state, activeId) : null;
  const preview = sharePreviewView(catalog, state);
  const audit = shareAudit(state);
  const selected = new Set(state.share.stepIds);

  const toggleStep = (stepId: string) => {
    if (!activeId) return;
    const next = selected.has(stepId) ? state.share.stepIds.filter((id) => id !== stepId) : [...state.share.stepIds, stepId];
    selectForShare({ buildId: activeId, stepIds: next });
  };

  return (
    <RoadmapScaffold title="Share preview">
      <Body>This page starts empty. Only what you tick below appears on it.</Body>

      <SectionTitle>Choose what to show</SectionTitle>
      {state.interests.map((interest) => {
        const on = state.share.interestIds.includes(interest);
        return (
          <Pressable
            key={interest}
            testID={`pick-interest-${interest}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => selectForShare({
              interestIds: on ? state.share.interestIds.filter((id) => id !== interest) : [...state.share.interestIds, interest],
            })}>
            <Text style={[styles.pick, { color: on ? theme.accent : theme.inkSecondary }]}>{`${on ? '☑' : '☐'} ${interest}`}</Text>
          </Pressable>
        );
      })}
      {journey?.steps.map((step) => {
        const on = selected.has(step.stepId);
        return (
          <Pressable
            key={step.stepId}
            testID={`pick-step-${step.stepId}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => toggleStep(step.stepId)}>
            <Text style={[styles.pick, { color: on ? theme.accent : theme.inkSecondary }]}>{`${on ? '☑' : '☐'} ${step.nodeTitle}`}</Text>
          </Pressable>
        );
      })}
      <Pressable testID="clear-share" accessibilityRole="button" onPress={clearShare}>
        <Text style={[styles.pick, { color: theme.inkSecondary }]}>Clear everything</Text>
      </Pressable>

      <SectionTitle>What people would see</SectionTitle>
      <Card testID="share-output">
        {preview.interests.length === 0 && preview.steps.length === 0 && preview.artifacts.length === 0 && !preview.build ? (
          <Body testID="share-empty">Nothing yet — this page is empty.</Body>
        ) : (
          <View style={styles.output}>
            {preview.build && <Text testID="shared-build" style={[styles.outputTitle, { color: theme.ink }]}>{preview.build.title}</Text>}
            {preview.interests.map((interest) => (
              <Text key={interest.id} testID={`shared-interest-${interest.id}`} style={{ color: theme.inkSecondary }}>{interest.label}</Text>
            ))}
            {preview.steps.map((step) => (
              <Text key={step.nodeTitle} testID="shared-step" style={{ color: theme.inkSecondary }}>
                {`${step.nodeTitle}${step.progressState ? ` — ${progressLabels[step.progressState]}` : ''}`}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <SectionTitle>What stays private</SectionTitle>
      <Body testID="share-audit">
        {`${audit.privateSteps} Steps, ${audit.privateArtifacts} pieces of evidence, and ${audit.privateInterests} interests are not on that page.`}
      </Body>
    </RoadmapScaffold>
  );
}

const styles = StyleSheet.create({
  pick: { fontSize: 14, paddingVertical: 4 },
  output: { gap: 4 },
  outputTitle: { fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Create the route**

`apps/mobile/src/app/share.tsx`:

```tsx
import { ClientOnly } from '@/components/ClientOnly';
import SharePreviewScreen from '@/screens/roadmap/SharePreviewScreen';

export default function ShareRoute() {
  return <ClientOnly><SharePreviewScreen /></ClientOnly>;
}
```

- [ ] **Step 3: Typecheck and commit**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.

```bash
git -C life-leveling-app add apps/mobile/src/screens/roadmap apps/mobile/src/app/share.tsx
git -C life-leveling-app commit -m "feat(roadmap): selective share preview with a privacy audit"
```

---

### Task 10: Golden-journey e2e and full verification

**Files:**
- Create: `apps/mobile/e2e/roadmap.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { expect, test } from '@playwright/test';

test.describe('Explorer golden journey', () => {
  test('interests to a shared page, without ever showing a score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('roadmap-screen')).toBeVisible();

    // 1. Interests
    await page.getByTestId('interest-music').click();
    await page.getByTestId('interest-technology').click();

    // 2. DJ/VJ is discoverable, and stubs are visibly thin
    await expect(page.getByTestId('path-djvj')).toBeVisible();
    await expect(page.getByTestId('stub-bouldering')).toBeVisible();
    await page.getByTestId('path-djvj').click();

    // 3. Compare the two Guides
    await expect(page.getByTestId('featured-guide-club-first')).toBeVisible();
    await page.getByTestId('compare-guides').click();
    await expect(page.getByTestId('material-difference').first()).toBeVisible();
    expect(await page.getByTestId('material-difference').count()).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId('disagreement-music-theory-fundamentals')).toBeVisible();

    // 4. Adopt the club-first route
    await page.getByTestId('adopt-guide-club-first').click();
    await expect(page.getByTestId('provenance')).toContainText('Club-first');

    // 5. Remix: swap the gear-access Step for something else
    const gearStep = page.locator('[data-testid^="step-"]').filter({ hasText: 'Gear Access' }).first();
    await gearStep.click();
    await page.getByTestId('show-alternatives').click();
    await page.locator('[data-testid^="swap-"]').first().click();
    await expect(page.locator('[data-testid^="origin-"]').first()).toContainText('Replaced:');

    // 6. Record honest progress
    await page.locator('[data-testid^="step-"]').first().click();
    await page.getByTestId('progress-practicing').click();
    await page.goBack();
    await expect(page.locator('[data-testid^="state-"]').first()).toContainText('Practising');

    // 7. Share preview starts empty, then shows only what was picked
    await page.getByTestId('open-share').click();
    await expect(page.getByTestId('share-empty')).toBeVisible();
    await page.getByTestId('pick-interest-music').click();
    await expect(page.getByTestId('shared-interest-music')).toBeVisible();
    await expect(page.getByTestId('shared-interest-technology')).toHaveCount(0);
    await expect(page.getByTestId('share-audit')).toBeVisible();

    // The guardrail that stayed committed: no life-completion score anywhere.
    await expect(page.getByText(/life level|overall completion/i)).toHaveCount(0);
  });

  test('the percentage framing variant is available to moderators', async ({ page }) => {
    await page.goto('/paths/djvj?framing=percent', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('transfer-line')).toContainText('% explored');
  });
});
```

- [ ] **Step 2: Run the spec**

From `life-leveling-app/apps/mobile`: `npx playwright test e2e/roadmap.spec.ts`
Expected: PASS. If a selector misses because a `testID` did not reach the DOM, fix the screen's `testID`, not the assertion. If step 5's "Gear Access" filter finds nothing, check the club-first fixture's step order rather than loosening the test.

- [ ] **Step 3: Full verification**

Run: `npm --prefix life-leveling-app/apps/mobile test` → all suites pass.
Run: `npm --prefix life-leveling-app/apps/mobile run typecheck` → exit 0.
Run: `npm --prefix life-leveling-app/apps/mobile run lint` → exit 0.
From `life-leveling-app/apps/mobile`: `npx playwright test` → all specs pass, including the three unchanged Atlas visual baselines.

- [ ] **Step 4: Update the spec status**

In `docs/superpowers/specs/2026-08-16-explorer-surfaces-design.md`, set the status line to `- **Status:** Implemented 2026-08-16`.

- [ ] **Step 5: Commit**

```bash
git -C life-leveling-app add apps/mobile/e2e docs/superpowers/specs/2026-08-16-explorer-surfaces-design.md
git -C life-leveling-app commit -m "test(roadmap): golden-journey e2e for the explorer surfaces"
```

---

## Self-review checklist (run after writing, before executing)

1. **Spec coverage:** repository (1), provider (2), entry replacement + Atlas move (3), scaffold/pieces/framing flags (4), Discover (5), Path overview (6), Guide comparison (7), Journey + Step detail (8), Share preview (9), e2e + verification (10). Spec's out-of-scope items (Guide builder, Universe canvas, Alpha migration) are absent, as intended.
2. **Placeholders:** none — every step carries complete code or an exact edit.
3. **Type consistency:** `RoadmapContextValue` action names match every call site; `progressLabels` is defined once in `pieces.tsx` and imported by Journey and Share; `framingFlagsFrom`/`progressLabel` signatures match their three call sites; selector names match the domain layer exactly (`discoverView`, `pathOverviewView`, `compareGuides`, `buildView`, `stepDetailView`, `sharePreviewView`, `shareAudit`, `pathTransferView`); `makeIdFactory`/`applySetInterests`/`applyAdoptGuide`/`applySetProgress` are defined in `roadmap-actions.ts` and consumed by the provider.
4. **Dependency check done before writing:** `@testing-library/react-native` is NOT installed and `JourneyProvider` has no component test either, so Task 2 tests pure extracted actions instead of rendering — no new dependency, and the provider's wiring is proven by the Task 10 e2e.
5. **Fixed during review:** the Journey screen originally located its Path by matching `pathTitle`, which is fragile; it now reads `pathId` straight off the active Journey.
