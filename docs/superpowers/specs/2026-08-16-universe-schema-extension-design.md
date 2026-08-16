# Universe Schema Extension Design

- **Status:** Implemented 2026-08-16 (extends the roadmap domain model spec)
- **Parent spec:** [`2026-08-16-roadmap-domain-model-design.md`](2026-08-16-roadmap-domain-model-design.md)
- **Inputs:** the Living Universe vision validation (typed relationships, metadata-driven layout, featured routes, progress transfer), [`docs/product/decisions.md`](../../product/decisions.md) P-003/P-012 and A-008.

## Goal

Extend the catalog so the Universe canvas can be rendered from data and the
"what transfers" product moment has a selector: node layout metadata, typed
Universe relationships, a featured Guide per Path, and two new selectors.
Fixture content for all nine paths rides along ("everything now" scope
decision). No `RoadmapState` changes; no migration.

## Decisions made with the user

1. Inline metadata on `AtlasNode` + flat relationship list on the catalog (not
   a separate layout overlay, not a unified edge store).
2. Fixture population at equal depth for all nine paths, each with at least one
   cross-domain bridge.
3. No `progression` relationship kind at Universe level — ordering stays Guide
   opinion (standing decision).
4. Transfer view reports counts, not percentages; the A-008 percent variant is
   derivable by the UI for session testing.

## Type changes (`catalog.ts`)

```ts
// AtlasNode gains four required layout fields:
export type NodeSize = 'major' | 'standard' | 'minor';

export type AtlasNode = {
  id: NodeId;
  type: NodeType;
  title: string;
  description: string;
  domainId: InterestId;          // home region (coloring/grouping)
  clusterId: string;             // home constellation, typically the native pathId
  depth: 0 | 1 | 2 | 3;          // orbital band: foundation -> specialization
  size: NodeSize;                // visual tier
  provisional?: { scopeGuideId: GuideId };
};

export type RelationshipKind = 'dependency' | 'related' | 'bridge';

export type UniverseRelationship = {
  from: NodeId;
  to: NodeId;
  kind: RelationshipKind;
  note?: string;                 // required in practice for bridges (validator enforces)
};

// Path gains:
//   featuredGuideId?: GuideId   // the default route; must exist and belong to this Path

// RoadmapCatalog gains:
//   relationships: UniverseRelationship[];
```

Semantics: `dependency` is directed ("to relies on from" reads as from -> to)
and the dependency subgraph must be acyclic. `related` is symmetric and stored
once (selectors surface both directions). `bridge` must connect nodes with
different `domainId`s and must carry a non-empty `note` telling the
cross-domain story.

## Validator (`relationships.ts`, new module)

Pure `validateRelationships(nodes, relationships): RelationshipIssue[]` plus
`validateCatalog(catalog): RelationshipIssue[]` covering the catalog-level
rules. Issue codes:

- `missing-node` — from/to references a node id not in the catalog;
- `self-link`;
- `duplicate` — same (from, to, kind) twice, or the same unordered pair twice
  for `related`;
- `dependency-cycle` — the dependency-kind subgraph has a cycle (reuse the
  Kahn linearization approach from `graph.ts` over a temporary step list);
- `bridge-same-domain` — bridge endpoints share a `domainId`;
- `bridge-missing-note` — bridge with empty/absent note;
- `missing-featured-guide` — a Path's `featuredGuideId` does not exist or
  belongs to a different Path.

Same conventions as `graph.ts`: never throws, returns typed issues; fixture
tests assert empty.

## Selectors

`selectors/universe.ts` (new):

```ts
export type UniverseNodeVm = {
  id: NodeId; title: string; type: NodeType;
  domainId: InterestId; clusterId: string; depth: 0 | 1 | 2 | 3; size: NodeSize;
  progressState: ProgressState | null;   // strongest state across all Journeys
};
export type UniverseVm = {
  domains: { id: InterestId; label: string }[];      // only domains with nodes
  nodes: UniverseNodeVm[];                            // provisional nodes excluded
  relationships: UniverseRelationship[];
  paths: { id: PathId; title: string; status: 'full' | 'stub'; featuredGuideId: GuideId | null }[];
};
export function universeView(catalog: RoadmapCatalog, state: RoadmapState): UniverseVm
```

Strongest-state resolution across all Journey steps sharing a node:
`demonstrated > practicing > tried > interested`; `paused`, `skipped`, and
`not-for-me` never win over those four and never count as "applies"; a node
whose only states are paused/skipped/not-for-me reports that state only if no
stronger state exists anywhere (paused > skipped > not-for-me as tiebreak).

`selectors/path-transfer.ts` (new):

```ts
export type PathTransferVm = {
  pathId: PathId; pathTitle: string;
  applies: { nodeId: NodeId; title: string; state: ProgressState }[];  // tried|practicing|demonstrated only
  applyCount: number;            // applies.length — counts, not percentages (A-008)
  totalNodes: number;            // path.nodeIds.length, so a UI variant CAN derive % for session tests
};
export function pathTransferView(catalog: RoadmapCatalog, state: RoadmapState, pathId: PathId): PathTransferVm | null
```

## Fixture content (all nine paths)

- Every node (including the two provisional nodes and all stub nodes) gets
  `domainId`, `clusterId`, `depth`, `size`. Home rules: DJ/VJ music-side nodes
  -> `music`, visual/tech-side -> `technology` or `design` per judgment;
  cluster = native path id; shared nodes keep one home (e.g.
  `rhythm-song-structure`: domain `music`, cluster `djvj`, depth 0, size
  `major`).
- DJ/VJ relationship set: dependency chains grounded in the research (e.g.
  `rhythm-song-structure -> mixing-technique`, `mixing-technique ->
  club-media-player-workflow`, `signal-flow-rig-setup ->
  projection-display-basics`, `visual-composition -> reactive-visuals`),
  related links (e.g. `harmonic-mixing ~ music-theory-fundamentals`), and one
  bridge to each of the four neighbor paths with a story note.
- Each stub path: an internal dependency spine matching its guide's order,
  at least one `related` link, and at least one cross-domain bridge (e.g.
  `research-basics` (design) -bridge- `speaking-practice` (language);
  `movement-fundamentals` (movement) -bridge- `tool-safety` (making) is NOT
  plausible — bridges must be authored for sense, not quota; if no honest
  bridge exists for a stub, bridge it through a DJ/VJ or shared node instead).
- `featuredGuideId`: `djvj` -> `guide-club-first`; each stub -> its only guide.
- `contentVersion` bumps to 2.

## Testing

- `relationships.test.ts` — each issue code has a positive and negative case;
  dependency-cycle detection; related-pair duplicate detection both orders.
- `fixtures/catalog.test.ts` extensions — `validateCatalog` returns `[]`;
  every node has layout fields (typecheck enforces, test asserts depth in
  range and cluster non-empty); every path with `status: 'full'` has a
  featured guide; every stub has >= 1 bridge touching one of its nodes;
  every bridge note non-empty.
- `universe.test.ts` — strongest-state resolution incl. paused/skipped
  tiebreaks; provisional nodes excluded; domains list only populated domains.
- `path-transfer.test.ts` — applies counts with a mixed-state Journey; null
  for unknown path; skipped/not-for-me excluded from applies.

## Out of scope

Rendering the Universe canvas; any UI; `RoadmapState`/persistence changes;
renaming code identifiers to the P-012 vocabulary; relationship authoring
tools.
