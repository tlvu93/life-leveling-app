# Roadmap Domain Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (inline execution chosen — tasks share one type system and the executor holds the approved spec context). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the versioned roadmap domain model (catalog, user state, ops, seven surface selectors) plus DJ/VJ and breadth-stub fixtures, per `docs/superpowers/specs/2026-08-16-roadmap-domain-model-design.md`.

**Architecture:** Two stores + pure selectors. Read-only `RoadmapCatalog` shipped as fixture modules; persisted `RoadmapState` v1 with defensive migration; full-graph routes (Steps as vertices, `next`/`alternative` edges) validated by a pure validator with deterministic linearization. All modules are platform-neutral TypeScript in `apps/mobile/src/domain/roadmap/` — no React/Expo imports; ids and timestamps always passed in.

**Tech Stack:** TypeScript (strict), Vitest (`npm --prefix apps/mobile test`), existing hand-rolled migration style from `src/domain/journey.ts` (no zod).

**Fixture content source:** `docs/product/research/dj-vj-route-research.md` — §1 Path overview prose, §2 node table + curricula notes, §3 Guide A, §4 Guide B, §5 disagreement, §6 related-Path stubs. Where a step below says "transcribe from report §N", copy/condense that section's actual text; never invent content.

All commands run from the repo root. Test command pattern: `npm --prefix apps/mobile test -- src/domain/roadmap/<file>.test.ts` (vitest). Commit after every task.

---

### Task 1: ids and catalog types

**Files:**
- Create: `apps/mobile/src/domain/roadmap/ids.ts`
- Create: `apps/mobile/src/domain/roadmap/catalog.ts`

- [ ] **Step 1: Write `ids.ts`**

```ts
export type NodeId = string;
export type PathId = string;
export type GuideId = string;
export type StepId = string;
export type BuildId = string;
export type ArtifactId = string;
export type QuestId = string;

export type InterestId = 'music' | 'technology' | 'movement' | 'language' | 'making' | 'design';

export const interestLabels: Record<InterestId, string> = {
  music: 'Music',
  technology: 'Technology',
  movement: 'Movement',
  language: 'Language',
  making: 'Making',
  design: 'Design',
};
```

- [ ] **Step 2: Write `catalog.ts`** (types exactly as in the spec)

```ts
import type { GuideId, InterestId, NodeId, PathId, QuestId, StepId } from './ids';

export type NodeType = 'foundation' | 'skill' | 'experience' | 'project' | 'milestone' | 'resource';

export type AtlasNode = {
  id: NodeId;
  type: NodeType;
  title: string;
  description: string;
  provisional?: { scopeGuideId: GuideId };
};

export type Path = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  interestIds: InterestId[];
  overview: {
    whatItIs: string;
    settings: string[];
    variants: string[];
    realities: string[];
    foundations: string;
  };
  nodeIds: NodeId[];
  neighborPathIds: PathId[];
};

export type RouteRole = 'required' | 'recommended' | 'optional-depth' | 'alternative' | 'checkpoint';

export type Quest = { id: QuestId; prompt: string; kind: 'observe' | 'try' | 'make' | 'meet' };

export type GuideStep = {
  id: StepId;
  nodeId: NodeId;
  role: RouteRole;
  note: string;
  quest?: Quest;
  sortKey: number;
};

export type RouteEdgeKind = 'next' | 'alternative';
export type RouteEdge = { from: StepId; to: StepId; kind: RouteEdgeKind };

export type NodeStance = { nodeId: NodeId; stance: 'excluded'; reason: string };

export type GuidePersona = { audience: string; startingPoint: string; outcome: string; assumptions: string[] };

export type Guide = {
  id: GuideId;
  version: number;
  pathId: PathId;
  title: string;
  persona: GuidePersona;
  steps: GuideStep[];
  edges: RouteEdge[];
  stances: NodeStance[];
  rationale: string;
};

export type RoadmapCatalog = {
  contentVersion: number;
  nodes: AtlasNode[];
  paths: Path[];
  guides: Guide[];
};
```

- [ ] **Step 3: Typecheck**

Run: `npm --prefix apps/mobile run typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/domain/roadmap/ids.ts apps/mobile/src/domain/roadmap/catalog.ts
git commit -m "feat(roadmap): catalog and id types for the roadmap domain model"
```

---

### Task 2: route-graph validator and linearization

**Files:**
- Create: `apps/mobile/src/domain/roadmap/graph.ts`
- Test: `apps/mobile/src/domain/roadmap/graph.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { GuideStep, RouteEdge } from './catalog';
import { linearize, validateGuide, validateRoute } from './graph';

const step = (id: string, sortKey: number, nodeId = `n-${id}`): GuideStep =>
  ({ id, nodeId, role: 'required', note: '', sortKey });
const next = (from: string, to: string): RouteEdge => ({ from, to, kind: 'next' });
const alt = (from: string, to: string): RouteEdge => ({ from, to, kind: 'alternative' });

describe('validateRoute', () => {
  it('accepts a linear route', () => {
    expect(validateRoute([step('a', 0), step('b', 1)], [next('a', 'b')])).toEqual([]);
  });
  it('rejects edges to missing steps, self-edges, and duplicates', () => {
    const steps = [step('a', 0), step('b', 1)];
    expect(validateRoute(steps, [next('a', 'zz')]).map((i) => i.code)).toContain('missing-step');
    expect(validateRoute(steps, [next('a', 'a')]).map((i) => i.code)).toContain('self-edge');
    expect(validateRoute(steps, [next('a', 'b'), next('a', 'b')]).map((i) => i.code)).toContain('duplicate-edge');
  });
  it('rejects cycles', () => {
    const issues = validateRoute([step('a', 0), step('b', 1)], [next('a', 'b'), next('b', 'a')]);
    expect(issues.map((i) => i.code)).toContain('cycle');
  });
  it('rejects duplicate step ids and empty routes', () => {
    expect(validateRoute([step('a', 0), step('a', 1)], []).map((i) => i.code)).toContain('duplicate-step');
    expect(validateRoute([], []).map((i) => i.code)).toContain('no-entry');
  });
});

describe('linearize', () => {
  it('orders by edges, breaking ties by sortKey then id', () => {
    const steps = [step('c', 2), step('a', 0), step('b', 1)];
    expect(linearize(steps, [next('a', 'b'), next('a', 'c')])).toEqual(['a', 'b', 'c']);
  });
  it('is stable under edge-array permutation', () => {
    const steps = [step('a', 0), step('b', 1), step('x', 5), step('y', 4)];
    const edges = [next('a', 'b'), alt('a', 'x'), alt('a', 'y'), next('x', 'b'), next('y', 'b')];
    const shuffled = [edges[3], edges[1], edges[4], edges[0], edges[2]];
    expect(linearize(steps, edges)).toEqual(linearize(steps, shuffled));
  });
  it('isolated steps are entries, positioned by sortKey', () => {
    expect(linearize([step('lone', -1), step('a', 0)], [])).toEqual(['lone', 'a']);
  });
});

describe('validateGuide', () => {
  const nodes = new Set(['n-a', 'n-b', 'theory']);
  const base = {
    id: 'g', version: 1, pathId: 'p', title: 'G',
    persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
    steps: [step('a', 0), step('b', 1)], edges: [next('a', 'b')],
    stances: [], rationale: '',
  };
  it('accepts placed nodes that exist and stances on unplaced nodes', () => {
    const guide = { ...base, stances: [{ nodeId: 'theory', stance: 'excluded' as const, reason: 'structure literacy suffices' }] };
    expect(validateGuide(guide, nodes)).toEqual([]);
  });
  it('rejects unknown nodes, stances on placed nodes, and empty stance reasons', () => {
    const g1 = { ...base, steps: [step('a', 0, 'ghost')], edges: [] };
    expect(validateGuide(g1, nodes).map((i) => i.code)).toContain('unknown-node');
    const g2 = { ...base, stances: [{ nodeId: 'n-a', stance: 'excluded' as const, reason: 'r' }] };
    expect(validateGuide(g2, nodes).map((i) => i.code)).toContain('stance-on-placed');
    const g3 = { ...base, stances: [{ nodeId: 'theory', stance: 'excluded' as const, reason: '  ' }] };
    expect(validateGuide(g3, nodes).map((i) => i.code)).toContain('empty-stance-reason');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/graph.test.ts`
