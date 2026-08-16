# Universe Canvas Design

- **Status:** Approved 2026-08-16
- **Parent specs:** [`2026-08-16-universe-schema-extension-design.md`](2026-08-16-universe-schema-extension-design.md), [`2026-08-16-explorer-surfaces-design.md`](2026-08-16-explorer-surfaces-design.md)
- **Constraints:** [`docs/v2/atlas-interaction-spec.md`](../../v2/atlas-interaction-spec.md) (semantic zoom, selection, layout behaviour, "no physics simulation"), the Living Universe vision (metadata-driven cluster placement, typed relationships, bridges), and the 2026-08-15 performance findings.

## Goal

Render the shared catalog as an explorable Universe: every Node positioned from
its own metadata, typed relationships drawn distinguishably, Paths illuminated,
and the person's Journey overlaid — with pan, zoom, semantic tiers, and a
selection inspector. This is what makes the roadmap feel like a place rather
than a list, and it restores the Universe tab the Explorer chunk removed.

## Decisions

1. **A separate `UniverseScene`, not a refactor of the Alpha scene.** The Alpha
   scene reads module-level singletons (`atlasNodeIndex`, `visibleAtlasNodes`,
   `atlasRegions`), keys `Record`s on closed unions that do not contain the
   roadmap's `language`/`making`/`design` domains or its six `NodeType`s, and
   non-null-asserts the Alpha node id `'live-av'` in its camera. Threading a
   scene-graph prop through it would touch every file the three visual
   baselines and the pan-performance work depend on. The Universe gets its own
   scene; the Alpha keeps working untouched at `/atlas`.
2. **Layout is computed, deterministic, and metadata-driven** — not hand-placed
   coordinates (the catalog has none and never will at scale) and not a physics
   simulation (an explicit prototype non-goal). Same catalog in, same pixels
   out, every run.
3. **One canvas, one baked `SkPicture`.** The Universe has no always-on
   animation, so it needs no overlay canvas: the whole world bakes once per
   `(layout, theme, tier, selection, progress)` change and replays under the
   camera transform. This honours the performance invariant by construction —
   the only Reanimated binding on the canvas is the camera.
4. **Resolvers, not `Record<ClosedUnion, …>`.** Domain colour and node geometry
   are functions with fallbacks, so a new domain or Node type renders sensibly
   instead of crashing on an undefined lookup.

## Layout (`universe-layout.ts`, pure)

```ts
export type LaidOutNode = { id: NodeId; x: number; y: number; radius: number; clusterId: PathId; domainId: InterestId; depth: 0|1|2|3 };
export type LaidOutCluster = { pathId: PathId; title: string; x: number; y: number; radius: number; domainId: InterestId };
export type UniverseLayout = {
  nodes: LaidOutNode[];
  clusters: LaidOutCluster[];
  byId: Map<NodeId, LaidOutNode>;
  world: { width: number; height: number };
};
export function layOutUniverse(vm: UniverseVm): UniverseLayout;
```

Two levels, both deterministic:

- **Clusters** are placed on a ring, ordered by `(domainId, pathId)` so
  same-domain constellations end up adjacent; a full Path gets a larger orbit
  radius allowance than a stub. The ring's radius grows with cluster count, so
  the world scales without overlap.
- **Nodes within a cluster** sit in orbital bands by `depth` (0 innermost →
  3 outermost) — the vision's foundation → specialization reading — spread by
  angle across the band. Angle assignment is a stable hash of the node id, so a
  node keeps its seat when unrelated nodes are added. `size` sets the drawn
  radius (`major`/`standard`/`minor`).

`world` is the bounding box of everything plus margin, which the camera clamps
to. A pure test asserts determinism (same input → identical output), no
overlapping cluster discs, and every node inside its own cluster disc.

## Scene

`components/universe/UniverseScene.tsx` (+ `.web.tsx` for wheel zoom, mirroring
the Alpha's split) renders, all inside the baked picture:

- a starfield generated deterministically from the world box;
- a soft radial field per cluster, tinted by its domain, with the cluster title;
- relationships: `dependency` as a solid tapered line, `related` as a dotted
  line, `bridge` as a long luminous curve that reads across the gap between
  constellations;
- nodes as domain-tinted discs whose radius comes from `size`, with a rim, an
  inner fill, and a label above a legibility threshold;
- **Path illumination:** when a Path is selected, its cluster keeps full
  saturation and everything else drops to a dim tint — the universe stays
  visible rather than being replaced;
- **Journey overlay:** nodes carrying a progress state get a state ring, and
  the active Journey's route is drawn as a bright ribbon through its steps;
- **selection:** the selected node gets a ring and its direct relationships stay
  bright while unrelated ones dim.

Interaction reuses the Alpha's proven patterns as *patterns*, written fresh
against the Universe's own data: a `use-universe-camera` hook (pan/pinch/wheel,
clamped to `layout.world`, worklet settle, semantic-zoom band notification) and
a single zero-size parent `Animated.View` carrying every hit target, so one
worklet runs per frame rather than one per node.

**Semantic zoom.** Tier 0 shows clusters and `major` nodes only; tier 1 adds
`standard` nodes and their relationships; tier 2 adds `minor` nodes, notes, and
bridge labels. Tier changes information density, not just scale.

## Screen

`/universe` renders `UniverseScreen`: the scene filling the viewport, a compact
HUD (zoom in/out/fit, tier label), and an inspector for the selected node
showing its title, type, description, domain, the Paths that include it, its
progress state, and a link into the Step when the active Journey contains it.
Selecting a cluster offers "open this Path". The roadmap nav regains its
**Universe** tab pointing here — never at the Alpha `/atlas`, which redirects
users without a legacy profile into legacy onboarding.

## Testing

- `universe-layout.test.ts` — determinism; cluster discs do not overlap; every
  node lies within its cluster's disc; band radius increases with depth; world
  box contains every node; a single-cluster catalog still lays out.
- `universe-view.test.ts` additions — tier filtering picks the right nodes.
- `e2e/universe.spec.ts` — the canvas renders at `/universe`; selecting a node
  opens the inspector with its real title; selecting a Path dims the rest and
  offers to open it; zoom controls change the tier label; the Universe tab
  reaches it from Discover.
- The three Atlas visual baselines must remain untouched and passing: this work
  adds files, and changes the Alpha's only in the nav item that points at it.

## Out of scope

Region hulls traced around clusters (a soft field stands in), animated
particles along routes, editing the graph from the canvas, node-position
persistence or editorial overrides, and rendering anything beyond the shipped
catalog.
