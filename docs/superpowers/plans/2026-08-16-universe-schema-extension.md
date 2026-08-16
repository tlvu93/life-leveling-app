# Universe Schema Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (inline execution — the tasks share one type system and the executor holds the approved spec context). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the roadmap catalog with node layout metadata, typed Universe relationships, and a featured Guide per Path, plus two new selectors (`universeView`, `pathTransferView`) and full fixture content for all nine paths.

**Architecture:** Inline metadata on `AtlasNode`; a flat `relationships` list on `RoadmapCatalog`; a new pure validator module `relationships.ts` following the `graph.ts` conventions (never throws, returns typed issues). No `RoadmapState` changes, so no migration. Selectors stay pure `(catalog, state) → ViewModel`.

**Tech Stack:** TypeScript (strict), Vitest. All commands run from the repo root. Test command pattern: `npm --prefix life-leveling-app/apps/mobile test -- <path>`.

**Spec:** `docs/superpowers/specs/2026-08-16-universe-schema-extension-design.md`

**Ordering constraint:** adding required fields to `AtlasNode` breaks typecheck until every fixture node carries them, so Task 2 updates all nine fixture files in one commit. Every other task leaves the repo green on its own.

---

### Task 1: Relationship types and validator

**Files:**
- Modify: `apps/mobile/src/domain/roadmap/catalog.ts`
- Create: `apps/mobile/src/domain/roadmap/relationships.ts`
- Test: `apps/mobile/src/domain/roadmap/relationships.test.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/catalog.ts`

- [ ] **Step 1: Add the relationship types to `catalog.ts`**

Append after the `NodeStance` type:

```ts
export type RelationshipKind = 'dependency' | 'related' | 'bridge';

/**
 * A Universe-level link between two shared Nodes.
 * - `dependency` is directed and reads "to relies on from"; the dependency
 *   subgraph must stay acyclic.
 * - `related` is symmetric and stored once.
 * - `bridge` connects different domains and must explain itself in `note`.
 * Ordering advice is deliberately absent: sequence is Guide opinion, not a
 * property of the shared graph.
 */
export type UniverseRelationship = {
  from: NodeId;
  to: NodeId;
  kind: RelationshipKind;
  note?: string;
};
```

Then add the field to `RoadmapCatalog` (keep the existing fields):

```ts
export type RoadmapCatalog = {
  contentVersion: number;
  nodes: AtlasNode[];
  paths: Path[];
  guides: Guide[];
  relationships: UniverseRelationship[];
};
```

- [ ] **Step 2: Keep the fixture catalog compiling**

In `apps/mobile/src/domain/roadmap/fixtures/catalog.ts`, add `relationships: []` to the exported object, directly after the `guides: [...]` array (Task 4 and Task 5 fill it):

```ts
  relationships: [],
};
```

- [ ] **Step 3: Write the failing validator tests**

Create `apps/mobile/src/domain/roadmap/relationships.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { AtlasNode, RoadmapCatalog, UniverseRelationship } from './catalog';
import { validateCatalog, validateRelationships } from './relationships';

const node = (id: string, domainId: AtlasNode['domainId']): AtlasNode => ({
  id, type: 'skill', title: id, description: '', domainId, clusterId: 'c', depth: 0, size: 'standard',
});
const nodes: AtlasNode[] = [
  node('a', 'music'),
  node('b', 'music'),
  node('c', 'technology'),
];
const rel = (from: string, to: string, kind: UniverseRelationship['kind'], note?: string): UniverseRelationship =>
  ({ from, to, kind, ...(note ? { note } : {}) });

describe('validateRelationships', () => {
  it('accepts a clean set', () => {
    expect(validateRelationships(nodes, [
      rel('a', 'b', 'dependency'),
      rel('a', 'c', 'related'),
      rel('b', 'c', 'bridge', 'rhythm shows up in code'),
    ])).toEqual([]);
  });
  it('rejects missing nodes and self-links', () => {
    expect(validateRelationships(nodes, [rel('a', 'ghost', 'related')]).map((i) => i.code)).toContain('missing-node');
    expect(validateRelationships(nodes, [rel('a', 'a', 'related')]).map((i) => i.code)).toContain('self-link');
  });
  it('rejects duplicates, including related pairs stored in either order', () => {
    expect(validateRelationships(nodes, [rel('a', 'b', 'dependency'), rel('a', 'b', 'dependency')]).map((i) => i.code)).toContain('duplicate');
    expect(validateRelationships(nodes, [rel('a', 'b', 'related'), rel('b', 'a', 'related')]).map((i) => i.code)).toContain('duplicate');
  });
  it('allows the same pair with different kinds', () => {
    expect(validateRelationships(nodes, [rel('a', 'b', 'dependency'), rel('a', 'b', 'related')])).toEqual([]);
  });
  it('rejects dependency cycles but tolerates cycles through other kinds', () => {
    expect(validateRelationships(nodes, [
      rel('a', 'b', 'dependency'), rel('b', 'c', 'dependency'), rel('c', 'a', 'dependency'),
    ]).map((i) => i.code)).toContain('dependency-cycle');
    expect(validateRelationships(nodes, [
      rel('a', 'b', 'dependency'), rel('b', 'a', 'related'),
    ])).toEqual([]);
  });
  it('rejects same-domain bridges and bridges without a note', () => {
    expect(validateRelationships(nodes, [rel('a', 'b', 'bridge', 'same domain')]).map((i) => i.code)).toContain('bridge-same-domain');
    expect(validateRelationships(nodes, [rel('a', 'c', 'bridge')]).map((i) => i.code)).toContain('bridge-missing-note');
    expect(validateRelationships(nodes, [rel('a', 'c', 'bridge', '   ')]).map((i) => i.code)).toContain('bridge-missing-note');
  });
});

describe('validateCatalog', () => {
  const base: RoadmapCatalog = {
    contentVersion: 1,
    nodes,
    paths: [{
      id: 'p1', title: 'P1', status: 'full', interestIds: ['music'],
      overview: { whatItIs: 'x', settings: [], variants: [], realities: [], foundations: 'x' },
      nodeIds: ['a'], neighborPathIds: [],
    }],
    guides: [{
      id: 'g1', version: 1, pathId: 'p1', title: 'G1',
      persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
      steps: [{ id: 's1', nodeId: 'a', role: 'required', note: '', sortKey: 0 }],
      edges: [], stances: [], rationale: '',
    }],
    relationships: [],
  };
  it('accepts a catalog whose featured guide belongs to its path', () => {
    expect(validateCatalog({ ...base, paths: [{ ...base.paths[0], featuredGuideId: 'g1' }] })).toEqual([]);
  });
  it('rejects a featured guide that is missing or belongs to another path', () => {
    expect(validateCatalog({ ...base, paths: [{ ...base.paths[0], featuredGuideId: 'ghost' }] }).map((i) => i.code))
      .toContain('missing-featured-guide');
    const twoPaths = {
      ...base,
      paths: [
        { ...base.paths[0], featuredGuideId: 'g1' },
        { ...base.paths[0], id: 'p2', featuredGuideId: 'g1' },
      ],
    };
    expect(validateCatalog(twoPaths).map((i) => i.code)).toContain('missing-featured-guide');
  });
  it('surfaces relationship issues too', () => {
    expect(validateCatalog({ ...base, relationships: [rel('a', 'ghost', 'related')] }).map((i) => i.code))
      .toContain('missing-node');
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/relationships.test.ts`
Expected: FAIL — module `./relationships` not found.

