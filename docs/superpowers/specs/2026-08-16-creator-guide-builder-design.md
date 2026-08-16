# Creator Guide Builder Design

- **Status:** Implemented 2026-08-16
- **Parent specs:** [`2026-08-16-roadmap-domain-model-design.md`](2026-08-16-roadmap-domain-model-design.md), [`2026-08-16-explorer-surfaces-design.md`](2026-08-16-explorer-surfaces-design.md)
- **Serves:** the Creator golden journey in [`docs/product/dj-vj-prototype-plan.md`](../../product/dj-vj-prototype-plan.md) — hypothesis H3, plus the acceptance criterion that a Creator can reuse a Node and create a visibly provisional custom Node.

## Goal

Let a practitioner author a Guide through an existing Path: set the audience and
assumptions, search and place shared Nodes on a branching route, assign route
roles, state an explicit exclusion with a reason, preview the result as an
Explorer would see it, and produce an unlisted link. All eight steps of the
plan's Creator journey, over the `guide-edit` operations already built and
tested.

## Decisions

1. **Drafts persist in the user-owned store.** A Creator session runs 45+
   minutes; losing a half-authored Guide to a reload would end the session.
   `RoadmapState` goes to **v2** with a `drafts` slice and a migration.
2. **Provisional Nodes travel with their draft.** `createProvisionalNode`
   produces a node that is not in the catalog, so the draft carries its own
   `provisionalNodes` and every resolver reads `catalog.nodes ++ draft.provisionalNodes`.
3. **Unlisted means a readable route, not a server.** Visibility is a flag on
   the draft and the "link" is an in-app route that renders the draft read-only.
   No publishing, no moderation — both are explicit plan non-goals.
4. **One draft screen, composed of small parts.** The builder is the most
   complex surface in the prototype; its pieces live in
   `components/roadmap/builder/` so no file repeats the Alpha's 30KB screens.

## State changes

```ts
// state.ts
export type DraftVisibility = 'private' | 'unlisted';

export type GuideDraft = {
  guide: Guide;                 // the same shape the catalog stores
  provisionalNodes: AtlasNode[];// nodes this draft proposes, not yet shared
  visibility: DraftVisibility;
  updatedAt: string;
};

export type RoadmapState = {
  version: 2;                   // was 1
  // ...unchanged fields...
  drafts: GuideDraft[];
};
```

`migrateRoadmapState` accepts stored version 1 **or** 2 and always returns 2;
a v1 payload gains `drafts: []`. Drafts are sanitised like everything else: a
draft whose route fails `validateRoute` is dropped whole, provisional nodes with
a missing id or title are dropped, and an unknown visibility falls back to
`private`. The storage key does not change — `migrateRoadmapState` is the
version gate, exactly as `JourneyState` does it.

## Draft operations

`state/draft-actions.ts`, pure and unit-tested, wrapping `guide-edit`:

```ts
createDraft(state, pathId, ids, now): OpResult          // seeds an empty Guide for a Path
updateDraftPersona(state, draftId, persona, now): OpResult
placeDraftStep(catalog, state, draftId, nodeId, ids, now): OpResult
setDraftStepRole(catalog, state, draftId, stepId, role, now): OpResult
removeDraftStep(catalog, state, draftId, stepId, now): OpResult
connectDraftSteps(catalog, state, draftId, from, to, kind, now): OpResult
setDraftStepNote(catalog, state, draftId, stepId, note, now): OpResult
setDraftStance(catalog, state, draftId, nodeId, reason, now): OpResult
clearDraftStance(catalog, state, draftId, nodeId, now): OpResult
addProvisionalNode(catalog, state, draftId, draft, ids, now): OpResult
setDraftVisibility(state, draftId, visibility, now): OpResult
deleteDraft(state, draftId): OpResult
```

Every one returns the domain layer's `OpResult`, so a rejected edit leaves state
untouched and surfaces `issues` — the same contract the Explorer actions use.
Each successful edit stamps `updatedAt`.

**Node resolution rule:** every operation that validates a draft passes
`[...catalog.nodes, ...draft.provisionalNodes]`, so a provisional Node is
placeable and a stance on one is legal, while the shared catalog stays untouched.

## Selectors

`selectors/draft.ts`:

```ts
draftListView(state): { draftId, title, pathTitle, stepCount, issueCount, visibility, updatedAt }[]
draftBuilderView(catalog, state, draftId): {
  draftId, pathTitle, persona, visibility,
  route: BuilderStepVm[],          // reuses guide-builder's linearized route + branchOf
  stances: { nodeId, nodeTitle, reason }[],
  issues: GraphIssue[],            // live, from validateGuide
  publishable: boolean,            // issues empty AND persona complete AND >= 2 steps
  available: BuilderNodeVm[],      // catalog + provisional, minus placed
} | null
draftPreviewView(catalog, state, draftId): PathOverviewVm-shaped read-only preview | null
```

`draftBuilderView` composes the existing `builderView`/`searchNodes` rather than
re-deriving route order, so the builder and the Explorer see the same
linearization.

## Screens and routes

| Route | Screen | Purpose |
|---|---|---|
| `/create` | `DraftListScreen` | drafts with issue counts; start a new Guide on a Path |
| `/create/[draftId]` | `GuideBuilderScreen` | the authoring surface |
| `/guides/[draftId]` | `DraftPreviewScreen` | the unlisted read-only view |

`GuideBuilderScreen` sections, top to bottom: **Who this is for** (persona
fields), **The route** (linearized steps, each with a role picker, a note field,
a connect-to control, and remove), **Add a Step** (node search with provisional
flag, plus "propose a new concept"), **What this route leaves out** (stance
list with reason input), and **Ready?** (live issues, preview, unlisted toggle).

A "Create" tab joins the roadmap nav.

## Error handling

- Live `issues` render inline in the Ready section, each naming the step or node
  it concerns; an invalid draft simply cannot be marked unlisted.
- Ops that reject (missing draft, duplicate step, stance on a placed node) leave
  state unchanged and surface through `lastIssues`.
- Unknown `draftId` renders the shared `NotFound`, never a crash.
- Every screen waits for `hydrated` before drawing, as the Explorer screens do.

## Testing

- `state.test.ts` additions — v1 payload migrates to v2 with `drafts: []`;
  a v2 payload round-trips; an invalid draft route is dropped whole; unknown
  visibility falls back to `private`.
- `state/draft-actions.test.ts` — one case per operation, plus: a provisional
  Node is placeable and validates; a stance on a placed Node is rejected and
  leaves state untouched; `publishable` is false while issues exist.
- `selectors/draft.test.ts` — builder view lists only unplaced nodes as
  available; branch steps carry `branchOf`; preview reflects the draft.
- `e2e/creator.spec.ts` — the Creator golden journey: start a Guide on DJ/VJ,
  fill the persona, place three Nodes, set a role and a checkpoint, add an
  alternative branch, exclude Music Theory with a reason, propose one custom
  Node, see zero issues, preview it, mark it unlisted, and confirm the preview
  route renders the exclusion reason.

Verification before any completion claim: `npm --prefix apps/mobile test`,
`run typecheck`, `run lint`, and `npx playwright test`.

## Out of scope

Publishing to a server, moderation, review workflows, Guide versioning beyond
the existing `version` field, editing a published catalog Guide, and the
Universe canvas (its own spec).
