# Roadmap Domain Model Design

- **Status:** Approved 2026-08-16 (sections 1–2 explicitly; section 3 and spec pre-approved by the user in the same session)
- **Scope decision:** domain model + fixtures + data contracts for all seven prototype surfaces. No UI, no backend, no auth.
- **Inputs:** [`docs/product/dj-vj-prototype-plan.md`](../../product/dj-vj-prototype-plan.md), [`docs/product/vocabulary.md`](../../product/vocabulary.md), [`docs/product/research/dj-vj-route-research.md`](../../product/research/dj-vj-route-research.md) (esp. §9 open questions), [`docs/v2/journey-persistence.md`](../../v2/journey-persistence.md) roadmap migration boundary.

## Goal

A versioned, platform-neutral roadmap domain model (Path / Node / Guide / Build / Step / Quest / Artifact with route roles, provenance, progress, and selective sharing) plus fixture data, sufficient for all seven prototype surfaces to be built against without schema churn. Implementation lives in `apps/mobile/src/domain/roadmap/` beside — never inside — the Alpha's `journey.ts` (JourneyState v3 is untouched).

## Decisions made with the user

1. **Scope:** model + fixtures + all seven surface contracts (selectors/view-models), no visual design.
2. **Authorial exclusion:** Guide-level stance records for deliberately-unplaced Nodes, not a sixth route role. Unplaced without stance = absent.
3. **Route representation:** full graph — Steps as vertices, typed edges — not segments or flat lists.
4. **Breadth stress-test stubs:** Bouldering, Learning Japanese, Woodworking, UX Design (Event Technology arrives free as a DJ/VJ related-Path stub).
5. **Architecture:** two stores + pure selectors — read-only versioned `RoadmapCatalog`, persisted `RoadmapState` v1, seven pure selector modules deriving each surface's view-model from `(catalog, state)`.

## Module layout

```
apps/mobile/src/domain/roadmap/
  ids.ts             branded id types + id helpers
  catalog.ts         canonical types: AtlasNode, Path, Guide, GuideStep, RouteEdge, NodeStance, Quest
  graph.ts           route-graph validator + deterministic linearization
  state.ts           RoadmapState v1 types, defaults, migrateRoadmapState(unknown)
  ops.ts             pure user operations: adoptGuide, replaceStep, addStep, removeStep, setProgress, share ops
  guide-edit.ts      pure Creator operations: placeStep, connectEdge, setRole, setStance, createProvisionalNode
  selectors/
    discover.ts        path-overview.ts   guide-comparison.ts  guide-builder.ts
    build.ts           step-detail.ts     share-preview.ts
  fixtures/
    djvj/              nodes.ts, path.ts, guide-club-first.ts, guide-visual-first.ts
    stubs/             event-tech.ts, creative-coding.ts, projection-mapping.ts, music-production.ts,
                       bouldering.ts, japanese.ts, woodworking.ts, ux-design.ts
    catalog.ts         assembles RoadmapCatalog + contentVersion
  *.test.ts            tests beside each module (repo convention)
```

Every module is pure TypeScript with no React/Expo imports (same rule as the existing `domain/` code). Dates/ids are passed in as parameters, never generated inside pure functions.

## Canonical catalog (read-only)

