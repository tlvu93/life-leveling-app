# Atlas Visual Rubric — "Living Universe" mock parity

Target: `apps/mobile/.tmp/mock.png` (1672×941). This rubric is the acceptance
mechanism for the Atlas redesign. **Style parity, not content parity** — node
names, counts, and positions are expected to differ; shapes, glow, color,
typography, and density feel must match.

## Loop protocol

```
SETUP (once):  cd apps/mobile
               node scripts/slice-mock.mjs            # mock crops -> .tmp/mock-crops
LOOP:          npm run web                            # dev server :8085 (leave running)
               node scripts/capture-atlas.mjs         # deterministic shots -> .tmp/atlas-shots
               node scripts/compose-compare.mjs       # TARGET|CURRENT pairs -> .tmp/atlas-compare
               -> view each compare-<name>.png, score the rubric, fix worst gaps, repeat
FINAL:         npm run export:web && npm run serve:web:test
               node scripts/capture-atlas.mjs --base http://127.0.0.1:8084
               node scripts/compose-compare.mjs       # full rubric pass against static export
```

Captures use `/?showcase=1&static=1&theme=<mode>`: all 63 nodes/edges un-gated,
animations pinned (`static=1`), fit-world camera, seeded active journey
(`e2e/fixtures/journey-states.json`). Determinism check: run capture twice,
byte-compare `full.png`.

Scoring: each criterion is PASS / PARTIAL / FAIL against the named crop.
Track pass results in this file's Score log during an iteration session.

**Verification depth:** presence checks ("a white rim exists") are not
sufficient and have passed wrong renders before. For border/glow recipes,
compare STRUCTURE: zoom to pixel level, and sample a radial color profile
(ray from node center outward) on both mock and capture — the ordering of
bands (body → ramp → white peak → desaturated fade, nothing saturated outside
the white) must match, not merely the presence of each band.

**Glow energy:** bloom brightness comes from band width × opacity, not blur.
Blurring a thin stroke with a large sigma dilutes its light to imperceptible;
to make a rim "burn", use a WIDE stroke (≈0.25–0.35R) with moderate blur
(σ 2–6) layered twice, plus a crisp core stroke on top. Verify with the
radial profile: the post-peak fade should stay bright (R>230) for several px
like the mock, not collapse immediately.

## Criteria

### Background (crops: `background`, `full`)

| # | Criterion |
|---|---|
| B1 | Deep lavender/periwinkle nebula base with per-region color washes (not flat pastel wash) |
| B2 | Three star tiers visible: dense tiny points, medium soft stars, few large flare stars |
| B3 | Flare stars have 4-point diffraction arms, not plain circles |
| B4 | Starfield pans/zooms with the map (in-world), nebula may stay fixed (parallax) |
| B5 | No hard-stroked region blob outlines anywhere |

### Nodes (crops: `hub-music`, `skill-web`, `full`)

| # | Criterion |
|---|---|
| N1 | Interest hubs are hexagons with saturated domain-color fill and lighter-at-top gradient |
| N2 | Hubs carry a wide soft outer glow in their domain color plus a bright rim stroke |
| N3 | Hub icons are white glyphs centered in the hexagon |
| N4 | Skill nodes are tiny 4-point sparkle badges with a domain-color glow (not flat circles) |
| N5 | Quest/step nodes are small violet glowing polygons (not flat green hexagons) |
| N6 | Path/milestone nodes are larger violet glowing polygons with white glyph |
| N7 | Completed nodes show a small green circle + white check badge |
| N8 | Clear size hierarchy: hub > path/milestone > quest > skill |
| N9 | Selection ring glows and pulses in an accent color (frozen mid-pulse under `static=1`) |

### Edges & routes (crops: `route`, `skill-web`, `full`)

| # | Criterion |
|---|---|
| E1 | Constellation webs: thin faint glowing lines linking hubs to skills (not flat dark strokes) |
| E2 | Personal route is a thick luminous WHITE ribbon with a wide soft bloom |
| E3 | Route carries beads/waypoints (small bright dots, occasional gold star sparkle) |
| E4 | Navigator/community routes are dashed curves in 3+ distinct colors with a slight glow |
| E5 | No flat, dark, glow-less lines remain anywhere on the map |

### Labels & regions (crops: `region-label`, `hub-music`, `full`)

| # | Criterion |
|---|---|
| L1 | Region labels are bold white uppercase with letter-spacing and a soft white glow |
| L2 | Node labels are white with a soft dark glow underlay (readable over nebula, no hard fake outline) |
| L3 | Hub labels visually stronger than skill labels (weight/size hierarchy) |
| L4 | Regions read as soft tinted nebula fields around each constellation, not outlined blobs |

### HUD (crops: `header`, `tool-rail`, `legend`, `navigator-card`, `inspector`, `dock`)

| # | Criterion |
|---|---|
| H1 | Header: white bar, brand mark, active "universe" tab with purple icon + underline |
| H2 | Header: journey + level cluster with segmented purple pill progress; sun/moon pill toggle |
| H3 | Tool rail: floating white rounded card, purple active/hover states, soft shadow |
| H4 | Legend card bottom-left: glyph rows incl. glowing "Your Journey" line + dashed navigator sample |
| H5 | Navigator-routes card top-right: 3 dashed color samples + names + verified badges |
| H6 | Inspector: purple eyebrow, bold dark title, purple star chip, solid purple primary + outlined secondary, green filled / hollow purple checklist circles, navigator footer |
| H7 | Bottom dock: centered floating white stadium pill, purple active underline |
| H8 | Purple accent (`#6C4FE0`-family) used consistently across all HUD chrome (no legacy green accents) |

## Score log

| Pass | Date | PASS | PARTIAL | FAIL | Notes |
|------|------|------|---------|------|-------|
| — | — | — | — | — | baseline: current app fails nearly everything by design |
| 1-5 | 2026-08-15 | 27 | 1 | 0 | Initial redesign session (5 capture→compare→fix cycles, verified against static export :8084). PARTIAL: B3 — flare stars render 4-arm sparkles but read subtler than the mock's large diffraction stars; consider larger arms/brighter cores in a future pass. Known content-driven deltas (not style failures): node label density and route flowing to the top-right milestone differ from mock because node positions/content differ by design. |
