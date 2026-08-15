# Alpha 1 Persona Rerun

> **ARCHIVED 2026-08-15.** These scripted results remain valid evidence about
> the earlier implementation, not validation of the current roadmap thesis.

- Date: 2026-08-12
- Implementation: Trustworthy recommendations and stopped-Quest resolution
- Automation: `apps/mobile/e2e/atlas.spec.ts`

## Scope and interpretation

These are isolated scripted persona simulations, not recruited-participant results. They verify that each declared persona intent can travel through the real UI without fabricated signals, a forced completion, a hidden preview action, or lost local state. They cannot prove what an unprompted human will understand or want; the moderated field test in `alpha-1-field-test.md` remains the human-validation gate.

The script records the persona's intended action separately from the automation needed to exercise it:

- **Natural-intent result:** the action the persona scenario calls for after reading the recommendation and Quest outcome choices.
- **Forced interaction:** recovery behavior that bypasses or contradicts that intent, such as clicking an unavailable Path, completing after deciding to stop, bypassing validation, or forcing a different branch.

No scenario required a forced interaction. Browser clicks only executed the declared natural-intent action.

## Isolated results

| Persona | Recommendation trust | Natural-intent action | Recorded result | Atlas response | Next-step intent | Reload |
| --- | --- | --- | --- | --- | --- | --- |
| Mara | Music, Visual creativity, Performance, starting fresh, and 2 hours were shown; no extra interest appeared | Start Live AV | Completed, difficulty 3/5, enjoyment 5/5, Visual design | Completed node; `Build a projection sketch` deepening | Yes | Passed |
| Leila | Music, Visual creativity, Community, Visual design, and 3–4 hours were preserved; Interactive Installations ranked as a preview and Live AV was labeled a playable bridge | Start the playable bridge | Completed, difficulty 2/5, enjoyment 4/5, Visual design | Completed node; experienced low-difficulty branch advanced to `Shape a multi-track AV rehearsal` | Yes | Passed |
| Jonas | Creative Coding ranked first as a preview; Live AV was explicitly the playable bridge; Coding and 1 hour were shown exactly | Start the playable bridge | Completed, difficulty 3/5, enjoyment 4/5, System building | Completed node; `Prototype a sound-reactive system`; 60-minute step stays within the one-hour constraint | Yes | Passed |
| Chris | Music, Technology, Nature, starting fresh, and 1 hour were preserved; no Visual creativity signal was invented | Start, then honestly stop | Stopped, difficulty 4/5, enjoyment 1/5, None of these | Attempted node, never completed; redirected to `Make a sound-and-place notebook` | Maybe | Passed |
| Ravi | Music, Technology, Performance, Music production, Live performance, and 5+ hours were shown | Start Live AV | Completed, difficulty 1/5, enjoyment 5/5, Live control | Completed node; skipped the ten-minute beginner rehearsal for `Shape a multi-track AV rehearsal` | Yes | Passed |

All five Quest screens displayed `PRIVATE · SAVED ONLY ON THIS DEVICE`. No simulation published evidence or implied researcher access. Separate regression cases preserved note and artifact metadata through reload and verified that Start over still clears durable evidence.

## Directional threshold report

| Field-test signal | Scripted result | Threshold | Status |
| --- | ---: | ---: | --- |
| Started after inspecting the Path | 5/5 (100%) | at least 70% | Pass |
| Completed or deliberately stopped after an attempt | 5/5 (100%) | at least 50% | Pass |
| Reveal exposed enough cause-and-change detail to explain the branch | 5/5 (100%) | at least 80% of reflectors | Pass for scripted rubric |
| Declared interest in revealed next step | 4 Yes, 1 Maybe; 4/5 Yes (80%) | at least half | Pass |
| Evidence perceived as public by default | 0/5 | none | Pass for scripted rubric |
| Recurring start blocker | 0 personas | no blocker affecting more than two | Pass |
| Forced interactions | 0 | tracked separately | Pass |

## Automated evidence

- Five recommendation-domain fixtures assert deterministic ranking, exact time, selected-only signals, separate fit/availability, and time tradeoffs.
- Five isolated browser journeys assert the expected recommendation explanation, the single playable action, private evidence copy, the declared completed/stopped result, expected next direction, and reload persistence.
- Dedicated browser cases assert Chris's attempted Atlas node, Ravi's advanced branch, one-hour wording on both Discover and Path, version 1 migration, and action reachability at 320×568 and 568×320.

## Decision

The scripted Alpha gate passes. The implementation is ready for the moderated 5–10 participant field test. Do not interpret this result as evidence that the human comprehension or desire thresholds have already been validated.