```ts
type NodeType = 'foundation' | 'skill' | 'experience' | 'project' | 'milestone' | 'resource';

type AtlasNode = {
  id: NodeId;                              // stable slug: 'rhythm-song-structure'
  type: NodeType;
  title: string;
  description: string;
  provisional?: { scopeGuideId: GuideId }; // custom Node, scoped to one Guide until review
};

type Path = {
  id: PathId;
  title: string;
  status: 'full' | 'stub';
  overview: {
    whatItIs: string;
    settings: string[];        // plan bullet 1
    variants: string[];        // plan bullet 2
    realities: string[];       // plan bullet 3 (time/cost/equipment/access), as-of dates in prose
    foundations: string;       // plan bullet 4 (common foundations vs genuine alternatives)
  };
  nodeIds: NodeId[];           // this Path's territory in the Atlas
  neighborPathIds: PathId[];   // plan bullet 5
};

type Guide = {
  id: GuideId;
  version: number;             // versioned advice; Builds record the adopted version
  pathId: PathId;
  title: string;
  persona: { audience: string; startingPoint: string; outcome: string; assumptions: string[] };
  steps: GuideStep[];
  edges: RouteEdge[];
  stances: NodeStance[];       // positions on deliberately-unplaced Nodes
  rationale: string;           // author's prose reasoning
};

type RouteRole = 'required' | 'recommended' | 'optional-depth' | 'alternative' | 'checkpoint';

type GuideStep = {
  id: StepId;                  // unique within the Guide
  nodeId: NodeId;
  role: RouteRole;
  note: string;                // author's context for this placement
  quest?: Quest;               // optional bounded real-world action
  sortKey: number;             // authorial order; tie-break for linearization
};

type RouteEdge = { from: StepId; to: StepId; kind: 'next' | 'alternative' };

type NodeStance = { nodeId: NodeId; stance: 'excluded'; reason: string };  // reason required

type Quest = { id: QuestId; prompt: string; kind: 'observe' | 'try' | 'make' | 'meet' };

type RoadmapCatalog = {
  contentVersion: number;
  nodes: AtlasNode[];
  paths: Path[];
  guides: Guide[];
};
```

### Graph semantics and invariants

- `next` edges form the progression. An `alternative` edge `S → T` means "T begins an alternative to S's continuation"; a branch rejoins wherever its last Step has a `next` edge to a mainline Step.
- Validator (`graph.ts`, pure, returns typed issues rather than throwing):
  1. edges reference existing Steps; no self-edges; no duplicate edges;
  2. the Step graph is acyclic;
  3. every Step is reachable from the entry Steps (Steps with no incoming edges); at least one entry Step exists;
  4. every Step's `nodeId` exists in the catalog (or is the Guide's own provisional Node);
  5. stances reference Nodes NOT placed as Steps, and `reason` is non-empty.
- `linearize(steps, edges): StepId[]` — topological order, `sortKey` then `id` as deterministic tie-breaks. All list-style surfaces render this order; the function is total for valid graphs.
- Checkpoint is a role, not an edge kind. Exclusion is a stance, not a role. Absence is the lack of both.

### Vocabulary consequence

`vocabulary.md` gets two one-line updates in this change: (1) progress language gains **skipped** (the plan's seven states win over the vocabulary's six); (2) a sentence under Guide noting a Guide may record an explicit *excluded* stance, with reason, for a Node it deliberately does not place.

## User-owned state (persisted)

```ts
type ProgressState = 'interested' | 'tried' | 'practicing' | 'demonstrated' | 'paused' | 'skipped' | 'not-for-me';

type RoadmapState = {
  version: 1;
  interests: InterestId[];                 // e.g. ['music', 'technology']
  builds: Build[];
  activeBuildId: BuildId | null;
  artifacts: Artifact[];                   // top-level, private by default
  progress: Record<StepId, ProgressEntry>; // keyed by BuildStep id (BuildStep ids are globally unique)
  share: ShareSelection;
};

type Build = {
  id: BuildId;
  title: string;
  pathId: PathId;
  provenance:
    | { kind: 'adopted'; guideId: GuideId; guideVersion: number }
    | { kind: 'scratch' };
  steps: BuildStep[];                      // snapshot copy at adoption; independent thereafter
  edges: RouteEdge[];                      // same shape + validator as Guide routes
};

type BuildStep = GuideStep & {
  origin:
    | { kind: 'from-guide' }
    | { kind: 'added' }
    | { kind: 'replaced'; originalNodeId: NodeId };  // H4's remix provenance
};

type ProgressEntry = { state: ProgressState; updatedAt: string; artifactIds: ArtifactId[]; note?: string };

type Artifact = {
  id: ArtifactId;
  kind: 'note' | 'link' | 'image' | 'file' | 'recording';
  title: string;
  value: string;                           // text for notes, uri otherwise
  createdAt: string;
};

type ShareSelection = {
  interestIds: InterestId[];
  buildId: BuildId | null;
  stepIds: StepId[];      // must belong to the Build named by buildId; others are pruned
  artifactIds: ArtifactId[];
};
```

