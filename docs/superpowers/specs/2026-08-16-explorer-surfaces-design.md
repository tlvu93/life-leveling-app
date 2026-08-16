# Explorer Surfaces Design

- **Status:** Approved 2026-08-16
- **Parent specs:** [`2026-08-16-roadmap-domain-model-design.md`](2026-08-16-roadmap-domain-model-design.md), [`2026-08-16-universe-schema-extension-design.md`](2026-08-16-universe-schema-extension-design.md)
- **Serves:** [`docs/product/dj-vj-prototype-plan.md`](../../product/dj-vj-prototype-plan.md) Explorer golden journey (H1, H2, H4, H5, H6) and decisions A-008/A-009.

## Goal

Make the Explorer golden journey real: storage wiring plus six screens over the
existing tested selectors, so moderated sessions can run end to end —
interests → Path → compare Guides → adopt → remix → record progress → share.
The Creator Guide builder (H3) and the Universe canvas are deliberately later
chunks.

## Decisions made with the user

1. **The roadmap prototype replaces the app entry.** Sessions see the product,
   not scaffolding. The Alpha screens stay reachable rather than deleted.
2. Six Explorer screens in this chunk; Guide builder and Universe canvas next.
3. Both progress framings ship behind a moderator flag, because A-008/A-009 are
   open assumptions rather than settled rules.

## Navigation

| Route | Screen | Note |
|---|---|---|
| `/` | Discover | new home: interests + Paths |
| `/paths/[pathId]` | Path overview | |
| `/compare?a=&b=` | Guide comparison | |
| `/journey` | the personal Journey | |
| `/journey/step/[stepId]` | Step detail | |
| `/share` | Share preview | |
| `/atlas` | Living Universe | **moved from `/`**, screen unchanged |
| `/onboarding`, `/quest`, `/community`, `/discover`, `/path` | Alpha | unchanged paths, reachable from an "earlier prototype" link on Discover |

Moving the Atlas costs three `goto('/')` edits in `e2e/atlas.spec.ts` and one
showcase URL in `e2e/atlas-visual.spec.ts`. The screen itself does not change,
so the visual baselines remain valid and must NOT be re-recorded.

Route files stay thin (`<ClientOnly><XScreen /></ClientOnly>`), matching the
existing convention.

## Storage and state

Mirrors the Alpha's proven pattern; nothing about `JourneyState` changes.

```ts
// data/roadmap-repository.ts
export type RoadmapRepository = {
  load: () => Promise<RoadmapState>;
  save: (state: RoadmapState) => Promise<void>;
  clear: () => Promise<void>;
};
export class KeyValueRoadmapRepository implements RoadmapRepository { /* ROADMAP_STORAGE_KEY */ }
export class InMemoryRoadmapRepository implements RoadmapRepository { /* tests */ }

// data/local-roadmap-repository.ts
export const localRoadmapRepository = new KeyValueRoadmapRepository(AsyncStorage);
```

`state/roadmap-context.tsx` provides `RoadmapProvider` + `useRoadmap()` with the
same serialized write queue, `hydrated` flag, and `persistenceError` surface as
`JourneyProvider`. It exposes state plus actions that wrap the pure ops, so no
screen mutates state directly:

`setInterests`, `adoptGuide`, `replaceStep`, `setProgress`, `addArtifact`,
`attachArtifact`, `selectForShare`, `clearShare`, `flushRoadmap`,
`resetRoadmap`.

`addStep` and `removeStep` exist in the domain layer but are deliberately not
wrapped yet: no Explorer screen in this chunk adds or deletes Steps. They
arrive with the Creator builder.

Actions that can fail return the domain layer's `OpIssue[]` rather than
throwing; the provider keeps the last issues in `lastIssues` for surfaces to
render. Ids and timestamps are generated in the provider (the domain layer
stays pure). Both providers mount in `_layout.tsx`.

## Screens

Each screen calls one selector and renders. Shared pieces live in
`components/roadmap/` — `RoleChip`, `ProgressStatePicker`, `NodeCard`,
`ProvenanceBadge`, `StanceNote`, `EmptyState` — so no screen grows into the
20-30KB files the Alpha accumulated.

1. **Discover** (`discoverView`) — interest toggles; Paths ranked by overlap
   with stubs visibly thin; a link to the earlier prototype.
2. **Path overview** (`pathOverviewView`) — the five overview bullets; Guides on
   this Path with the featured one marked; neighbours including bridge-reached
   ones with their note; a "compare these two" affordance; adopt entry point.
3. **Guide comparison** (`compareGuides`) — persona diffs, computed
   `materialDifferences`, and the per-node role matrix where a placed role sits
   opposite `excluded, because …`. This is where H2 lives.
4. **Journey** (`buildView` + `pathTransferView`) — linearized route with role,
   origin badge, progress state, provenance header, and the transfer line.
5. **Step detail** (`stepDetailView`) — node explanation, author note, optional
   Quest, all seven progress states, optional evidence, and the remix action
   (replace this Step's node).
6. **Share preview** (`sharePreviewView` + `shareAudit`) — starts empty; an
   explicit picker; a "what stays private" summary beside the output.

## Research instrumentation

A `useFramingFlags()` hook reads query params (same approach as the existing
`atlas-dev-flags`):

- `?framing=count` (default) — "16 things you've practiced apply here";
- `?framing=percent` — "42% explored", derived from `applyCount / totalNodes`;
- `?marker=1` — shows a level-like HUD chip.

Defaults ship the count framing and no marker. The flags exist so a moderator
can switch framing mid-session and gather the evidence A-008/A-009 ask for;
they are not a product commitment.

## Error handling

- Unknown route params (missing path, guide, build, or step) render a plain
  "not found" state with a way back, never a crash.
- `persistenceError` renders as a non-blocking banner; the app stays usable.
- Op issues (`missing-guide`, `invalid-route`, …) render inline next to the
  action that produced them.
- Screens render a loading state until `hydrated`.

## Testing

- `data/roadmap-repository.test.ts` — load/save/clear round trip, corrupt
  payload falls back to default, legacy-key absence is fine.
- `state/roadmap-context.test.tsx` — actions produce the expected state,
  failures surface as issues without mutating state, writes are serialized.
- `e2e/roadmap.spec.ts` — the golden journey end to end: pick interests, open
  DJ/VJ, compare both Guides (assert at least three material differences and the
  theory disagreement visible), adopt the club-first Guide, replace the
  gear-access Step with the keyboard-only alternative, mark a Step practicing,
  then open Share preview and assert it starts empty and afterwards contains
  only what was selected.
- Repoint the four Atlas spec URLs; do not re-record baselines.

Verification before any completion claim: `npm --prefix apps/mobile test`,
`run typecheck`, `run lint`, and `npx playwright test`.

## Out of scope

The Creator Guide builder (H3); the Universe canvas rendering the catalog;
deleting or migrating Alpha screens; backend, auth, or sync; visual design
beyond the existing theme tokens.
