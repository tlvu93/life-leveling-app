# Life Leveling Documentation

This directory separates the current product direction from implementation
specifications and historical research.

## Product source of truth

Read these documents before making product or workflow decisions:

1. [`product/product-thesis.md`](product/product-thesis.md) - the problem,
   promise, audience, and product boundaries.
2. [`product/vocabulary.md`](product/vocabulary.md) - the shared object model and
   public language.
3. [`product/journeys.md`](product/journeys.md) - the connected Explorer and
   Creator workflows.
4. [`product/path-and-guide-governance.md`](product/path-and-guide-governance.md)
   - official Paths, community Guides, publishing, and trust.
5. [`product/progress-principles.md`](product/progress-principles.md) - meaningful
   progress without obligation mechanics.
6. [`product/dj-vj-prototype-plan.md`](product/dj-vj-prototype-plan.md) - the next
   narrow validation slice.
7. [`product/decisions.md`](product/decisions.md) - accepted product decisions
   and unresolved assumptions.

When product documents disagree, the newer accepted decision in
`product/decisions.md` wins. Update the affected documents in the same change so
the disagreement does not persist.

## Current technical specifications

The documents in [`v2/`](v2/) describe the implemented Expo client and Atlas:

- `mobile-architecture.md`
- `journey-persistence.md`
- `atlas-interaction-spec.md`
- `atlas-visual-rubric.md`

Technical documentation describes what exists today. It does not override the
product source of truth. The current application still contains parts of the
earlier experiment-first Alpha and will migrate incrementally toward the
roadmap-centered model.

## Historical material

Superseded product briefs, test plans, and research reports live in
[`archive/`](archive/). They are retained to preserve reasoning and evidence,
but they must not be used as current implementation requirements.