- Adoption **copies** steps and edges (new BuildStep ids, `origin: from-guide`, mapping table returned for provenance display). A later Guide version bump can never alter a Build.
- No deadline, streak, level, or completion-percentage field exists anywhere in the model — the language guardrails are enforced by schema absence.
- `ShareSelection` starts empty ({[], null, [], []}) and is purely additive; the share-preview selector can only read what it lists.
- Persistence: new AsyncStorage key `life-leveling.roadmap.v1` beside the Alpha key. `migrateRoadmapState(value: unknown): RoadmapState` in the defensive hand-rolled style of `journey.ts`: unknown shape → fresh default; per-field coercion; invalid Builds dropped whole (a half-coerced route graph is worse than none); orphaned progress/artifact/share references pruned against surviving Builds. Any future schema change adds a migration test before bumping the version. No HTTP adapter is wired.

## Pure operations

`ops.ts` (Explorer):

- `adoptGuide(catalog, state, guideId, ids, now) → RoadmapState` — creates a Build with provenance and copied route; sets `activeBuildId`.
- `replaceStep(state, buildId, stepId, node, ids) → RoadmapState` — swaps the Node behind a Step, records `origin: replaced` with `originalNodeId`, keeps edges.
- `addStep / removeStep` — remove prunes touching edges, the Step's progress entry, and any share reference to it, then re-validates; the resulting graph must still pass the validator or the op returns the input state with an issue.
- `setProgress(state, stepId, entry) → RoadmapState`; `attachArtifact(state, artifact, stepId) → RoadmapState`.
- `selectForShare / deselectForShare` — the only writers of `ShareSelection`.

`guide-edit.ts` (Creator, operates on a draft Guide): `placeStep`, `connectEdge`, `setRole`, `setStance`, `createProvisionalNode` (returns node + placement). Every op returns `{ guide, issues }` with the validator run — the builder surface shows issues live rather than blocking mid-edit; an invalid draft cannot be published (publish = fixture-side concern for the prototype, but the invariant lives here).

All ops are total pure functions `old → new`; ids and timestamps are parameters (`ids: () => string`, `now: string`) per the repo's testability convention.

## Surface contracts (selectors/)

All pure `(catalog, state, args?) → ViewModel`; view-models are plain serializable objects, no functions.

1. **discover.ts** — `discoverView(catalog, state)`: selected interests, Paths ranked by interest overlap (Music + Technology → DJ/VJ first), each with title/one-liner/status; stub Paths marked visibly thin.
2. **path-overview.ts** — `pathOverviewView(catalog, pathId)`: the five overview bullets verbatim from fixture prose, Guides on this Path with persona summaries, neighbor Paths with one-liners.
3. **guide-comparison.ts** — `compareGuides(catalog, guideIdA, guideIdB)`: per-Node role matrix (role | role/stance/absent on each side), persona diffs (audience/startingPoint/outcome/assumptions), stance disagreements with both reasons, and a computed `materialDifferences` list (role-class changes, exclusion-vs-placement, persona deltas) — the ≥3-differences requirement is checked by a fixture test, not trusted to prose.
4. **guide-builder.ts** — `builderView(catalog, draft)`: searchable Node list (title/description match, provisional flagged), the draft's linearized route with branch structure, live validator issues, role/stance palettes. Editing itself is `guide-edit.ts`.
5. **build.ts** — `buildView(catalog, state, buildId)`: linearized route with per-Step role, origin badge (from-guide / added / replaced-with-original-name), progress state, provenance header ("adopted from {guide} v{n}").
6. **step-detail.ts** — `stepDetailView(catalog, state, buildId, stepId)`: Node explanation, author note, optional Quest, current progress + the seven choosable states, attached Artifacts.
7. **share-preview.ts** — `sharePreviewView(catalog, state)`: read-only page model built exclusively from `ShareSelection`; empty selection → empty page. Also `shareAudit(state)`: the list of everything NOT shared, for the "explain what remains private" moment (H6).

## Fixtures