- [ ] **Step 5: Write `relationships.ts`**

```ts
import type { AtlasNode, RoadmapCatalog, UniverseRelationship } from './catalog';
import type { NodeId, PathId } from './ids';

export type RelationshipIssueCode =
  | 'missing-node' | 'self-link' | 'duplicate' | 'dependency-cycle'
  | 'bridge-same-domain' | 'bridge-missing-note' | 'missing-featured-guide';

export type RelationshipIssue = {
  code: RelationshipIssueCode;
  from?: NodeId;
  to?: NodeId;
  pathId?: PathId;
  message: string;
};

/** Symmetric kinds are keyed on the unordered pair so either storage order collides. */
function dedupeKey(rel: UniverseRelationship): string {
  if (rel.kind === 'related' || rel.kind === 'bridge') {
    const [x, y] = rel.from < rel.to ? [rel.from, rel.to] : [rel.to, rel.from];
    return `${rel.kind}|${x}|${y}`;
  }
  return `${rel.kind}|${rel.from}|${rel.to}`;
}

function hasDependencyCycle(relationships: readonly UniverseRelationship[]): boolean {
  const deps = relationships.filter((r) => r.kind === 'dependency' && r.from !== r.to);
  const ids = new Set<string>();
  for (const r of deps) { ids.add(r.from); ids.add(r.to); }
  const incoming = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const id of ids) incoming.set(id, 0);
  const seen = new Set<string>();
  for (const r of deps) {
    const key = `${r.from}|${r.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    incoming.set(r.to, (incoming.get(r.to) ?? 0) + 1);
    out.set(r.from, [...(out.get(r.from) ?? []), r.to]);
  }
  const ready = [...ids].filter((id) => (incoming.get(id) ?? 0) === 0);
  let visited = 0;
  while (ready.length > 0) {
    const id = ready.shift() as string;
    visited += 1;
    for (const to of out.get(id) ?? []) {
      const left = (incoming.get(to) ?? 0) - 1;
      incoming.set(to, left);
      if (left === 0) ready.push(to);
    }
  }
  return visited < ids.size;
}