Expected: FAIL — module `./graph` not found.

- [ ] **Step 3: Write `graph.ts`**

```ts
import type { Guide, GuideStep, RouteEdge } from './catalog';
import type { NodeId, StepId } from './ids';

export type GraphIssueCode =
  | 'missing-step' | 'self-edge' | 'duplicate-edge' | 'duplicate-step' | 'cycle'
  | 'no-entry' | 'unknown-node' | 'stance-on-placed' | 'empty-stance-reason' | 'duplicate-stance';

export type GraphIssue = { code: GraphIssueCode; stepId?: StepId; nodeId?: NodeId; message: string };

export function validateRoute(steps: readonly GuideStep[], edges: readonly RouteEdge[]): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const ids = new Set<string>();
  for (const s of steps) {
    if (ids.has(s.id)) issues.push({ code: 'duplicate-step', stepId: s.id, message: `Duplicate step id "${s.id}".` });
    ids.add(s.id);
  }
  if (steps.length === 0) issues.push({ code: 'no-entry', message: 'A route needs at least one step.' });
  const seen = new Set<string>();
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) {
      issues.push({ code: 'missing-step', message: `Edge ${e.from} -> ${e.to} references a missing step.` });
      continue;
    }
    if (e.from === e.to) issues.push({ code: 'self-edge', stepId: e.from, message: `Step "${e.from}" cannot connect to itself.` });
    const key = `${e.from}|${e.to}|${e.kind}`;
    if (seen.has(key)) issues.push({ code: 'duplicate-edge', message: `Duplicate edge ${e.from} -> ${e.to} (${e.kind}).` });
    seen.add(key);
  }
  if (issues.length === 0 && hasCycle(steps, edges)) issues.push({ code: 'cycle', message: 'The route graph contains a cycle.' });
  return issues;
}

function hasCycle(steps: readonly GuideStep[], edges: readonly RouteEdge[]): boolean {
  return linearize(steps, edges).length < steps.length;
}

/** Kahn's algorithm; at each pick, take the ready step with lowest (sortKey, id). Total for acyclic graphs; steps stuck in cycles are omitted. Isolated steps have no incoming edges and are ordinary entries. */
export function linearize(steps: readonly GuideStep[], edges: readonly RouteEdge[]): StepId[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const incoming = new Map<string, number>(steps.map((s) => [s.id, 0]));
  const out = new Map<string, string[]>();
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to) || e.from === e.to) continue;
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  }
  const rank = (id: string) => byId.get(id)!.sortKey;
  const ready = steps.filter((s) => (incoming.get(s.id) ?? 0) === 0).map((s) => s.id);
  const order: StepId[] = [];
  while (ready.length > 0) {
    ready.sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
    const id = ready.shift() as string;
    order.push(id);
    for (const to of out.get(id) ?? []) {
      const left = (incoming.get(to) ?? 0) - 1;
      incoming.set(to, left);
      if (left === 0) ready.push(to);
    }
  }
  return order;
}

/** Full guide validation: route + node existence (shared or provisional-in-scope) + stances. */
export function validateGuide(guide: Guide, knownNodeIds: ReadonlySet<string>): GraphIssue[] {
  const issues = validateRoute(guide.steps, guide.edges);
  const placed = new Set(guide.steps.map((s) => s.nodeId));
  for (const s of guide.steps) {
    if (!knownNodeIds.has(s.nodeId)) issues.push({ code: 'unknown-node', stepId: s.id, nodeId: s.nodeId, message: `Step "${s.id}" places unknown node "${s.nodeId}".` });
  }
  const stanced = new Set<string>();
  for (const st of guide.stances) {
    if (stanced.has(st.nodeId)) issues.push({ code: 'duplicate-stance', nodeId: st.nodeId, message: `Duplicate stance on "${st.nodeId}".` });
    stanced.add(st.nodeId);
    if (placed.has(st.nodeId)) issues.push({ code: 'stance-on-placed', nodeId: st.nodeId, message: `"${st.nodeId}" is placed in the route; a stance is only for unplaced nodes.` });
    if (!st.reason.trim()) issues.push({ code: 'empty-stance-reason', nodeId: st.nodeId, message: `Excluding "${st.nodeId}" requires a reason.` });
  }
  return issues;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/graph.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/domain/roadmap/graph.ts apps/mobile/src/domain/roadmap/graph.test.ts
git commit -m "feat(roadmap): route-graph validator and deterministic linearization"
```

---

### Task 3: user state and migration