`fixtures/djvj/` encodes the research report: 17 Nodes (report §2 names/descriptions/types), the DJ/VJ Path overview (report §1 prose, including neighbor Paths), Guide A club-first and Guide B visual-first (routes, roles, branches, notes, quests, stances with the report's rationale quotes), and the two provisional-Node candidates (Open-Decks Etiquette, Tap-Tempo Drill) as `provisional` Nodes scoped to Guide A drafts for the builder surface. `fixtures/stubs/`: the four related Paths plus Bouldering, Japanese, Woodworking, UX Design — each `status: 'stub'` with 4–6 Nodes and one small valid Guide exercising a schema pressure point (Bouldering: external grading culture kept out of progress states; Japanese: long-horizon route with no performable milestone; Woodworking: Resource/access-gated route; UX Design: share-surface-heavy outcome). `fixtures/catalog.ts` assembles everything, `contentVersion: 1`.

## Error handling

- Validators and migrations never throw on user data: `migrateRoadmapState` coerces or drops; `graph.ts` returns `Issue[]` (`{ code, stepId?, message }`).
- Ops on missing ids (stale buildId/stepId) return the input state unchanged plus an issue — surfaces decide presentation.
- Fixture integrity failures DO throw, in tests only: a test asserts every fixture Guide validates, so a broken fixture fails CI rather than shipping.

## Testing strategy

Beside each module, Jest style as in the existing domain code:

- `graph.test.ts` — cycle rejection, unreachable Steps, duplicate/self edges, stance-on-placed-node rejection, deterministic linearization (same input → same order; branch order stable under permutation of edges array).
- `state.test.ts` — migration: garbage → default; partial → coerced; invalid Build dropped whole; orphaned progress/share/artifact refs pruned; version stays 1.
- `ops.test.ts` — adopt copies (mutating source Guide fixture clone doesn't touch Build); Guide version bump leaves Build identical; replaceStep records origin + originalNodeId; remove prunes edges and keeps graph valid; share ops are the only ShareSelection writers (type-level + test).
- `selectors/*.test.ts` — comparison finds ≥3 material differences and both contested-Node stances for the DJ/VJ fixture pair; share-preview with empty selection is empty; share-preview never contains an unselected id (property-style over random selections); build view shows replaced-step provenance.
- `fixtures/catalog.test.ts` — every Guide validates; every Path's five overview bullets non-empty; all 17 DJ/VJ Nodes referenced by at least one Guide as placement or stance; each breadth stub validates; contested Nodes (music-theory, playing-an-instrument) carry placement-or-stance in both DJ/VJ Guides.

Verification: `npm --prefix apps/mobile test`, `run typecheck`, `run lint` — all green before any commit claims completion.

## Acceptance mapping (plan → model)

| Plan criterion | Where satisfied |
|---|---|
| Path/Guide/Build distinguishable | three distinct types; comparison + build selectors expose provenance |
| Reuse Node + provisional custom Node | `AtlasNode.provisional`, `createProvisionalNode` |
| Five roles visually/semantically distinct | `RouteRole` enum + role matrix in comparison VM |
| ≥3 material Guide differences | `materialDifferences` computed + fixture-tested |
| Adoption → independent Build with provenance | copy-on-adopt + `provenance` |
| Remix never modifies source | pure ops; test asserts source untouched |
| No schedule/deadline/reminder on adoption | absent from schema |
| All non-coercive states reachable | seven-state enum; step-detail VM lists all |
| Atlas reflects selected Path + Build | catalog graph + Build overlay both id-addressable (Atlas rendering consumes ids; out of scope here) |
| Dismiss/edit proposed next Step | no auto-proposal in model; next-step suggestion is a selector concern deferred to UI phase |
| Share preview starts empty, no unselected data | additive `ShareSelection` + property test |
| No level/percentage/streak | absent from schema |

## Out of scope

UI/visual design of the seven surfaces; the Atlas Skia renderer changes; backend/auth/sync; Guide publishing and moderation flows beyond the provisional-Node type; recommendation engine; migrating Alpha JourneyState data into RoadmapState (deliberate: the Alpha store remains as-is).