export function validateRelationships(
  nodes: readonly AtlasNode[],
  relationships: readonly UniverseRelationship[],
): RelationshipIssue[] {
  const issues: RelationshipIssue[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  for (const rel of relationships) {
    const from = byId.get(rel.from);
    const to = byId.get(rel.to);
    if (!from || !to) {
      issues.push({ code: 'missing-node', from: rel.from, to: rel.to, message: `Relationship ${rel.from} -> ${rel.to} references a node that is not in the catalog.` });
      continue;
    }
    if (rel.from === rel.to) {
      issues.push({ code: 'self-link', from: rel.from, to: rel.to, message: `Node "${rel.from}" cannot link to itself.` });
      continue;
    }
    const key = dedupeKey(rel);
    if (seen.has(key)) {
      issues.push({ code: 'duplicate', from: rel.from, to: rel.to, message: `Duplicate ${rel.kind} relationship between "${rel.from}" and "${rel.to}".` });
    }
    seen.add(key);
    if (rel.kind === 'bridge') {
      if (from.domainId === to.domainId) {
        issues.push({ code: 'bridge-same-domain', from: rel.from, to: rel.to, message: `Bridge ${rel.from} -> ${rel.to} stays inside "${from.domainId}"; a bridge must cross domains.` });
      }
      if (!rel.note?.trim()) {
        issues.push({ code: 'bridge-missing-note', from: rel.from, to: rel.to, message: `Bridge ${rel.from} -> ${rel.to} needs a note explaining the crossing.` });
      }
    }
  }
  if (hasDependencyCycle(relationships)) {
    issues.push({ code: 'dependency-cycle', message: 'The dependency relationships contain a cycle.' });
  }
  return issues;
}

/** Relationship rules plus the catalog-level featured-guide rule. */
export function validateCatalog(catalog: RoadmapCatalog): RelationshipIssue[] {
  const issues = validateRelationships(catalog.nodes, catalog.relationships);
  for (const path of catalog.paths) {
    if (path.featuredGuideId === undefined) continue;
    const guide = catalog.guides.find((g) => g.id === path.featuredGuideId);
    if (!guide || guide.pathId !== path.id) {
      issues.push({ code: 'missing-featured-guide', pathId: path.id, message: `Path "${path.id}" features guide "${path.featuredGuideId}", which does not exist on this Path.` });
    }
  }
  return issues;
}
```

- [ ] **Step 6: Run the tests**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/relationships.test.ts`
Expected: FAIL — `AtlasNode` has no `domainId`/`clusterId`/`depth`/`size` and `Path` has no `featuredGuideId` yet. This is expected; Task 2 and Task 3 add them. Do NOT fix by weakening the test.

- [ ] **Step 7: Add the remaining type fields so Task 1 compiles**

In `catalog.ts`, add `NodeSize` and the four layout fields to `AtlasNode`, and `featuredGuideId` to `Path`:

```ts
export type NodeSize = 'major' | 'standard' | 'minor';

export type AtlasNode = {
  id: NodeId;
  type: NodeType;
  title: string;
  description: string;
  domainId: InterestId;
  clusterId: string;
  depth: 0 | 1 | 2 | 3;
  size: NodeSize;
  provisional?: { scopeGuideId: GuideId };
};
```

In `Path`, add after `interestIds`:

```ts
  featuredGuideId?: GuideId;
```

- [ ] **Step 8: Run the relationship tests again**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/relationships.test.ts`
Expected: PASS (11 assertions across 8 tests). Repo-wide typecheck still fails because fixtures lack the new node fields — Task 2 fixes that.

- [ ] **Step 9: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/catalog.ts apps/mobile/src/domain/roadmap/relationships.ts apps/mobile/src/domain/roadmap/relationships.test.ts apps/mobile/src/domain/roadmap/fixtures/catalog.ts
git -C life-leveling-app commit -m "feat(roadmap): universe relationship types and validator"
```

---

### Task 2: Layout metadata on every fixture node

**Files:**
- Modify: `apps/mobile/src/domain/roadmap/fixtures/djvj/nodes.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/event-tech.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/creative-coding.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/projection-mapping.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/music-production.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/bouldering.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/japanese.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/woodworking.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/stubs/ux-design.ts`

Add `domainId`, `clusterId`, `depth`, and `size` to every node object, keeping `id`, `type`, `title`, `description`, and any `provisional` field unchanged. Insert the four fields after `description`.

- [ ] **Step 1: DJ/VJ nodes** — apply these exact values in `fixtures/djvj/nodes.ts`:

| node id | domainId | clusterId | depth | size |
|---|---|---|---|---|
| `rhythm-song-structure` | `music` | `djvj` | 0 | `major` |
| `music-selection-library` | `music` | `djvj` | 1 | `standard` |
| `music-theory-fundamentals` | `music` | `djvj` | 2 | `standard` |
| `playing-an-instrument` | `music` | `djvj` | 2 | `standard` |
| `harmonic-mixing` | `music` | `djvj` | 2 | `standard` |
| `mixing-technique` | `music` | `djvj` | 1 | `major` |
| `signal-flow-rig-setup` | `technology` | `djvj` | 0 | `major` |
| `gear-access-practice-setup` | `technology` | `djvj` | 0 | `standard` |
| `visual-composition` | `design` | `djvj` | 0 | `major` |
| `visual-content-library` | `design` | `djvj` | 1 | `standard` |
| `reactive-visuals` | `technology` | `djvj` | 2 | `major` |
| `projection-display-basics` | `technology` | `djvj` | 2 | `standard` |
| `live-control-surfaces` | `technology` | `djvj` | 1 | `standard` |
| `club-media-player-workflow` | `technology` | `djvj` | 2 | `standard` |
| `observing-a-live-set` | `music` | `djvj` | 0 | `minor` |
| `private-one-track-experiment` | `music` | `djvj` | 1 | `minor` |
| `ten-minute-av-set` | `music` | `djvj` | 3 | `major` |
| `open-decks-etiquette` | `music` | `djvj` | 1 | `minor` |
| `tap-tempo-drill` | `technology` | `djvj` | 1 | `minor` |

Example of the shape after editing one node:

```ts
  { id: 'rhythm-song-structure', type: 'foundation', title: 'Rhythm & Song Structure', description: 'Beats, bars, 16/32-bar phrases, intros, breakdowns, and drops — and why transitions land at phrase boundaries. The one piece of "theory" every source agrees on, for DJs and VJs alike.', domainId: 'music', clusterId: 'djvj', depth: 0, size: 'major' },
```

- [ ] **Step 2: Stub nodes** — apply these exact values in the matching stub files:

| node id | file | domainId | clusterId | depth | size |
|---|---|---|---|---|---|
| `live-sound-basics` | event-tech | `technology` | `event-technology` | 1 | `standard` |
| `stage-lighting-dmx` | event-tech | `technology` | `event-technology` | 1 | `standard` |
| `stagehand-apprenticeship` | event-tech | `technology` | `event-technology` | 0 | `major` |
| `show-call` | event-tech | `technology` | `event-technology` | 3 | `major` |
| `live-coding-patterns` | creative-coding | `technology` | `creative-coding-music` | 1 | `major` |
| `browser-video-synthesis` | creative-coding | `technology` | `creative-coding-music` | 2 | `standard` |
| `algorave-set` | creative-coding | `music` | `creative-coding-music` | 3 | `major` |
| `surface-mapping` | projection-mapping | `design` | `projection-mapping` | 1 | `major` |
| `site-survey` | projection-mapping | `design` | `projection-mapping` | 1 | `minor` |
| `mapped-installation` | projection-mapping | `design` | `projection-mapping` | 3 | `major` |
| `daw-fluency` | music-production | `music` | `music-production` | 0 | `major` |
| `arrangement` | music-production | `music` | `music-production` | 1 | `standard` |
| `finished-track` | music-production | `music` | `music-production` | 3 | `major` |
| `movement-fundamentals` | bouldering | `movement` | `bouldering` | 0 | `major` |
| `gym-access` | bouldering | `movement` | `bouldering` | 0 | `standard` |
| `falling-safely` | bouldering | `movement` | `bouldering` | 0 | `standard` |
| `reading-problems` | bouldering | `movement` | `bouldering` | 1 | `standard` |
| `outdoor-session` | bouldering | `movement` | `bouldering` | 2 | `major` |
| `kana` | japanese | `language` | `learning-japanese` | 0 | `standard` |
| `core-grammar` | japanese | `language` | `learning-japanese` | 0 | `major` |
| `immersion-listening` | japanese | `language` | `learning-japanese` | 1 | `standard` |
| `speaking-practice` | japanese | `language` | `learning-japanese` | 2 | `standard` |
| `first-conversation` | japanese | `language` | `learning-japanese` | 3 | `major` |
| `tool-safety` | woodworking | `making` | `woodworking` | 0 | `standard` |
| `workshop-access` | woodworking | `making` | `woodworking` | 0 | `standard` |
| `joinery-basics` | woodworking | `making` | `woodworking` | 1 | `major` |
| `first-box` | woodworking | `making` | `woodworking` | 2 | `standard` |
| `finished-piece` | woodworking | `making` | `woodworking` | 3 | `major` |
| `design-fundamentals` | ux-design | `design` | `ux-design` | 0 | `major` |
| `research-basics` | ux-design | `design` | `ux-design` | 1 | `standard` |
| `portfolio-case-study` | ux-design | `design` | `ux-design` | 2 | `major` |
| `critique-session` | ux-design | `design` | `ux-design` | 2 | `minor` |
| `first-client-or-role` | ux-design | `design` | `ux-design` | 3 | `major` |

- [ ] **Step 3: Typecheck**

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck`
Expected: exit 0. Any error naming a node object means that node still lacks the four fields.

- [ ] **Step 4: Run the whole suite**

Run: `npm --prefix life-leveling-app/apps/mobile test`
Expected: all suites pass (existing tests do not read the new fields).

- [ ] **Step 5: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/fixtures
git -C life-leveling-app commit -m "feat(roadmap): layout metadata on every universe node"
```

---

### Task 3: Featured guides on every path

**Files:**
- Modify: `apps/mobile/src/domain/roadmap/fixtures/djvj/path.ts`
- Modify: the eight stub files (each exports a `Path`)
- Test: `apps/mobile/src/domain/roadmap/fixtures/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `fixtures/catalog.test.ts` inside the existing top-level `describe('roadmap catalog fixtures', ...)`:

```ts
  it('every path features a guide that belongs to it', () => {
    for (const path of roadmapCatalog.paths) {
      const featured = roadmapCatalog.guides.find((g) => g.id === path.featuredGuideId);
      expect({ path: path.id, ok: Boolean(featured) && featured?.pathId === path.id })
        .toEqual({ path: path.id, ok: true });
    }
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: FAIL — `ok: false`, no path declares `featuredGuideId`.

- [ ] **Step 3: Add `featuredGuideId` to each Path**

Insert the field directly after `interestIds` in each path object:

| path file | path id | line to add |
|---|---|---|
| `djvj/path.ts` | `djvj` | `featuredGuideId: 'guide-club-first',` |
| `stubs/event-tech.ts` | `event-technology` | `featuredGuideId: 'guide-stagehand-route',` |
| `stubs/creative-coding.ts` | `creative-coding-music` | `featuredGuideId: 'guide-browser-first',` |
| `stubs/projection-mapping.ts` | `projection-mapping` | `featuredGuideId: 'guide-home-mapping-first',` |
| `stubs/music-production.ts` | `music-production` | `featuredGuideId: 'guide-daw-first',` |
| `stubs/bouldering.ts` | `bouldering` | `featuredGuideId: 'guide-gym-first-bouldering',` |
| `stubs/japanese.ts` | `learning-japanese` | `featuredGuideId: 'guide-immersion-first',` |
| `stubs/woodworking.ts` | `woodworking` | `featuredGuideId: 'guide-community-workshop',` |
| `stubs/ux-design.ts` | `ux-design` | `featuredGuideId: 'guide-portfolio-first',` |

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/fixtures
git -C life-leveling-app commit -m "feat(roadmap): featured guide per path"
```

---

### Task 4: DJ/VJ relationships

**Files:**
- Create: `apps/mobile/src/domain/roadmap/fixtures/djvj/relationships.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/catalog.ts`
- Test: `apps/mobile/src/domain/roadmap/fixtures/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `fixtures/catalog.test.ts`:

```ts
  it('the catalog passes relationship and featured-guide validation', () => {
    expect(validateCatalog(roadmapCatalog)).toEqual([]);
  });
  it('DJ/VJ bridges reach all four neighbour paths', () => {
    const djvjNodeIds = new Set(roadmapCatalog.paths.find((p) => p.id === 'djvj')?.nodeIds ?? []);
    const clusterOf = (id: string) => roadmapCatalog.nodes.find((n) => n.id === id)?.clusterId;
    const reached = new Set(
      roadmapCatalog.relationships
        .filter((r) => r.kind === 'bridge')
        .flatMap((r) => {
          if (djvjNodeIds.has(r.from) && !djvjNodeIds.has(r.to)) return [clusterOf(r.to)];
          if (djvjNodeIds.has(r.to) && !djvjNodeIds.has(r.from)) return [clusterOf(r.from)];
          return [];
        })
        .filter((c): c is string => Boolean(c)),
    );
    for (const neighbour of ['music-production', 'creative-coding-music', 'projection-mapping', 'event-technology']) {
      expect({ neighbour, reached: reached.has(neighbour) }).toEqual({ neighbour, reached: true });
    }
  });
```

Add the import at the top of the file:

```ts
import { validateCatalog } from '../relationships';
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: FAIL — no bridges exist yet (`reached: false`).

- [ ] **Step 3: Create `fixtures/djvj/relationships.ts`**

```ts
import type { UniverseRelationship } from '../../catalog';

// Dependency reads "to relies on from". Ordering advice stays in Guides.
export const djvjRelationships: UniverseRelationship[] = [
  // Inside the DJ/VJ constellation
  { from: 'rhythm-song-structure', to: 'mixing-technique', kind: 'dependency' },
  { from: 'rhythm-song-structure', to: 'reactive-visuals', kind: 'dependency' },
  { from: 'music-selection-library', to: 'mixing-technique', kind: 'dependency' },
  { from: 'gear-access-practice-setup', to: 'mixing-technique', kind: 'dependency' },
  { from: 'mixing-technique', to: 'club-media-player-workflow', kind: 'dependency' },
  { from: 'mixing-technique', to: 'ten-minute-av-set', kind: 'dependency' },
  { from: 'visual-composition', to: 'visual-content-library', kind: 'dependency' },
  { from: 'visual-content-library', to: 'reactive-visuals', kind: 'dependency' },
  { from: 'reactive-visuals', to: 'ten-minute-av-set', kind: 'dependency' },
  { from: 'signal-flow-rig-setup', to: 'projection-display-basics', kind: 'dependency' },
  { from: 'signal-flow-rig-setup', to: 'live-control-surfaces', kind: 'dependency' },
  { from: 'private-one-track-experiment', to: 'ten-minute-av-set', kind: 'dependency' },

  { from: 'harmonic-mixing', to: 'music-theory-fundamentals', kind: 'related' },
  { from: 'playing-an-instrument', to: 'music-theory-fundamentals', kind: 'related' },
  { from: 'observing-a-live-set', to: 'mixing-technique', kind: 'related' },
  { from: 'live-control-surfaces', to: 'reactive-visuals', kind: 'related' },

  // Bridges out of the constellation, one per neighbouring path
  {
    from: 'rhythm-song-structure', to: 'live-coding-patterns', kind: 'bridge',
    note: 'Live-coded patterns are cyclic too — phrase counting transfers straight from the booth to the editor.',
  },
  {
    from: 'projection-display-basics', to: 'surface-mapping', kind: 'bridge',
    note: 'Outputs, resolutions, and handshakes are the shared floor; mapping adds the geometry of a real surface.',
  },
  {
    from: 'mixing-technique', to: 'live-sound-basics', kind: 'bridge',
    note: 'Mixing a room and mixing a set share the same gain-staging instincts, one night at a time.',
  },
  {
    from: 'signal-flow-rig-setup', to: 'daw-fluency', kind: 'bridge',
    note: 'Signal flow is the same idea in a studio as in a booth — sources, buses, and where the level actually lives.',
  },
];
```

- [ ] **Step 4: Wire it into the catalog**

In `fixtures/catalog.ts`, add the import and replace `relationships: []`:

```ts
import { djvjRelationships } from './djvj/relationships';
```

```ts
  relationships: [...djvjRelationships],
```

- [ ] **Step 5: Run the fixture tests**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/fixtures
git -C life-leveling-app commit -m "feat(roadmap): DJ/VJ universe relationships with neighbour bridges"
```

---

### Task 5: Stub relationships

**Files:**
- Create: `apps/mobile/src/domain/roadmap/fixtures/stubs/relationships.ts`
- Modify: `apps/mobile/src/domain/roadmap/fixtures/catalog.ts`
- Test: `apps/mobile/src/domain/roadmap/fixtures/catalog.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `fixtures/catalog.test.ts`:

```ts
  it('every path is touched by at least one bridge', () => {
    const clusterOf = (id: string) => roadmapCatalog.nodes.find((n) => n.id === id)?.clusterId;
    const bridged = new Set(
      roadmapCatalog.relationships
        .filter((r) => r.kind === 'bridge')
        .flatMap((r) => [clusterOf(r.from), clusterOf(r.to)])
        .filter((c): c is string => Boolean(c)),
    );
    for (const path of roadmapCatalog.paths) {
      expect({ path: path.id, bridged: bridged.has(path.id) }).toEqual({ path: path.id, bridged: true });
    }
  });
  it('every path has an internal dependency spine', () => {
    const clusterOf = (id: string) => roadmapCatalog.nodes.find((n) => n.id === id)?.clusterId;
    for (const path of roadmapCatalog.paths) {
      const internal = roadmapCatalog.relationships.filter(
        (r) => r.kind === 'dependency' && clusterOf(r.from) === path.id && clusterOf(r.to) === path.id,
      );
      expect({ path: path.id, hasSpine: internal.length >= 2 }).toEqual({ path: path.id, hasSpine: true });
    }
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: FAIL — stub paths are neither bridged nor spined.

- [ ] **Step 3: Create `fixtures/stubs/relationships.ts`**

```ts
import type { UniverseRelationship } from '../../catalog';

// Stub-depth relationships: an internal dependency spine per path, a related
// link where one is honest, and at least one cross-domain bridge. Bridges are
// authored for sense, never for quota.
export const stubRelationships: UniverseRelationship[] = [
  // Event Technology
  { from: 'stagehand-apprenticeship', to: 'live-sound-basics', kind: 'dependency' },
  { from: 'stagehand-apprenticeship', to: 'stage-lighting-dmx', kind: 'dependency' },
  { from: 'live-sound-basics', to: 'show-call', kind: 'dependency' },
  { from: 'stage-lighting-dmx', to: 'show-call', kind: 'dependency' },
  { from: 'live-sound-basics', to: 'stage-lighting-dmx', kind: 'related' },

  // Creative Coding for Music
  { from: 'live-coding-patterns', to: 'browser-video-synthesis', kind: 'dependency' },
  { from: 'live-coding-patterns', to: 'algorave-set', kind: 'dependency' },
  { from: 'browser-video-synthesis', to: 'algorave-set', kind: 'dependency' },
  { from: 'browser-video-synthesis', to: 'reactive-visuals', kind: 'related' },

  // Projection Mapping
  { from: 'surface-mapping', to: 'mapped-installation', kind: 'dependency' },
  { from: 'site-survey', to: 'mapped-installation', kind: 'dependency' },
  { from: 'site-survey', to: 'surface-mapping', kind: 'related' },

  // Music Production
  { from: 'daw-fluency', to: 'arrangement', kind: 'dependency' },
  { from: 'arrangement', to: 'finished-track', kind: 'dependency' },
  { from: 'daw-fluency', to: 'finished-track', kind: 'dependency' },

  // Bouldering
  { from: 'gym-access', to: 'falling-safely', kind: 'dependency' },
  { from: 'falling-safely', to: 'movement-fundamentals', kind: 'dependency' },
  { from: 'movement-fundamentals', to: 'reading-problems', kind: 'dependency' },
  { from: 'reading-problems', to: 'outdoor-session', kind: 'dependency' },
  {
    from: 'movement-fundamentals', to: 'playing-an-instrument', kind: 'bridge',
    note: 'Both are embodied practices: coordination, tension, and useful repetition under fatigue.',
  },

  // Learning Japanese
  { from: 'kana', to: 'core-grammar', kind: 'dependency' },
  { from: 'core-grammar', to: 'immersion-listening', kind: 'dependency' },
  { from: 'immersion-listening', to: 'speaking-practice', kind: 'dependency' },
  { from: 'speaking-practice', to: 'first-conversation', kind: 'dependency' },
  {
    from: 'immersion-listening', to: 'observing-a-live-set', kind: 'bridge',
    note: 'Deliberate input before output: attending closely to what fluent people do is the same discipline in both crafts.',
  },

  // Woodworking
  { from: 'tool-safety', to: 'joinery-basics', kind: 'dependency' },
  { from: 'workshop-access', to: 'joinery-basics', kind: 'dependency' },
  { from: 'joinery-basics', to: 'first-box', kind: 'dependency' },
  { from: 'first-box', to: 'finished-piece', kind: 'dependency' },
  {
    from: 'workshop-access', to: 'gear-access-practice-setup', kind: 'bridge',
    note: 'Access to shared equipment — not talent or tools you own — is the real gate at the start of both crafts.',
  },

  // UX Design
  { from: 'design-fundamentals', to: 'research-basics', kind: 'dependency' },
  { from: 'research-basics', to: 'portfolio-case-study', kind: 'dependency' },
  { from: 'portfolio-case-study', to: 'first-client-or-role', kind: 'dependency' },
  { from: 'portfolio-case-study', to: 'critique-session', kind: 'related' },
  {
    from: 'portfolio-case-study', to: 'finished-track', kind: 'bridge',
    note: 'Both crafts are judged on finished, documented work rather than hours spent practising.',
  },
];
```

- [ ] **Step 4: Wire it into the catalog**

In `fixtures/catalog.ts`:

```ts
import { stubRelationships } from './stubs/relationships';
```

```ts
  relationships: [...djvjRelationships, ...stubRelationships],
```

- [ ] **Step 5: Bump `contentVersion` to 2** in `fixtures/catalog.ts`.

- [ ] **Step 6: Run the fixture tests**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: PASS. If `bridge-same-domain` appears, the two endpoints share a `domainId` — fix the fixture, never the validator.

- [ ] **Step 7: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/fixtures
git -C life-leveling-app commit -m "feat(roadmap): stub-path relationships and cross-domain bridges"
```

---

### Task 6: `universeView` selector

**Files:**
- Create: `apps/mobile/src/domain/roadmap/selectors/universe.ts`
- Test: `apps/mobile/src/domain/roadmap/selectors/universe.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { adoptGuide, setProgress } from '../ops';
import { defaultRoadmapState, type RoadmapState } from '../state';
import { strongestState, universeView } from './universe';

const seq = () => { let n = 0; return () => `id-${n++}`; };

function adopted(): RoadmapState {
  return adoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', seq(), 't0').state;
}

describe('strongestState', () => {
  it('ranks active states above resting ones', () => {
    expect(strongestState(['tried', 'demonstrated'])).toBe('demonstrated');
    expect(strongestState(['interested', 'practicing'])).toBe('practicing');
    expect(strongestState(['paused', 'tried'])).toBe('tried');
  });
  it('falls back to resting states only when nothing active exists', () => {
    expect(strongestState(['paused', 'skipped', 'not-for-me'])).toBe('paused');
    expect(strongestState(['skipped', 'not-for-me'])).toBe('skipped');
    expect(strongestState([])).toBeNull();
  });
});

describe('universeView', () => {
  it('returns every shared node with layout, and excludes provisional nodes', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    expect(vm.nodes.some((n) => n.id === 'rhythm-song-structure')).toBe(true);
    expect(vm.nodes.some((n) => n.id === 'open-decks-etiquette')).toBe(false);
    const rhythm = vm.nodes.find((n) => n.id === 'rhythm-song-structure');
    expect(rhythm).toMatchObject({ domainId: 'music', clusterId: 'djvj', depth: 0, size: 'major', progressState: null });
  });
  it('lists only domains that have nodes, with labels', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    const ids = vm.domains.map((d) => d.id).sort();
    expect(ids).toEqual(['design', 'language', 'making', 'movement', 'music', 'technology']);
    expect(vm.domains.find((d) => d.id === 'music')?.label).toBe('Music');
  });
  it('overlays the strongest progress state per node across journeys', () => {
    let s = adopted();
    const rhythmStep = s.builds[0].steps.find((x) => x.nodeId === 'rhythm-song-structure');
    s = setProgress(s, rhythmStep?.id ?? '', { state: 'practicing', updatedAt: 't1', artifactIds: [] }).state;
    const vm = universeView(roadmapCatalog, s);
    expect(vm.nodes.find((n) => n.id === 'rhythm-song-structure')?.progressState).toBe('practicing');
    expect(vm.nodes.find((n) => n.id === 'mixing-technique')?.progressState).toBeNull();
  });
  it('drops relationships that touch an excluded node', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    const visible = new Set(vm.nodes.map((n) => n.id));
    for (const rel of vm.relationships) {
      expect({ rel: `${rel.from}->${rel.to}`, ok: visible.has(rel.from) && visible.has(rel.to) })
        .toEqual({ rel: `${rel.from}->${rel.to}`, ok: true });
    }
  });
  it('summarises paths including their featured guide', () => {
    const vm = universeView(roadmapCatalog, defaultRoadmapState);
    expect(vm.paths).toHaveLength(9);
    expect(vm.paths.find((p) => p.id === 'djvj')).toEqual({
      id: 'djvj', title: 'DJ/VJ and Live Audiovisual Performance', status: 'full', featuredGuideId: 'guide-club-first',
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/selectors/universe.test.ts`
Expected: FAIL — module `./universe` not found.

- [ ] **Step 3: Write `selectors/universe.ts`**

```ts
import type { NodeSize, NodeType, RoadmapCatalog, UniverseRelationship } from '../catalog';
import type { GuideId, InterestId, NodeId, PathId } from '../ids';
import { interestLabels } from '../ids';
import type { ProgressState, RoadmapState } from '../state';

export type UniverseNodeVm = {
  id: NodeId;
  title: string;
  type: NodeType;
  domainId: InterestId;
  clusterId: string;
  depth: 0 | 1 | 2 | 3;
  size: NodeSize;
  progressState: ProgressState | null;
};

export type UniversePathVm = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  featuredGuideId: GuideId | null;
};

export type UniverseVm = {
  domains: { id: InterestId; label: string }[];
  nodes: UniverseNodeVm[];
  relationships: UniverseRelationship[];
  paths: UniversePathVm[];
};

/**
 * Active engagement outranks resting states, so a node the person practises in
 * one Journey never reads as "skipped" because another Journey dropped it.
 */
const activeRank: readonly ProgressState[] = ['demonstrated', 'practicing', 'tried', 'interested'];
const restingRank: readonly ProgressState[] = ['paused', 'skipped', 'not-for-me'];

export function strongestState(states: readonly ProgressState[]): ProgressState | null {
  for (const candidate of activeRank) if (states.includes(candidate)) return candidate;
  for (const candidate of restingRank) if (states.includes(candidate)) return candidate;
  return null;
}

export function universeView(catalog: RoadmapCatalog, state: RoadmapState): UniverseVm {
  const statesByNode = new Map<NodeId, ProgressState[]>();
  for (const build of state.builds) {
    for (const step of build.steps) {
      const entry = state.progress[step.id];
      if (!entry) continue;
      statesByNode.set(step.nodeId, [...(statesByNode.get(step.nodeId) ?? []), entry.state]);
    }
  }

  const nodes: UniverseNodeVm[] = catalog.nodes
    .filter((n) => !n.provisional)
    .map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      domainId: n.domainId,
      clusterId: n.clusterId,
      depth: n.depth,
      size: n.size,
      progressState: strongestState(statesByNode.get(n.id) ?? []),
    }));

  const visible = new Set(nodes.map((n) => n.id));
  const domainIds = Array.from(new Set(nodes.map((n) => n.domainId))).sort();

  return {
    domains: domainIds.map((id) => ({ id, label: interestLabels[id] })),
    nodes,
    relationships: catalog.relationships.filter((r) => visible.has(r.from) && visible.has(r.to)),
    paths: catalog.paths.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      featuredGuideId: p.featuredGuideId ?? null,
    })),
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/selectors/universe.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/selectors/universe.ts apps/mobile/src/domain/roadmap/selectors/universe.test.ts
git -C life-leveling-app commit -m "feat(roadmap): universeView selector with progress overlay"
```

---

### Task 7: `pathTransferView` selector

**Files:**
- Create: `apps/mobile/src/domain/roadmap/selectors/path-transfer.ts`
- Test: `apps/mobile/src/domain/roadmap/selectors/path-transfer.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { adoptGuide, setProgress } from '../ops';
import { defaultRoadmapState, type RoadmapState } from '../state';
import { pathTransferView } from './path-transfer';

const seq = () => { let n = 0; return () => `id-${n++}`; };

function withStates(pairs: [nodeId: string, state: Parameters<typeof setProgress>[2]['state']][]): RoadmapState {
  let s = adoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', seq(), 't0').state;
  for (const [nodeId, state] of pairs) {
    const step = s.builds[0].steps.find((x) => x.nodeId === nodeId);
    s = setProgress(s, step?.id ?? '', { state, updatedAt: 't1', artifactIds: [] }).state;
  }
  return s;
}

describe('pathTransferView', () => {
  it('returns null for an unknown path', () => {
    expect(pathTransferView(roadmapCatalog, defaultRoadmapState, 'ghost')).toBeNull();
  });
  it('counts nothing when no progress exists', () => {
    const vm = pathTransferView(roadmapCatalog, defaultRoadmapState, 'djvj');
    expect(vm?.applyCount).toBe(0);
    expect(vm?.applies).toEqual([]);
    expect(vm?.totalNodes).toBe(17);
  });
  it('counts tried, practicing, and demonstrated but not resting states', () => {
    const s = withStates([
      ['rhythm-song-structure', 'demonstrated'],
      ['mixing-technique', 'practicing'],
      ['music-selection-library', 'tried'],
      ['harmonic-mixing', 'interested'],
      ['club-media-player-workflow', 'skipped'],
      ['observing-a-live-set', 'not-for-me'],
      ['live-control-surfaces', 'paused'],
    ]);
    const vm = pathTransferView(roadmapCatalog, s, 'djvj');
    expect(vm?.applies.map((a) => a.nodeId).sort()).toEqual(['mixing-technique', 'music-selection-library', 'rhythm-song-structure']);
    expect(vm?.applyCount).toBe(3);
    expect(vm?.applies.find((a) => a.nodeId === 'rhythm-song-structure')).toEqual({
      nodeId: 'rhythm-song-structure', title: 'Rhythm & Song Structure', state: 'demonstrated',
    });
  });
  it('carries progress into a different path that shares nodes', () => {
    const s = withStates([['rhythm-song-structure', 'practicing']]);
    const vm = pathTransferView(roadmapCatalog, s, 'creative-coding-music');
    expect(vm?.applyCount).toBe(1);
    expect(vm?.applies[0].nodeId).toBe('rhythm-song-structure');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/selectors/path-transfer.test.ts`
Expected: FAIL — module `./path-transfer` not found.

- [ ] **Step 3: Write `selectors/path-transfer.ts`**

```ts
import type { RoadmapCatalog } from '../catalog';
import type { NodeId, PathId } from '../ids';
import type { ProgressState, RoadmapState } from '../state';
import { strongestState } from './universe';

/** Only hands-on engagement transfers; resting states do not claim relevance. */
const transferring: readonly ProgressState[] = ['tried', 'practicing', 'demonstrated'];

export type PathTransferVm = {
  pathId: PathId;
  pathTitle: string;
  applies: { nodeId: NodeId; title: string; state: ProgressState }[];
  applyCount: number;
  /** Path size, so a UI variant can derive a percentage for A-008 session testing. */
  totalNodes: number;
};

export function pathTransferView(catalog: RoadmapCatalog, state: RoadmapState, pathId: PathId): PathTransferVm | null {
  const path = catalog.paths.find((p) => p.id === pathId);
  if (!path) return null;

  const statesByNode = new Map<NodeId, ProgressState[]>();
  for (const build of state.builds) {
    for (const step of build.steps) {
      const entry = state.progress[step.id];
      if (!entry) continue;
      statesByNode.set(step.nodeId, [...(statesByNode.get(step.nodeId) ?? []), entry.state]);
    }
  }

  const applies = path.nodeIds.flatMap((nodeId) => {
    const best = strongestState(statesByNode.get(nodeId) ?? []);
    if (!best || !transferring.includes(best)) return [];
    return [{ nodeId, title: catalog.nodes.find((n) => n.id === nodeId)?.title ?? nodeId, state: best }];
  });

  return { pathId: path.id, pathTitle: path.title, applies, applyCount: applies.length, totalNodes: path.nodeIds.length };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/selectors/path-transfer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/selectors/path-transfer.ts apps/mobile/src/domain/roadmap/selectors/path-transfer.test.ts
git -C life-leveling-app commit -m "feat(roadmap): pathTransferView for what-already-applies counts"
```

---

### Task 8: Fixture integrity and full verification

**Files:**
- Modify: `apps/mobile/src/domain/roadmap/fixtures/catalog.test.ts`

- [ ] **Step 1: Add the remaining fixture-integrity tests**

```ts
  it('every node carries usable layout metadata', () => {
    for (const node of roadmapCatalog.nodes) {
      expect({
        node: node.id,
        ok: node.clusterId.length > 0 && node.depth >= 0 && node.depth <= 3,
      }).toEqual({ node: node.id, ok: true });
    }
  });
  it('every bridge explains itself', () => {
    for (const rel of roadmapCatalog.relationships.filter((r) => r.kind === 'bridge')) {
      expect({ rel: `${rel.from}->${rel.to}`, explained: Boolean(rel.note?.trim()) })
        .toEqual({ rel: `${rel.from}->${rel.to}`, explained: true });
    }
  });
  it('no relationship references a provisional node', () => {
    const provisional = new Set(roadmapCatalog.nodes.filter((n) => n.provisional).map((n) => n.id));
    for (const rel of roadmapCatalog.relationships) {
      expect({ rel: `${rel.from}->${rel.to}`, clean: !provisional.has(rel.from) && !provisional.has(rel.to) })
        .toEqual({ rel: `${rel.from}->${rel.to}`, clean: true });
    }
  });
  it('declares content version 2', () => {
    expect(roadmapCatalog.contentVersion).toBe(2);
  });
```

- [ ] **Step 2: Run the fixture tests**

Run: `npm --prefix life-leveling-app/apps/mobile test -- src/domain/roadmap/fixtures/catalog.test.ts`
Expected: PASS.

- [ ] **Step 3: Full verification**

Run: `npm --prefix life-leveling-app/apps/mobile test`
Expected: every suite passes (115 existing plus the new relationship, universe, path-transfer, and fixture tests).

Run: `npm --prefix life-leveling-app/apps/mobile run typecheck`
Expected: exit 0.

Run: `npm --prefix life-leveling-app/apps/mobile run lint`
Expected: exit 0.

- [ ] **Step 4: Update the spec status line**

In `docs/superpowers/specs/2026-08-16-universe-schema-extension-design.md`, change the status line to:

```markdown
- **Status:** Implemented 2026-08-16
```

- [ ] **Step 5: Commit**

```bash
git -C life-leveling-app add apps/mobile/src/domain/roadmap/fixtures/catalog.test.ts docs/superpowers/specs/2026-08-16-universe-schema-extension-design.md
git -C life-leveling-app commit -m "test(roadmap): fixture integrity for layout, bridges, and content version"
```

---

## Self-review checklist (run after writing, before executing)

1. **Spec coverage:** node layout metadata (Task 2), relationship types + validator with all seven issue codes (Task 1), featured guide (Task 3), DJ/VJ fixture relationships (Task 4), stub relationships with bridges (Task 5), `universeView` (Task 6), `pathTransferView` (Task 7), fixture integrity + `contentVersion` 2 (Tasks 5 and 8). Spec's "out of scope" items are absent, as intended.
2. **Placeholders:** none — every fixture value is enumerated and every code step carries complete code.
3. **Type consistency:** `NodeSize`, `RelationshipKind`, `UniverseRelationship`, `RelationshipIssue`, `UniverseNodeVm`, `UniversePathVm`, `UniverseVm`, `PathTransferVm`, `strongestState` are each defined once and referenced consistently. `strongestState` is exported from `universe.ts` and reused by `path-transfer.ts`.
4. **One deliberate deviation from strict TDD:** Task 1 Step 6 expects a compile failure that Step 7 resolves, because the validator tests exercise node fields the same task introduces. The plan states the expectation rather than hiding it.
