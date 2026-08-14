# Alpha 1 Trust and Stopped-Quest Plan

- Status: Ready for the next implementation session
- Scope: Personal Alpha 1 loop only
- Primary route: Live Audiovisual Performer

## Outcome

Make the existing vertical slice respond truthfully to what a person selected and treat an unsuccessful or unwanted experiment as meaningful progression.

This iteration should answer two questions:

1. Does the recommendation accurately explain why the available experiment is relevant, including its tradeoffs?
2. Can someone try the Quest, decide it is not for them, and still receive a useful Atlas change and next direction?

Do not add accounts, synchronization, community creation, voting, moderation, new visual systems, or XP work in this iteration.

## Evidence behind the work

Five isolated persona simulations found two core-loop problems:

- All five received recommendation language that contradicted at least one saved profile signal. Examples included invented interests and a fixed two-hour claim for people who selected one hour or 5+ hours.
- The time-poor novice deliberately stopped the experiment, but the only available resolution was `COMPLETE QUEST`.
- Low difficulty, low enjoyment, previous experience, and available time did not materially change the next recommendation.
- Evidence privacy and local persistence were understood and worked reliably.
- Reflection-led Atlas growth was the strongest moment in the completed journeys.

The goal is to preserve the last two strengths while fixing recommendation trust and negative-outcome handling.

## Product rules to establish first

Treat these as the behavior contract for the implementation.

### Recommendation truthfulness

- A reason may mention only interests, skills, goals, and time that exist in the saved profile.
- Display the person's selected time exactly. Never describe a one-hour or 5+ hour profile as a two-hour week.
- Separate personal fit from product availability:
  - `Strong personal fit` means the scoring model supports that claim.
  - `Playable Alpha experiment` means the route has a working Quest.
- Do not call Live Audiovisual Performer the strongest fit when another route scores higher but is not playable.
- If Live AV is not the strongest personal fit, explain it honestly as an available bridge experiment and name the tradeoff.
- An unavailable alternative may be shown as a future direction, but it must be labeled as a preview and must not have a misleading action.
- Do not make another Path selectable until it has at least one complete Path -> Quest -> reflection -> Atlas loop.

### Quest resolution

- A Quest can resolve as `completed` or `stopped`; both require a real attempt.
- `Stopped` means the person learned enough from attempting the experiment to reject or redirect it. It is not failure and does not award completion.
- Both outcomes may save private evidence, reflection, difficulty, enjoyment, and the strongest pull.
- The stopped action must use honest copy such as `I TRIED IT — NOT FOR ME`; do not hide it behind `Complete`.
- The Atlas should mark the Quest as attempted when stopped and completed only when completed.
- A stopped outcome should unlock an adjacent direction based on the reflection signals, not a deeper version of the rejected activity.
- Difficulty, enjoyment, experience, time, and outcome must influence the next recommendation. The selected pull alone is insufficient.

## Implementation order

### 1. Extract a small recommendation domain

Create a pure domain module, tentatively `apps/mobile/src/domain/recommendations.ts`.

It should own:

- typed Path metadata rather than the hard-coded `paths` array in `DiscoverScreen`;
- labels for interests, skills, goals, and time where recommendation copy needs them;
- a deterministic scoring function for the three current Path concepts;
- availability metadata such as `playable` or `preview`;
- structured reason output instead of one prewritten paragraph;
- a post-Quest recommendation function that uses the Quest outcome and ratings.

Prefer structured output such as:

```ts
type PathRecommendation = {
  pathId: PathId;
  personalFit: 'strong' | 'plausible' | 'stretch';
  availability: 'playable' | 'preview';
  matchedSignals: string[];
  tradeoffs: string[];
  firstQuestMinutes: number;
};
```

Keep the scoring small and inspectable. The Alpha does not need a generic rules engine, probability score, or machine-learning layer.

Suggested rules:

- Score explicit interest overlap first.
- Add smaller skill and exploration-goal contributions.
- Treat time as a feasibility constraint, not evidence of identity.
- Surface a clear tradeoff when the first Quest consumes or exceeds the selected weekly time.
- Use stable tie-breaking so tests and explanations remain deterministic.

Update `DiscoverScreen` to render the structured recommendation. A card should explain:

- the actual signals that matched;
- why this experiment is useful now;
- the time fit or mismatch;
- whether it is playable or only a preview.

Update `PathScreen` to use the same recommendation object. Discover and Path must never disagree about the person's signals or time.

### 2. Add versioned Quest outcomes

Update the journey state without losing existing local journeys.

Recommended model:

```ts
type QuestStatus = 'not-started' | 'active' | 'completed' | 'stopped';
type QuestOutcome = 'completed' | 'stopped' | null;
```

Use one resolver, for example `resolveQuest(outcome)`, rather than separate code paths that can drift.

State work should include:

- a storage migration from journey version 1 to version 2;
- preservation of existing completed Quests and artifact references;
- a resolution timestamp that applies to both outcomes;
- the chosen outcome in persisted state;
- unlock calculation derived from the resolved Quest rather than embedded only in the UI.

Keep Start over behavior and durable evidence deletion unchanged.

### 3. Add the stopped-Quest interaction

On `QuestScreen`:

- Keep `COMPLETE QUEST` as the positive resolution.
- Add a visually secondary but plainly visible `I TRIED IT — NOT FOR ME` action.
- Explain in one sentence that stopping after an attempt still improves the Atlas.
- Require a private reflection, difficulty, and enjoyment for either outcome.
- Continue accepting a note or local artifact as evidence. Do not require publication or researcher access.
- Ask what pulled the person in even when they stopped; allow `None of these` if every existing pull would be dishonest.
- Confirm the outcome before resolving if an accidental tap would be costly or confusing.