**Files:**
- Create: `apps/mobile/src/domain/roadmap/state.ts`
- Test: `apps/mobile/src/domain/roadmap/state.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { defaultRoadmapState, migrateRoadmapState, ROADMAP_STORAGE_KEY } from './state';

const validBuild = {
  id: 'b1', title: 'My route', pathId: 'p1',
  provenance: { kind: 'adopted', guideId: 'g1', guideVersion: 1 },
  steps: [{ id: 's1', nodeId: 'n1', role: 'required', note: '', sortKey: 0, origin: { kind: 'from-guide' } }],
  edges: [],
};

describe('migrateRoadmapState', () => {
  it('returns a fresh default for garbage', () => {
    expect(migrateRoadmapState(undefined)).toEqual(defaultRoadmapState);
    expect(migrateRoadmapState('not json {')).toEqual(defaultRoadmapState);
    expect(migrateRoadmapState({ version: 99 })).toEqual(defaultRoadmapState);
  });
  it('parses stored JSON strings', () => {
    const state = migrateRoadmapState(JSON.stringify({ version: 1, builds: [validBuild], activeBuildId: 'b1' }));
    expect(state.builds).toHaveLength(1);
    expect(state.activeBuildId).toBe('b1');
  });
  it('drops invalid builds whole and clears dangling activeBuildId', () => {
    const cyclic = { ...validBuild, id: 'b2', steps: [...validBuild.steps, { ...validBuild.steps[0], id: 's2' }], edges: [{ from: 's1', to: 's2', kind: 'next' }, { from: 's2', to: 's1', kind: 'next' }] };
    const state = migrateRoadmapState({ version: 1, builds: [cyclic], activeBuildId: 'b2' });
    expect(state.builds).toEqual([]);
    expect(state.activeBuildId).toBeNull();
  });
  it('prunes orphaned progress, share refs, and unknown progress states', () => {
    const state = migrateRoadmapState({
      version: 1,
      builds: [validBuild],
      artifacts: [{ id: 'a1', kind: 'note', title: 't', value: 'v', createdAt: 'now' }],
      progress: {
        s1: { state: 'practicing', updatedAt: 'now', artifactIds: ['a1', 'ghost'] },
        ghost: { state: 'tried', updatedAt: 'now', artifactIds: [] },
        s1b: { state: 'overdue', updatedAt: 'now', artifactIds: [] },
      },
      share: { interestIds: ['music', 'bogus'], buildId: 'b1', stepIds: ['s1', 'ghost'], artifactIds: ['ghost'] },
    });
    expect(Object.keys(state.progress)).toEqual(['s1']);
    expect(state.progress.s1.artifactIds).toEqual(['a1']);
    expect(state.share).toEqual({ interestIds: ['music'], buildId: 'b1', stepIds: ['s1'], artifactIds: [] });
  });
  it('clears share stepIds when buildId is gone', () => {
    const state = migrateRoadmapState({ version: 1, builds: [], share: { interestIds: [], buildId: 'gone', stepIds: ['s1'], artifactIds: [] } });
    expect(state.share.buildId).toBeNull();
    expect(state.share.stepIds).toEqual([]);
  });
  it('exports the storage key', () => {
    expect(ROADMAP_STORAGE_KEY).toBe('life-leveling.roadmap.v1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/state.test.ts`
Expected: FAIL — module `./state` not found.

- [ ] **Step 3: Write `state.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/state.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/domain/roadmap/state.ts apps/mobile/src/domain/roadmap/state.test.ts
git commit -m "feat(roadmap): RoadmapState v1 with defensive migration"
```

---

### Task 4: explorer operations

**Files:**
- Create: `apps/mobile/src/domain/roadmap/ops.ts`
- Test: `apps/mobile/src/domain/roadmap/ops.test.ts`

Signature convention: every op returns `{ state, issues }`; on any issue the returned `state` is the input state unchanged. `ids` is a caller-supplied id generator; `now` an ISO string.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { Guide, RoadmapCatalog } from './catalog';
import {
  addArtifact, adoptGuide, attachArtifact, removeStep, replaceStep,
  selectForShare, setProgress,
} from './ops';
import { defaultRoadmapState } from './state';

const guide: Guide = {
  id: 'g1', version: 2, pathId: 'p1', title: 'Club-first',
  persona: { audience: 'a', startingPoint: 's', outcome: 'o', assumptions: [] },
  steps: [
    { id: 'gs1', nodeId: 'n-rhythm', role: 'required', note: 'count first', sortKey: 0 },
    { id: 'gs2', nodeId: 'n-gear', role: 'required', note: '', sortKey: 1 },
    { id: 'gs3', nodeId: 'n-mix', role: 'checkpoint', note: '', sortKey: 2 },
  ],
  edges: [
    { from: 'gs1', to: 'gs2', kind: 'next' },
    { from: 'gs2', to: 'gs3', kind: 'next' },
  ],
  stances: [], rationale: '',
};
const catalog: RoadmapCatalog = { contentVersion: 1, nodes: [], paths: [], guides: [guide] };
const seq = () => { let n = 0; return () => `id-${n++}`; };

describe('adoptGuide', () => {
  it('copies the route into an independent build with provenance', () => {
    const { state, issues } = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0');
    expect(issues).toEqual([]);
    const build = state.builds[0];
    expect(build.provenance).toEqual({ kind: 'adopted', guideId: 'g1', guideVersion: 2 });
    expect(build.steps.map((s) => s.origin)).toEqual([{ kind: 'from-guide' }, { kind: 'from-guide' }, { kind: 'from-guide' }]);
    expect(build.steps.map((s) => s.id)).not.toEqual(guide.steps.map((s) => s.id));
    expect(build.edges).toHaveLength(2);
    expect(state.activeBuildId).toBe(build.id);
    guide.steps[0].note = 'MUTATED';
    expect(build.steps[0].note).toBe('count first');
    guide.steps[0].note = 'count first';
  });
  it('reports a missing guide without changing state', () => {
    const { state, issues } = adoptGuide(catalog, defaultRoadmapState, 'ghost', seq(), 't0');
    expect(state).toBe(defaultRoadmapState);
    expect(issues.map((i) => i.code)).toEqual(['missing-guide']);
  });
});

describe('replaceStep', () => {
  it('swaps the node and records origin with the prior node id', () => {
    const adopted = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = adopted.builds[0].id;
    const stepId = adopted.builds[0].steps[1].id;
    const { state, issues } = replaceStep(adopted, buildId, stepId, 'n-free-software');
    expect(issues).toEqual([]);
    const step = state.builds[0].steps[1];
    expect(step.nodeId).toBe('n-free-software');
    expect(step.origin).toEqual({ kind: 'replaced', originalNodeId: 'n-gear' });
  });
});

describe('removeStep', () => {
  it('splices edges, prunes progress and share refs, keeps the graph valid', () => {
    let s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const buildId = s.builds[0].id;
    const [a, b, c] = s.builds[0].steps.map((x) => x.id);
    s = setProgress(s, b, { state: 'tried', updatedAt: 't1', artifactIds: [] }).state;
    s = selectForShare(s, { buildId, stepIds: [b] }).state;
    const { state, issues } = removeStep(s, buildId, b);
    expect(issues).toEqual([]);
    expect(state.builds[0].steps.map((x) => x.id)).toEqual([a, c]);
    expect(state.builds[0].edges).toEqual([{ from: a, to: c, kind: 'next' }]);
    expect(state.progress[b]).toBeUndefined();
    expect(state.share.stepIds).toEqual([]);
  });
});

