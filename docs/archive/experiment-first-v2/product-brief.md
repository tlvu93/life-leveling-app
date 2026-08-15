# Life Leveling V2: Product Brief

> **ARCHIVED 2026-08-15.** This experiment-first brief is retained for product
> history. Current direction: [`../../product/product-thesis.md`](../../product/product-thesis.md).

- Status: Prototype definition
- Last updated: 2026-08-10

## Product thesis

Life Leveling helps people discover plausible directions for their lives by connecting interests, constraints, and real-world experiments. It treats a life direction like a build in a complex game: there are many viable routes, community knowledge matters, and the best next step depends on the person rather than a universal ranking.

The product is not a productivity system with a fantasy skin. Its primary promise is:

> Turn "I like these things, but I do not know what to do with them" into a small, credible experiment you can try in real life.

The first concept to validate is whether someone who likes **music, technology, and visual creativity** can discover **live audiovisual performance**, compare approachable variants, try a 60-minute quest, reflect on it, and use that evidence to shape a personal route.

## Problem

People often know fragments of what energizes them but not the roles, crafts, communities, or projects that combine those fragments. Existing tools usually start too late in the process:

- Habit and goal trackers assume the user already knows what to pursue.
- Career tools reduce a person to job titles and long-term commitments.
- Course marketplaces optimize for enrollment rather than fit.
- Social platforms surface impressive outcomes without showing realistic beginner routes.
- Gamified self-improvement products can turn missed tasks into guilt, maintenance, or cosmetic collecting.

The missing product is a low-pressure place to explore possible paths, test them cheaply, and learn from people who have actually attempted them.

## Target user

The first target is an exploration-ready adult who:

- has two or more interests that do not map cleanly to one conventional role;
- wants a hobby, side project, creative practice, or possible career direction;
- can spend a few hours per week but cannot make a large commitment yet;
- values practical community knowledge but distrusts polished, unrealistic guides;
- is willing to try something small before deciding whether it belongs in their life.

The first prototype persona has 3 hours per week, a EUR 100 starting budget, and is looking for a hobby that might later produce side income.

## Core jobs

1. **Reveal possibilities.** Show me directions that combine the interests and constraints I already have.
2. **Make a direction legible.** Explain what a path feels like, what it costs, and the different ways people practice it.
3. **Lower the cost of trying.** Give me a short, concrete experiment before asking for commitment.
4. **Help me interpret experience.** Turn my reaction and evidence into a better next recommendation.
5. **Show a route, not a checklist.** Let me see prerequisites, alternatives, branches, and meaningful milestones.
6. **Borrow credible experience.** Let me learn from guides whose authors disclose context and have attempted the path.
7. **Contribute back.** Let my completed experiments improve a path for the next person.

## Product model

### Atlas

The evolving landscape of a person's interests, tested paths, active builds, and adjacent possibilities. It is the product's primary orientation surface, not a scorecard of life categories.

### Crossroads

An intersection of selected interests and constraints that reveals plausible paths. A Crossroads answers, "What could these parts of me become together?"

### Path

A community-maintained direction such as Live Audiovisual Performer. A Path describes the practice, outcomes, realities, variants, and credible ways to sample it.

### Build

A person's chosen route through a Path, adapted to their time, budget, equipment, experience, and intended outcome. Builds may branch and can be revised without penalty.

### Quest

A bounded real-world action with a clear finish condition. Quests produce experience only when the person records a result or artifact.

### Expedition

A time-boxed series of quests used to test a Path without implying permanent commitment.

### Milestone

A meaningful capability or outcome on a Build. It represents something the person can demonstrate, not a quantity of app activity.

### Artifact

Evidence from the real world: a mix recording, image, link, note, event attended, conversation, or other result. Private artifacts are valid; public posting is optional.

## Core loop

**Discover -> Taste -> Reflect -> Build -> Contribute**

1. The user combines interests and constraints at a Crossroads.
2. The product reveals a small, diverse set of Paths and explains why they match.
3. The user compares variants and starts a short taster Quest.
4. The user records evidence and a structured reflection.
5. The Atlas changes based on lived evidence and suggests a next branch.
6. After meaningful experience, the user can rate accuracy, improve a guide, or publish a Build.

This loop is complete even when the correct result is "not for me." Learning that cheaply is a successful outcome.

## Experience principles

### Discovery before tracking

The first meaningful action is choosing what feels interesting, not entering habits, ratings, or a complete life audit.

### Test before committing

Every Path must provide a low-cost taster. Long plans are presented only after the user has enough evidence to want one.

### Evidence before experience points

Progress reflects real-world attempts and artifacts. Opening the app, tapping checkboxes, or maintaining a streak is not treated as mastery.

### Reflection before recommendation

Recommendations adapt to what energized, drained, surprised, or blocked the user. Completion alone is too weak a signal.

### Attempt before review

Community feedback distinguishes saving a guide from attempting it, completing it, and verifying that its claims were accurate.

### No punishment

There are no health losses, broken streak shame, public failure, or expiring rewards. Pausing, changing direction, and abandoning a poor fit are normal route decisions.

### Progressive disclosure

The product reveals enough structure to make the next decision while keeping deeper branches, optimization, and community data available on demand.

### The world is part of the value

