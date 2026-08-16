# Product Decision Log

- **Status:** Canonical
- **Reset date:** 2026-08-15

Accepted decisions guide product and prototype work. Assumptions remain open
until participant evidence resolves them. Historical V2 decisions are retained
in `../archive/experiment-first-v2/decisions.md`.

## Accepted

### P-001: Roadmap orientation is the primary value

Life Leveling primarily helps people see possible directions and understand
routes into them. Real-world experiments and reflection support the roadmap;
they are not the entire product.

### P-002: Use one shared Universe with reusable Nodes

Paths, Guides, Journeys, and Galaxies reuse stable concepts where meanings match.
Creators may propose missing Nodes, but independent Guides should not create
silent duplicates of common concepts.

### P-003: A Path hosts several legitimate Guides

A Path defines the destination and shared orientation. Official and community
Guides express contextual routes. No Guide becomes universal truth merely by
being official or popular.

### P-004: The Explorer owns a personal Journey

Adopting or remixing a Guide creates a user-owned Journey. Source updates never
silently overwrite it, and recommendations always remain editable.

### P-005: Progress describes relationships, not compliance

Interested, tried, practicing, demonstrated, paused, skipped, and not for me
are valid states. No streak pressure, overdue exploration, or progress awarded
for app activity alone. Presentation-layer framings that earlier drafts banned
outright — per-Path explored figures, level-like identity markers, untouched-
territory tallies — are reclassified as testable assumptions A-008 to A-010
rather than rules (changed 2026-08-16; see P-012 for the protocol record).

### P-006: Sharing is opt-in and granular

Private state does not automatically become a public profile. A share view
begins empty and includes only explicitly selected Paths, Steps, and Artifacts.

### P-007: Trust is contextual and attempt-based

Guide discovery weighs audience fit, disclosed assumptions, credible attempts,
accuracy, helpfulness, and recency above raw saves or views. Paid placement
does not affect ranking.

### P-008: Private and unlisted creation precede public publishing

Creators can draft and share routes before a full marketplace exists. Public
Path discovery and canonical graph changes require review.

### P-009: Validate adults before implementing child accounts

Parent-child co-exploration is an important use case, but stored child profiles
require dedicated consent, privacy, safety, and agency work. The first connected
roadmap prototype uses adults.

### P-010: Validate one connected DJ/VJ slice

The next prototype connects Creator authoring, Guide comparison, Journey adoption
and remixing, one progress update, and selective sharing around a DJ/VJ Path.
Breadth follows comprehension of this shared model.

### P-011: Keep the Universe game-like but truthful

Spatial discovery, route illumination, visual reveals, and satisfying motion
may create game feeling. Fabricated progress may not; level-like identity
markers are under test rather than banned (A-009).

### P-012: Public vocabulary is Universe and Journey (2026-08-16)

**What changed:** the Living Universe design language, an external vision
exploration, and two UI mocks all converged on "Universe" for the shared map
and "Journey" for the personal roadmap; holding "Atlas" and "Build" created a
second vocabulary with no user-facing benefit.

**Replacement decision:** the shared graph is the **Universe** (formerly
Atlas); the Explorer's personal roadmap is the **Journey** (formerly Build);
the private cross-Journey record is **History** (formerly Journey). "Galaxy"
keeps its curated-view meaning, now naturally nested inside the Universe.

**Affected documents:** all of `docs/product/` (renamed in place;
`journeys.md` became `flows.md` to free the term). The v2 technical specs and
the domain-model code intentionally keep `Atlas`/`Build` identifiers and
migrate lazily.

**Migration impact:** none on stored state (the roadmap store is unreleased);
code identifiers unchanged until a dedicated rename change.

## Assumptions to validate

### A-001: The five core terms are learnable

Universe, Path, Guide, Journey, and Step may still create translation cost. Galaxy
and Quest should remain contextual rather than mandatory vocabulary.

### A-002: Route comparison creates more value than a single roadmap

Explorers may appreciate alternatives, or they may experience decision overload
and prefer one editorial starting point.

### A-003: Creators will reuse shared Nodes

Shared concepts create network value, but Creators may find canonicalization
slower than writing a standalone list.

### A-004: Remixing creates ownership without confusion

Explorers may benefit from editing a Guide, but must understand provenance and
the consequences of removing a dependency.

### A-005: Progress can motivate without obligation

Map changes and visible history may be satisfying without streaks, deadlines,
or scores. This needs behavioral evidence rather than preference statements.

### A-006: Selective progress has portfolio value

Employers, mentors, and communities may value a truthful interest and project
map, but it must not be mistaken for an accredited competency record.

### A-007: Galaxy is useful public language

Galaxy may make creator-curated worlds memorable, or it may add vocabulary
without improving understanding.

### A-008: Per-Path "explored" figures may read as discovery, not obligation

The original guardrail banned completion percentages outright. A per-Path
"42% explored" may carry discovery energy rather than deadline weight — or it
may not. Sessions should test percentage framing against practiced/demonstrated
count framing on the same surface and watch for pressure language.

### A-009: A level-like identity marker may be playful rather than coercive

A HUD marker such as "Level 04" was banned as a global level. It may instead
read as game identity that participants enjoy. Test with and without it;
watch whether participants compare themselves to others or infer a grade.

### A-010: Universe-wide tallies of untouched territory read as deficit

"Not started: 140 / Discoverable: 310" enumerates everything a person has not
done. The standing bet is that this contradicts "undiscovered territory does
not imply a deficit" — but it is recorded here as a bet, falsifiable in
sessions, not as settled law.

## Deferred

- Production recommendation architecture and AI personalization.
- Open public publishing, full moderation operations, and a marketplace.
- Payments, sponsored content, and creator revenue sharing.
- Child accounts, parental dashboards, and school administration.
- Formal credentials and employer verification.
- General social feeds, direct messaging, and follower mechanics.
- Cross-device evidence storage and conflict resolution.
- Notifications, streaks, and engagement optimization.

## Change protocol

Every change to an accepted decision records:

1. the evidence or product constraint that changed;
2. the replacement decision;
3. affected product documents;
4. migration impact on the current client and stored state.

Do not silently edit the rationale while leaving contradictory specifications
active elsewhere.