describe('progress, artifacts, share', () => {
  it('setProgress requires an existing step', () => {
    const { state, issues } = setProgress(defaultRoadmapState, 'ghost', { state: 'tried', updatedAt: 't', artifactIds: [] });
    expect(state).toBe(defaultRoadmapState);
    expect(issues.map((i) => i.code)).toEqual(['missing-step']);
  });
  it('attachArtifact requires an existing progress entry and artifact', () => {
    let s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    const stepId = s.builds[0].steps[0].id;
    s = addArtifact(s, { id: 'a1', kind: 'note', title: 'First blend', value: 'went ok', createdAt: 't1' }).state;
    expect(attachArtifact(s, stepId, 'a1').issues.map((i) => i.code)).toEqual(['missing-progress']);
    s = setProgress(s, stepId, { state: 'tried', updatedAt: 't1', artifactIds: [] }).state;
    s = attachArtifact(s, stepId, 'a1').state;
    expect(s.progress[stepId].artifactIds).toEqual(['a1']);
  });
  it('selectForShare prunes step ids outside the shared build and is additive from empty', () => {
    const s = adoptGuide(catalog, defaultRoadmapState, 'g1', seq(), 't0').state;
    expect(defaultRoadmapState.share).toEqual({ interestIds: [], buildId: null, stepIds: [], artifactIds: [] });
    const { state } = selectForShare(s, { buildId: s.builds[0].id, stepIds: [s.builds[0].steps[0].id, 'ghost'] });
    expect(state.share.stepIds).toEqual([s.builds[0].steps[0].id]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/ops.test.ts`
Expected: FAIL — module `./ops` not found.

- [ ] **Step 3: Write `ops.ts`**

```ts
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

/** Removes a step, splicing next-edges across the gap (pred -> succ). Alternative edges touching the step are dropped. Refuses (input unchanged) if the spliced graph would be invalid. */
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

/** The ONLY writer of ShareSelection (with removeStep's pruning). Merges the patch, then prunes: stepIds must belong to the shared build, artifactIds must exist. */
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/ops.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/domain/roadmap/ops.ts apps/mobile/src/domain/roadmap/ops.test.ts
git commit -m "feat(roadmap): pure explorer operations - adopt, remix, progress, share"
```

---

### Task 5: creator (guide-edit) operations

**Files:**
- Create: `apps/mobile/src/domain/roadmap/guide-edit.ts`
- Test: `apps/mobile/src/domain/roadmap/guide-edit.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { AtlasNode, Guide } from './catalog';
import { connectEdge, createProvisionalNode, placeStep, setRole, setStance } from './guide-edit';

const nodes: AtlasNode[] = [
  { id: 'n-rhythm', type: 'foundation', title: 'Rhythm & Song Structure', description: 'd' },
  { id: 'n-theory', type: 'foundation', title: 'Music Theory Fundamentals', description: 'd' },
];
const empty: Guide = {
  id: 'draft-1', version: 1, pathId: 'p1', title: 'Draft',
  persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
  steps: [], edges: [], stances: [], rationale: '',
};

describe('guide editing', () => {
  it('places steps, connects edges, and reports live issues on unfinished drafts', () => {
    const a = placeStep(nodes, empty, { nodeId: 'n-rhythm', role: 'required', note: '', sortKey: 0 }, 's1');
    expect(a.issues).toEqual([]);
    const b = placeStep(nodes, a.guide, { nodeId: 'ghost', role: 'required', note: '', sortKey: 1 }, 's2');
    expect(b.issues.map((i) => i.code)).toContain('unknown-node');
    const c = connectEdge(nodes, a.guide, 's1', 'missing', 'next');
    expect(c.issues.map((i) => i.code)).toContain('missing-step');
    expect(c.guide).toEqual(a.guide);
  });
  it('setRole and setStance validate their targets', () => {
    const a = placeStep(nodes, empty, { nodeId: 'n-rhythm', role: 'recommended', note: '', sortKey: 0 }, 's1');
    const b = setRole(nodes, a.guide, 's1', 'required');
    expect(b.guide.steps[0].role).toBe('required');
    const c = setStance(nodes, b.guide, 'n-theory', 'structure literacy suffices');
    expect(c.issues).toEqual([]);
    expect(c.guide.stances).toEqual([{ nodeId: 'n-theory', stance: 'excluded', reason: 'structure literacy suffices' }]);
    const d = setStance(nodes, c.guide, 'n-rhythm', 'nope');
    expect(d.issues.map((i) => i.code)).toContain('stance-on-placed');
  });
  it('createProvisionalNode scopes the node to the guide and places it', () => {
    const { guide, node, issues } = createProvisionalNode(nodes, empty,
      { title: 'Open-Decks Etiquette', description: 'Sign-up norms.', type: 'experience' }, 'prov-1', 'sp-1');
    expect(issues).toEqual([]);
    expect(node.provisional).toEqual({ scopeGuideId: 'draft-1' });
    expect(guide.steps[0].nodeId).toBe('prov-1');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/guide-edit.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `guide-edit.ts`**

```ts
import type { AtlasNode, Guide, NodeType, RouteEdgeKind, RouteRole } from './catalog';
import { validateGuide, type GraphIssue } from './graph';
import type { NodeId, StepId } from './ids';

export type GuideEditResult = { guide: Guide; issues: GraphIssue[] };

function known(nodes: readonly AtlasNode[], guide: Guide): Set<string> {
  return new Set(nodes
    .filter((n) => !n.provisional || n.provisional.scopeGuideId === guide.id)
    .map((n) => n.id));
}

function validated(nodes: readonly AtlasNode[], guide: Guide): GuideEditResult {
  return { guide, issues: validateGuide(guide, known(nodes, guide)) };
}

export function placeStep(
  nodes: readonly AtlasNode[], guide: Guide,
  draft: { nodeId: NodeId; role: RouteRole; note: string; sortKey: number }, stepId: StepId,
): GuideEditResult {
  return validated(nodes, { ...guide, steps: [...guide.steps, { id: stepId, ...draft }] });
}

export function connectEdge(nodes: readonly AtlasNode[], guide: Guide, from: StepId, to: StepId, kind: RouteEdgeKind): GuideEditResult {
  const has = (id: StepId) => guide.steps.some((s) => s.id === id);
  if (!has(from) || !has(to)) {
    return { guide, issues: [{ code: 'missing-step', message: `Cannot connect ${from} -> ${to}: step not in draft.` }] };
  }
  return validated(nodes, { ...guide, edges: [...guide.edges, { from, to, kind }] });
}

export function setRole(nodes: readonly AtlasNode[], guide: Guide, stepId: StepId, role: RouteRole): GuideEditResult {
  if (!guide.steps.some((s) => s.id === stepId)) {
    return { guide, issues: [{ code: 'missing-step', stepId, message: `No step "${stepId}" in draft.` }] };
  }
  return validated(nodes, { ...guide, steps: guide.steps.map((s) => (s.id === stepId ? { ...s, role } : s)) });
}

export function setStance(nodes: readonly AtlasNode[], guide: Guide, nodeId: NodeId, reason: string): GuideEditResult {
  const next = { ...guide, stances: [...guide.stances.filter((s) => s.nodeId !== nodeId), { nodeId, stance: 'excluded' as const, reason }] };
  return validated(nodes, next);
}

export function clearStance(nodes: readonly AtlasNode[], guide: Guide, nodeId: NodeId): GuideEditResult {
  return validated(nodes, { ...guide, stances: guide.stances.filter((s) => s.nodeId !== nodeId) });
}

export function createProvisionalNode(
  nodes: readonly AtlasNode[], guide: Guide,
  draft: { title: string; description: string; type: NodeType }, nodeId: NodeId, stepId: StepId,
): GuideEditResult & { node: AtlasNode } {
  const node: AtlasNode = { id: nodeId, ...draft, provisional: { scopeGuideId: guide.id } };
  const result = placeStep([...nodes, node], guide,
    { nodeId, role: 'optional-depth', note: '', sortKey: guide.steps.length }, stepId);
  return { ...result, node };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/guide-edit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/domain/roadmap/guide-edit.ts apps/mobile/src/domain/roadmap/guide-edit.test.ts
git commit -m "feat(roadmap): pure creator operations for guide drafting"
```

---

### Task 6: fixtures — DJ/VJ content, breadth stubs, catalog assembly

**Files:**
- Create: `apps/mobile/src/domain/roadmap/fixtures/djvj/nodes.ts`
- Create: `apps/mobile/src/domain/roadmap/fixtures/djvj/path.ts`
- Create: `apps/mobile/src/domain/roadmap/fixtures/djvj/guide-club-first.ts`
- Create: `apps/mobile/src/domain/roadmap/fixtures/djvj/guide-visual-first.ts`
- Create: `apps/mobile/src/domain/roadmap/fixtures/stubs/` (8 files: `event-tech.ts`, `creative-coding.ts`, `projection-mapping.ts`, `music-production.ts`, `bouldering.ts`, `japanese.ts`, `woodworking.ts`, `ux-design.ts`)
- Create: `apps/mobile/src/domain/roadmap/fixtures/catalog.ts`
- Test: `apps/mobile/src/domain/roadmap/fixtures/catalog.test.ts`

**Content source is the research report** (`docs/product/research/dj-vj-route-research.md`). Node descriptions from §2's table; guide notes/personas/rationales condensed from §3/§4 (keep the quotes' meaning, drop the source-URL links — fixtures are product copy, not bibliography); Path overview from §1; stances from §3/§4 with the report's reasons.

- [ ] **Step 1: Write `djvj/nodes.ts`** — the 17 shared Nodes plus 2 provisional. Ids, types, and titles exactly as follows (descriptions transcribed from report §2, 1–2 sentences each):

```ts
import type { AtlasNode } from '../../catalog';

export const djvjNodes: AtlasNode[] = [
  { id: 'rhythm-song-structure', type: 'foundation', title: 'Rhythm & Song Structure', description: /* report §2 row 1 */ '' },
  { id: 'music-selection-library', type: 'skill', title: 'Music Selection & Library Building', description: /* §2 row 2 */ '' },
  { id: 'music-theory-fundamentals', type: 'foundation', title: 'Music Theory Fundamentals', description: /* §2 row 3 */ '' },
  { id: 'playing-an-instrument', type: 'skill', title: 'Playing an Instrument', description: /* §2 row 4 */ '' },
  { id: 'harmonic-mixing', type: 'skill', title: 'Harmonic Mixing (Key Awareness)', description: /* §2 row 5 */ '' },
  { id: 'mixing-technique', type: 'skill', title: 'Mixing Technique (Tempo, EQ & Blends)', description: /* §2 row 6 */ '' },
  { id: 'signal-flow-rig-setup', type: 'foundation', title: 'Signal Flow & Rig Setup', description: /* §2 row 7 */ '' },
  { id: 'gear-access-practice-setup', type: 'resource', title: 'Gear Access & Practice Setup', description: /* §2 row 8 */ '' },
  { id: 'visual-composition', type: 'foundation', title: 'Visual Composition', description: /* §2 row 9 */ '' },
  { id: 'visual-content-library', type: 'skill', title: 'Visual Content Library & Preparation', description: /* §2 row 10 */ '' },
  { id: 'reactive-visuals', type: 'skill', title: 'Reactive Visuals (Beat Sync & Audio Analysis)', description: /* §2 row 11 */ '' },
  { id: 'projection-display-basics', type: 'skill', title: 'Projection & Display Basics', description: /* §2 row 12 */ '' },
  { id: 'live-control-surfaces', type: 'skill', title: 'Live Control Surfaces', description: /* §2 row 13 */ '' },
  { id: 'club-media-player-workflow', type: 'skill', title: 'Club Media-Player Workflow', description: /* §2 row 14 */ '' },
  { id: 'observing-a-live-set', type: 'experience', title: 'Observing a Live Set', description: /* §2 row 15 */ '' },
  { id: 'private-one-track-experiment', type: 'project', title: 'Private One-Track Experiment', description: /* §2 row 16 */ '' },
  { id: 'ten-minute-av-set', type: 'milestone', title: 'Ten-Minute Audiovisual Set', description: /* §2 row 17 */ '' },
  // Provisional custom-node candidates (report §2 closing paragraph), scoped to the club-first guide:
  { id: 'open-decks-etiquette', type: 'experience', title: 'Open-Decks Etiquette', description: /* §2 */ '', provisional: { scopeGuideId: 'guide-club-first' } },
  { id: 'tap-tempo-drill', type: 'skill', title: 'Tap-Tempo Drill', description: /* §2 */ '', provisional: { scopeGuideId: 'guide-club-first' } },
];
```

(The `/* report §N */ ''` markers above are for THIS plan only — the executed file must contain the real transcribed strings, no empty descriptions.)

- [ ] **Step 2: Write `djvj/guide-club-first.ts`** — Guide A. Persona and notes condensed from report §3. Structural data (ids, roles, edges) exactly:

Steps (`id` / `nodeId` / `role` / `sortKey`):
`a1/rhythm-song-structure/required/0`, `a2/music-selection-library/required/1`, `a3/signal-flow-rig-setup/required/2`, `a4/gear-access-practice-setup/required/3` (note: main route — rent the club booth by the hour), `a4-controller/gear-access-practice-setup/alternative/4` (note: own a starter controller), `a4-free/gear-access-practice-setup/alternative/5` (note: free software, keyboard only — the keyboard-only remix target), `a5/mixing-technique/required/6`, `a6/club-media-player-workflow/required/7`, `a7/harmonic-mixing/recommended/8`, `a8/reactive-visuals/recommended/9`, `a9/live-control-surfaces/recommended/10`, `a10/observing-a-live-set/recommended/11`, `a11/private-one-track-experiment/recommended/12` (quest: `{ id: 'q-a-blend', kind: 'make', prompt: 'Record one two-track blend and listen back.' }`), `a12/ten-minute-av-set/checkpoint/13` (quest: `{ id: 'q-a-set', kind: 'make', prompt: 'Play a ten-minute set at an open-decks night: 3-4 planned tracks, visuals on tap-tempo, backup USB in your pocket.' }`), plus optional-depth placements `a-theory/music-theory-fundamentals/optional-depth/14`, `a-instrument/playing-an-instrument/optional-depth/15`, `a-viscomp/visual-composition/optional-depth/16`, `a-vislib/visual-content-library/optional-depth/17`, `a-projection/projection-display-basics/optional-depth/18`.

Edges: mainline `next`: a1→a2→a3→a4→a5→a6→a7→a8→a9→a10→a11→a12. Branch (alternatives fork from a3, rejoin at a5): `a3→a4-controller (alternative)`, `a3→a4-free (alternative)`, `a4-controller→a5 (next)`, `a4-free→a5 (next)`. Optional-depth attachments (`next`): `a7→a-theory`, `a-theory→a-instrument`, `a8→a-viscomp`, `a-viscomp→a-vislib`, `a3→a-projection`.

Stances: none (both contested nodes are placed as optional-depth). Rationale: the §3 Creator quote, condensed, links removed.

- [ ] **Step 3: Write `djvj/guide-visual-first.ts`** — Guide B, from report §4:

Steps: `b1/visual-composition/required/0`, `b2/rhythm-song-structure/required/1`, `b3/visual-content-library/required/2`, `b4/reactive-visuals/required/3`, `b5/signal-flow-rig-setup/required/4`, `b6/projection-display-basics/required/5`, `b7/live-control-surfaces/required/6`, `b8/observing-a-live-set/recommended/7`, `b9/private-one-track-experiment/checkpoint/8` (quest: `{ id: 'q-b-map', kind: 'try', prompt: 'Map two visual changes to one song section of a recorded set, at home, private.' }`), `b10/ten-minute-av-set/required/9`, `b-gear/gear-access-practice-setup/recommended/10`, `b-mix/mixing-technique/alternative/11`, `b-musicsel/music-selection-library/optional-depth/12`.

Edges: mainline `next`: b1→b2→b3→b4→b5→b6→b7→b8→b9→b10. Side placement: `b1→b-gear (next)`. DJ-technique branch (alternative to b7, forks from b6, rejoins at b8): `b6→b-mix (alternative)`, `b-mix→b-musicsel (next)`, `b-musicsel→b8 (next)`.

Stances (reasons condensed from report §4): `music-theory-fundamentals` excluded — "No VJ source demands formal theory; what you need is structure literacy, and that's Step 2."; `playing-an-instrument` excluded — "Instrument hours serve the audio craft this route does not touch; spend those hours on your controller — performed visuals are their own instrument."

- [ ] **Step 4: Write `djvj/path.ts`** — the DJ/VJ Path: `id: 'djvj'`, `status: 'full'`, `interestIds: ['music', 'technology']`, overview prose transcribed/condensed from report §1 (whatItIs; settings 5 bullets; variants 4 bullets; realities 4 bullets with as-of-Aug-2026 phrasing on prices; foundations paragraph), `nodeIds` = the 17 shared ids, `neighborPathIds: ['music-production', 'creative-coding-music', 'projection-mapping', 'event-technology']`.

- [ ] **Step 5: Write the 8 stub files.** Each exports `{ path, nodes, guide }` with `status: 'stub'`, 4–6 nodes, and one small valid Guide. The four related Paths take their one-paragraph `whatItIs` from report §6. Structural specification (nodes may be brief; every guide must pass `validateGuide`):

- `event-tech.ts` — path `event-technology` (interests: technology, making). Nodes: `signal-flow-rig-setup` (SHARED — reuse the DJ/VJ node id in `nodeIds`, do not redefine), `live-sound-basics` (skill), `stage-lighting-dmx` (skill), `stagehand-apprenticeship` (experience), `show-call` (milestone). Guide `guide-stagehand-route` (apprenticeship-shaped): stagehand-apprenticeship (required) → live-sound-basics (recommended) → stage-lighting-dmx (recommended) → show-call (checkpoint), signal-flow placed required between apprenticeship and live-sound.
- `creative-coding.ts` — path `creative-coding-music` (music, technology). Nodes: `rhythm-song-structure` (SHARED), `live-coding-patterns` (skill), `browser-video-synthesis` (skill), `algorave-set` (milestone). Guide: browser-first route, rhythm required, live-coding-patterns required, browser-video-synthesis recommended, algorave-set checkpoint.
- `projection-mapping.ts` — path `projection-mapping` (design, technology). Nodes: `visual-composition` (SHARED), `projection-display-basics` (SHARED), `surface-mapping` (skill), `site-survey` (experience), `mapped-installation` (milestone/project). Guide: home-first route.
- `music-production.ts` — path `music-production` (music). Nodes: `rhythm-song-structure` (SHARED), `music-theory-fundamentals` (SHARED), `daw-fluency` (skill), `arrangement` (skill), `finished-track` (milestone). Guide `guide-daw-first`: **music-theory-fundamentals placed as `required`** — this is the pro-theory counterweight the research says the DJ/VJ pair lacks.
- `bouldering.ts` — path `bouldering` (movement). Nodes: `movement-fundamentals` (foundation), `gym-access` (resource), `falling-safely` (skill), `reading-problems` (skill), `outdoor-session` (experience). Guide: gym-first; note on reading-problems says grades are the gym's language, not the product's — progress states stay the standard seven (schema pressure point: external grading culture stays out of the model).
- `japanese.ts` — path `learning-japanese` (language). Nodes: `kana` (skill), `core-grammar` (foundation), `immersion-listening` (experience), `speaking-practice` (skill), `first-conversation` (milestone). Guide: immersion-first; no performable gig — checkpoint is first-conversation; long-horizon phrasing in notes (pressure point: paused/practicing over years, no deadline language).
- `woodworking.ts` — path `woodworking` (making). Nodes: `tool-safety` (foundation), `workshop-access` (resource), `joinery-basics` (skill), `first-box` (project), `finished-piece` (milestone). Guide: community-workshop route; workshop-access required before joinery (pressure point: access-gated Resource node on the spine).
- `ux-design.ts` — path `ux-design` (design, technology). Nodes: `design-fundamentals` (foundation), `research-basics` (skill), `portfolio-case-study` (project), `critique-session` (experience), `first-client-or-role` (milestone). Guide: portfolio-first; case-study checkpoint (pressure point: the share surface IS the outcome).

- [ ] **Step 6: Write `fixtures/catalog.ts`**

```ts
import type { RoadmapCatalog } from '../catalog';
import { djvjNodes } from './djvj/nodes';
import { djvjPath } from './djvj/path';
import { guideClubFirst } from './djvj/guide-club-first';
import { guideVisualFirst } from './djvj/guide-visual-first';
// ... import each stub's { path, nodes, guide }

export const roadmapCatalog: RoadmapCatalog = {
  contentVersion: 1,
  nodes: [...djvjNodes, /* stub-only nodes, deduped — shared ids appear once */],
  paths: [djvjPath, /* 8 stub paths */],
  guides: [guideClubFirst, guideVisualFirst, /* 8 stub guides */],
};
```

Dedup rule: a node id may appear once in `catalog.nodes`; stubs referencing shared DJ/VJ nodes list the id in their path's `nodeIds` but do not redefine the node.

- [ ] **Step 7: Write `fixtures/catalog.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { validateGuide } from '../graph';
import { roadmapCatalog } from './catalog';

const nodeIds = new Set(roadmapCatalog.nodes.map((n) => n.id));

describe('roadmap catalog fixtures', () => {
  it('has no duplicate node, path, or guide ids', () => {
    expect(roadmapCatalog.nodes.length).toBe(nodeIds.size);
    expect(new Set(roadmapCatalog.paths.map((p) => p.id)).size).toBe(roadmapCatalog.paths.length);
    expect(new Set(roadmapCatalog.guides.map((g) => g.id)).size).toBe(roadmapCatalog.guides.length);
  });
  it('every guide validates against the catalog', () => {
    for (const guide of roadmapCatalog.guides) {
      const known = new Set(roadmapCatalog.nodes
        .filter((n) => !n.provisional || n.provisional.scopeGuideId === guide.id)
        .map((n) => n.id));
      expect({ guide: guide.id, issues: validateGuide(guide, known) }).toEqual({ guide: guide.id, issues: [] });
    }
  });
  it('every path overview is complete and every referenced node exists', () => {
    for (const path of roadmapCatalog.paths) {
      expect(path.overview.whatItIs.length).toBeGreaterThan(0);
      expect(path.interestIds.length).toBeGreaterThan(0);
      for (const id of path.nodeIds) expect(nodeIds.has(id)).toBe(true);
      for (const id of path.neighborPathIds) expect(roadmapCatalog.paths.some((p) => p.id === id)).toBe(true);
    }
    const djvj = roadmapCatalog.paths.find((p) => p.id === 'djvj');
    expect(djvj?.overview.settings.length).toBeGreaterThanOrEqual(4);
    expect(djvj?.overview.variants.length).toBe(4);
    expect(djvj?.overview.realities.length).toBeGreaterThanOrEqual(3);
    expect(djvj?.neighborPathIds).toHaveLength(4);
  });
  it('all 17 shared DJ/VJ nodes are referenced by a DJ/VJ guide as placement or stance', () => {
    const djvj = roadmapCatalog.paths.find((p) => p.id === 'djvj');
    const guides = roadmapCatalog.guides.filter((g) => g.pathId === 'djvj');
    for (const nodeId of djvj?.nodeIds ?? []) {
      const referenced = guides.some((g) =>
        g.steps.some((s) => s.nodeId === nodeId) || g.stances.some((s) => s.nodeId === nodeId));
      expect({ nodeId, referenced }).toEqual({ nodeId, referenced: true });
    }
  });
  it('both contested nodes carry a placement or stance in BOTH DJ/VJ guides', () => {
    for (const guideId of ['guide-club-first', 'guide-visual-first']) {
      const guide = roadmapCatalog.guides.find((g) => g.id === guideId);
      for (const contested of ['music-theory-fundamentals', 'playing-an-instrument']) {
        const placed = guide?.steps.some((s) => s.nodeId === contested) ?? false;
        const stanced = guide?.stances.some((s) => s.nodeId === contested) ?? false;
        expect({ guideId, contested, covered: placed || stanced }).toEqual({ guideId, contested, covered: true });
      }
    }
  });
  it('the theory disagreement spans the catalog: optional in A, excluded in B, required somewhere', () => {
    const a = roadmapCatalog.guides.find((g) => g.id === 'guide-club-first');
    const b = roadmapCatalog.guides.find((g) => g.id === 'guide-visual-first');
    expect(a?.steps.find((s) => s.nodeId === 'music-theory-fundamentals')?.role).toBe('optional-depth');
    expect(b?.stances.some((s) => s.nodeId === 'music-theory-fundamentals')).toBe(true);
    expect(roadmapCatalog.guides.some((g) => g.steps.some((s) => s.nodeId === 'music-theory-fundamentals' && s.role === 'required'))).toBe(true);
  });
});
```

- [ ] **Step 8: Run fixture tests until green**

Run: `npm --prefix apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: PASS. Graph mistakes in hand-authored edges will surface here — fix the fixture, not the validator.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/domain/roadmap/fixtures
git commit -m "feat(roadmap): DJ/VJ fixtures and eight breadth-stub paths from the route research"
```

---

### Task 7: selectors — discover, path-overview, step-detail

**Files:**
- Create: `apps/mobile/src/domain/roadmap/selectors/discover.ts`, `path-overview.ts`, `step-detail.ts`
- Test: `apps/mobile/src/domain/roadmap/selectors/discover.test.ts`, `path-overview.test.ts`, `step-detail.test.ts`

View-model shapes (all plain serializable objects):

```ts
// discover.ts
export type DiscoverPathVm = { id: PathId; title: string; whatItIs: string; status: 'full' | 'stub'; matchedInterests: InterestId[] };
export type DiscoverVm = { interests: { id: InterestId; label: string; selected: boolean }[]; paths: DiscoverPathVm[] };
export function discoverView(catalog: RoadmapCatalog, state: RoadmapState): DiscoverVm
// Ranking: matchedInterests.length desc, then 'full' before 'stub', then title asc. No "match %" language.

// path-overview.ts
export type PathOverviewVm = {
  id: PathId; title: string; status: 'full' | 'stub';
  overview: Path['overview'];
  guides: { id: GuideId; title: string; audience: string; outcome: string }[];
  neighbors: { id: PathId; title: string; whatItIs: string }[];
};
export function pathOverviewView(catalog: RoadmapCatalog, pathId: PathId): PathOverviewVm | null

// step-detail.ts
export type StepDetailVm = {
  stepId: StepId; nodeTitle: string; nodeType: NodeType; nodeDescription: string;
  role: RouteRole; note: string;
  quest: Quest | null;
  progress: ProgressEntry | null;
  availableStates: readonly ProgressState[];   // always all seven
  artifacts: Artifact[];                        // resolved from progress.artifactIds
};
export function stepDetailView(catalog: RoadmapCatalog, state: RoadmapState, buildId: BuildId, stepId: StepId): StepDetailVm | null
```

- [ ] **Step 1: Write failing tests** — using `roadmapCatalog` from fixtures plus small hand-built states. Required cases: discover with `interests: ['music','technology']` puts `djvj` first and marks stubs; discover with no interests still lists paths (matchedInterests empty, full-before-stub then title order); pathOverviewView returns null for unknown id, lists both DJ/VJ guides and 4 neighbors with non-empty `whatItIs`; stepDetailView returns all seven `availableStates`, null quest when absent, resolved artifacts in progress order, and null for a step outside the named build.
- [ ] **Step 2: Run to verify failure** (`npm --prefix apps/mobile test -- src/domain/roadmap/selectors`) — FAIL, modules not found.
- [ ] **Step 3: Implement the three modules** to the signatures above; pure lookups only, no sorting logic beyond the stated ranking.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `feat(roadmap): discover, path-overview, and step-detail selectors`.

---

### Task 8: selectors — guide-comparison, guide-builder

**Files:**
- Create: `apps/mobile/src/domain/roadmap/selectors/guide-comparison.ts`, `guide-builder.ts`
- Test: matching `.test.ts` files

```ts
// guide-comparison.ts
export type ComparisonSide =
  | { kind: 'placed'; role: RouteRole; note: string }
  | { kind: 'excluded'; reason: string }
  | { kind: 'absent' };
export type NodeComparisonRow = { nodeId: NodeId; nodeTitle: string; a: ComparisonSide; b: ComparisonSide };
export type GuideComparisonVm = {
  a: { id: GuideId; title: string; persona: GuidePersona };
  b: { id: GuideId; title: string; persona: GuidePersona };
  rows: NodeComparisonRow[];             // union of placed+stanced nodes, ordered by A's linearization then B's, stanced/absent-only last by title
  personaDiffs: { field: 'audience' | 'startingPoint' | 'outcome' | 'assumptions'; a: string; b: string }[];
  stanceDisagreements: { nodeId: NodeId; nodeTitle: string; placedIn: GuideId; role: RouteRole; excludedIn: GuideId; reason: string }[];
  materialDifferences: string[];         // one sentence per: each persona diff + each role-class difference (required/checkpoint vs absent/excluded, placed vs excluded)
};
export function compareGuides(catalog: RoadmapCatalog, guideIdA: GuideId, guideIdB: GuideId): GuideComparisonVm | null

// guide-builder.ts
export type BuilderStepVm = { stepId: StepId; nodeTitle: string; role: RouteRole; note: string; branchOf: StepId | null };
export type GuideBuilderVm = {
  nodes: { id: NodeId; title: string; type: NodeType; provisional: boolean }[];  // shared + this draft's provisional
  route: BuilderStepVm[];                 // linearized; branchOf = the `from` of the alternative edge that introduces the step, else null
  stances: NodeStance[];
  issues: GraphIssue[];
};
export function builderView(catalog: RoadmapCatalog, draft: Guide): GuideBuilderVm
export function searchNodes(catalog: RoadmapCatalog, draft: Guide, query: string): GuideBuilderVm['nodes']  // case-insensitive title+description match
```

- [ ] **Step 1: Write failing tests.** Required cases against the DJ/VJ fixtures: `compareGuides(catalog, 'guide-club-first', 'guide-visual-first')` — `materialDifferences.length >= 3`; theory row is `{a: placed optional-depth, b: excluded}` with B's reason text; instrument row likewise; `stanceDisagreements` contains both contested nodes; club-media-player row is `{a: placed, b: absent}`; comparing a guide with itself yields zero materialDifferences and zero stanceDisagreements. Builder: `builderView` on `guide-club-first` returns no issues and marks `a4-controller`/`a4-free` with `branchOf: 'a3'`; `searchNodes(catalog, guideClubFirst, 'etiquette')` finds the provisional node; searching from a DIFFERENT guide draft does not.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement.** `materialDifferences` composition: for each persona field where trimmed values differ → `"Audience: {a} vs {b}"` style sentence; for each node where one side is required/checkpoint and the other absent/excluded, or one placed and the other excluded → `"{nodeTitle}: {roleA} in {titleA}, {stateB} in {titleB}"`.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `feat(roadmap): guide comparison and guide builder selectors`.

---

### Task 9: selectors — build view, share preview

**Files:**
- Create: `apps/mobile/src/domain/roadmap/selectors/build.ts`, `share-preview.ts`
- Test: matching `.test.ts` files

```ts
// build.ts
export type BuildStepVm = {
  stepId: StepId; nodeTitle: string; role: RouteRole; note: string;
  originBadge: string | null;            // null for from-guide; 'Added by you'; 'Replaced: {original node title}'
  progressState: ProgressState | null;
  branchOf: StepId | null;
};
export type BuildVm = {
  id: BuildId; title: string; pathTitle: string;
  provenance: string | null;             // 'Adopted from {guide title} (v{n})' | null for scratch
  steps: BuildStepVm[];                  // linearized
};
export function buildView(catalog: RoadmapCatalog, state: RoadmapState, buildId: BuildId): BuildVm | null

// share-preview.ts
export type SharePreviewVm = {
  interests: { id: InterestId; label: string }[];
  build: { title: string; pathTitle: string; provenance: string | null } | null;
  steps: { nodeTitle: string; role: RouteRole; progressState: ProgressState | null }[];
  artifacts: { title: string; kind: ArtifactKind }[];
};
export function sharePreviewView(catalog: RoadmapCatalog, state: RoadmapState): SharePreviewVm
export type ShareAuditVm = { privateBuilds: number; privateSteps: number; privateArtifacts: number; privateInterests: number };
export function shareAudit(state: RoadmapState): ShareAuditVm
```

- [ ] **Step 1: Write failing tests.** Required cases: buildView shows `provenance` string for adopted builds and `originBadge: 'Replaced: Gear Access & Practice Setup'` after a `replaceStep`; empty ShareSelection → `sharePreviewView` returns `{interests: [], build: null, steps: [], artifacts: []}`; a property-style test — build a state with 3 artifacts/5 steps, select a random subset 25 times with a seeded loop, assert every VM item's source id is in the selection (never an unselected item); `shareAudit` counts unshared items correctly.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement.** `sharePreviewView` reads ONLY `state.share` for choosing content — its body must never iterate `state.builds`/`state.artifacts` except to resolve ids listed in the selection.
- [ ] **Step 4: Run to verify pass.**
- [ ] **Step 5: Commit** — `feat(roadmap): build view and selective share preview selectors`.

---

### Task 10: docs, vocabulary update, full verification

**Files:**
- Modify: `docs/product/vocabulary.md` (Progress section, Guide section)
- Modify: `apps/mobile/AGENTS.md` (product source-of-truth block)

- [ ] **Step 1: Update `vocabulary.md`.** In `### Progress`, change the language list to `interested, tried, practicing, demonstrated, paused, skipped, or not for me`. In `### Guide`, after the route-roles list, add: *"A Guide may also record an explicit **excluded** stance, with a stated reason, for a shared Node it deliberately does not place. Absence without a stance carries no meaning."*
- [ ] **Step 2: Update `apps/mobile/AGENTS.md`.** In the "Product source of truth" section, append: *"The roadmap domain model implementing this vocabulary lives in `src/domain/roadmap/` (see `docs/superpowers/specs/2026-08-16-roadmap-domain-model-design.md`); the Alpha `JourneyState` in `src/domain/journey.ts` is legacy and must not gain new features."*
- [ ] **Step 3: Full verification.**

Run: `npm --prefix apps/mobile test` → all suites pass (existing 48 + new roadmap suites).
Run: `npm --prefix apps/mobile run typecheck` → exit 0.
Run: `npm --prefix apps/mobile run lint` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/product/vocabulary.md apps/mobile/AGENTS.md
git commit -m "docs: seven progress states and excluded stances enter the vocabulary"
```

---

## Self-review checklist (run after writing, before executing)

1. Spec coverage — every spec section maps to a task: types (1), graph (2), state/migration (3), explorer ops (4), creator ops (5), fixtures incl. provisional nodes and pro-theory counterweight (6), all seven surface contracts (7–9), vocabulary consequence + verification (10). Atlas-rendering and next-step proposal are spec-deferred.
2. Placeholders — Task 6 Step 1 uses `/* report §N */ ''` markers by design, with an explicit instruction that executed files must contain real transcribed strings; everything else is complete code.
3. Type consistency — `RouteRole`/`RouteEdgeKind`/`ProgressState`/`OpResult`/`GuideEditResult` names match across tasks; selectors import types defined in Tasks 1 and 3.