Life Leveling should feel like entering an explorable game world, not opening another self-management dashboard. Paths unlock territory, Builds resemble skill trees, Expeditions have clear mission framing, and evidence earns visible discoveries. Game feeling comes from spatial exploration, anticipation, motion, and meaningful reveals rather than punishment or decorative points pasted onto a task list.

The world should invite people in before asking them to adopt game language. A bright Living Atlas is the default expression, with a darker Night Atlas available by preference. The distinction is visual rather than functional: discovery, route building, real-world attempts, and meaningful rewards remain equally prominent in both.

## Community knowledge and trust

Community Paths and Builds are the long-term advantage, but an open voting system alone would reproduce the worst parts of build-guide ecosystems. Each published guide therefore includes:

- intended audience and starting level;
- time, cost, location, and equipment assumptions;
- a beginner taster, intermediate route, and optional advanced branches;
- explicit statements about who the guide fits and does not fit;
- version and last-verified date;
- author experience and relevant disclosures;
- variants for common constraints;
- a capstone or observable outcome.

Feedback uses meaningful states rather than a single popularity score:

- **Saved:** I may try this.
- **Attempted:** I started at least one Quest.
- **Completed:** I reached the stated outcome.
- **Helpful:** The guide supported my attempt.
- **Accurate:** Its time, cost, and difficulty claims matched reality.
- **Needs update:** A material assumption is now stale.

Ranking should weight verified attempts, accuracy, recency, and fit to the current user more than raw saves. Creators cannot pay to improve placement.

## V2 prototype scope

The high-fidelity prototype validates one golden journey across eight connected surfaces:

1. Discover interests and constraints.
2. See Crossroads results.
3. Inspect the Live Audiovisual Performer Path.
4. Compare DJ-led, VJ-led, generative, and no-code variants.
5. Personalize a Build.
6. Complete a 60-minute taster Quest.
7. Record a reflection and artifact.
8. See the Atlas update and inspect a community guide.

The prototype uses static data. Authentication, persistence, publishing, moderation workflows, recommendation models, payments, and notifications are outside this validation.

## MVP boundary after validation

An MVP should include only the smallest real version of the loop:

- interest and constraint selection;
- curated Crossroads results;
- versioned Path pages with variants and trust context;
- taster Quests with private evidence;
- structured reflection;
- a personal Atlas and one active Build;
- attempt-based community feedback;
- lightweight guide creation for invited contributors.

It should not initially include family mode, peer comparison, comprehensive life scores, complex resource simulations, daily streaks, a general-purpose habit tracker, an open creator marketplace, or AI-generated public Paths without review.

## Success measures

The north-star behavior is **a reflected real-world attempt that changes the user's route**.

Early validation measures:

- percentage of new users who find at least one Path they did not already know;
- percentage who start a taster after viewing a Path;
- percentage who record a reflection within seven days;
- percentage whose reflection produces a saved, changed, or deliberately abandoned Build;
- reported confidence that the next step fits their constraints;
- guide accuracy among people who attempted it;
- number of useful contributions per 100 completed tasters.

Time in app, daily active use, and streak length are not primary success measures. The product should send people into the real world.

## Monetization direction

Monetization is subordinate to trust and can be added after the discovery loop proves useful.

### Free

The complete basic loop remains usable: discovery, curated Paths, tasters, reflection, a small number of active Builds, private artifacts, and community feedback.

### Plus

A future subscription target of roughly EUR 4.99 per month or EUR 39 per year could fund deeper personalization: unlimited active Builds, richer Atlas history, private planning tools, advanced filters, exports, and collaborative Expeditions. Paid status must not improve community rank or recommendation visibility.

### Creator guides

Experienced creators may sell optional, genuinely deeper guide packs after an open Path and workable taster already exist. The platform could retain 10-15 percent for payments, hosting, versioning, and moderation. Purchases must show the same assumptions, update history, author context, and verified outcomes as free guides.

### Organizations

Later licensing to schools, career programs, libraries, or teams could provide private cohorts, facilitation, and aggregate learning reports without selling individual behavioral data.

The product should not use advertising, sell personal data, sell artificial urgency, charge for basic progress, or allow sponsored ranking.

## Risks to test

- **Novelty without action:** Paths may be interesting to browse but fail to produce real attempts.
- **False precision:** A graph or match score may imply certainty the product cannot justify.
- **Guide quality:** Community supply may be shallow, stale, biased, or optimized for popularity.
- **Setup burden:** Detailed constraints can recreate the configuration fatigue seen in flexible productivity tools.
- **Gamification drift:** Rewards can become the product instead of evidence of lived progress.
- **Identity pressure:** A "life path" can sound permanent; language must normalize experiments and exits.
- **Cold start:** A small, editorially curated Path library is required before open contribution can work.

## Open questions for prototype testing

1. Does "Path / Build / Quest / Expedition / Artifact" feel clear or need simplification?
2. Is the Atlas motivating and understandable without becoming a life score?
3. Do people prefer choosing constraints before or after seeing possibilities?
4. Is a 60-minute taster enough to judge energy and curiosity?
5. Which guide trust signals influence a decision to attempt?
6. Does the variant comparison reduce intimidation or introduce too much choice?
7. Is "side-income potential" helpful context or an unwanted career bias?