Avoid adding a multi-step modal unless the existing screen becomes too dense. The action should remain easy to find on a small phone.

### 4. Make progression respond to the result

Replace `getBranchRecommendation(quest)` with a function that also receives the profile.

Minimum decision behavior:

- `stopped` or enjoyment 1-2: recommend a materially different or lower-setup adjacent experiment.
- completed with difficulty 1-2 plus relevant existing skill: skip beginner rehearsal and recommend a more advanced next experiment.
- completed with enjoyment 4-5: deepen the selected pull.
- one-hour availability: do not recommend a 2-3 hour next step without explicitly splitting it into sessions.
- 5+ hours plus existing experience: do not recommend a ten-minute beginner rehearsal as meaningful progression.

The first implementation can use a small explicit decision table. Add only the Atlas nodes needed to express these outcomes; do not redesign the map.

The reveal must state:

- what outcome was recorded;
- which signals caused the branch;
- what visibly changed;
- why the next experiment is different or deeper.

For a stopped Quest, use `attempted` language and styling. Never label the Quest completed.

### 5. Cover the behavior with tests

Add domain tests before wiring the screens.

#### Recommendation unit tests

Create fixtures matching the five simulated profiles:

- Mara: Music + Visual creativity + Performance, starting fresh, 2 hours.
- Leila: Music + Visual creativity + Community, Visual design, 3-4 hours.
- Jonas: Music + Technology + Visual creativity, Coding, 1 hour.
- Chris: Music + Technology + Nature, starting fresh, 1 hour.
- Ravi: Music + Technology + Performance, Music production + Live performance, 5+ hours.

For every fixture assert:

- generated reasons contain no unselected interest;
- displayed time matches the selected time;
- the rank is deterministic;
- personal fit and availability are not conflated;
- any time mismatch appears as a tradeoff.

#### Journey-state unit tests

Assert:

- version 1 state migrates without data loss;
- completed and stopped outcomes persist distinctly;
- stopped does not mark the Quest completed;
- resolution requirements are enforced for both outcomes;
- branch selection uses profile, outcome, difficulty, enjoyment, and pull;
- experienced/low-difficulty and novice/stopped profiles receive different next steps.

#### End-to-end tests

Extend `apps/mobile/e2e/atlas.spec.ts` with:

1. A non-default onboarding profile whose exact interests and time appear consistently on Discover and Path.
2. A stopped Quest that persists after reload and produces an attempted Atlas node plus a redirecting recommendation.
3. An experienced profile with difficulty 1/5 that does not receive the beginner ten-minute rehearsal.
4. A one-hour profile that is never described as having two hours.
5. Small-phone and landscape checks ensuring both Quest outcome actions are reachable and not covered by navigation.

Retain the existing completed-Quest, artifact, reset, and persistence coverage.

### 6. Rerun the five persona scripts

Repeat the same isolated profiles and rubric after automated checks pass.

Count natural behavior separately from forced interaction. Specifically verify:

- no persona sees a fabricated profile signal;
- Chris can stop honestly and understands why the redirect appeared;
- Jonas understands why Live AV is offered even if Creative Coding is a stronger preview;
- Ravi receives a next step that respects his experience;
- no evidence is perceived as public;
- every resolved journey survives reload.

## Acceptance criteria

This iteration is done when:

- all five profile fixtures produce factually correct recommendation explanations;
- Discover and Path share one recommendation source and cannot drift;
- a user can record either a completed or stopped attempted Quest;
- stopped and completed states are visibly and semantically distinct on the Atlas;
- the next recommendation changes for negative enjoyment, low difficulty with experience, and one-hour availability;
- all state, reflection, ratings, outcome, evidence metadata, and unlocks survive reload;
- version 1 local state migrates successfully;
- unit tests, typecheck, lint, existing E2E tests, and the new E2E cases pass;
- the five-person simulation meets the directional start, comprehension, next-step, privacy, and blocker thresholds in `alpha-1-field-test.md`.

## Explicitly deferred

- A fully playable Creative Coding for Music route.
- A fully playable Interactive Installation Maker route.
- Community Guide creation, voting, validation, or moderation.
- Accounts, cloud synchronization, or cross-device evidence transfer.
- Recommendation percentages, opaque confidence scores, or ML ranking.
- XP balancing, cosmetic progression, and Atlas visual redesign.

If Creative Coding repeatedly ranks first and people refuse the available bridge experiment, the next product decision is to build Creative Coding as the second complete vertical slice. Do not solve that by making an unplayable card look selectable.

## Suggested next-session checklist

1. Read this plan and `alpha-1-field-test.md`.
2. Write the five recommendation fixtures and expected behavior first.
3. Implement the pure recommendation module.
4. Wire Discover and Path to that shared output.
5. Add the version 2 state migration and resolved Quest outcome.
6. Add the stopped action and adaptive branch reveal.
7. Run unit tests, typecheck, lint, and E2E.
8. Repeat the five isolated persona simulations.
9. Fix only the top repeated blocker before expanding scope.

## Restart prompt

Use this at the start of the next session:

> Implement `docs/v2/alpha-1-trust-and-stopped-quest-plan.md` in order. Preserve the offline-first journey and existing evidence persistence. Start with recommendation-domain tests and the journey-state migration, then wire the UI and E2E coverage. Do not add community or backend scope. Finish by rerunning the five persona profiles and report the Alpha thresholds using natural intent rather than forced click-through.
