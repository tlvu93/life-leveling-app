# DJ/VJ Roadmap Prototype Plan

- **Status:** Proposed next validation slice
- **Last updated:** 2026-08-15

## Goal

Validate the roadmap-centered product model through one connected Creator and
Explorer journey before expanding the content library, family accounts,
portfolio depth, or backend architecture.

The prototype should answer:

> Can a practitioner express a credible route, and can an Explorer understand,
> adopt, change, use, and optionally share that route without feeling assigned
> homework?

## Hypotheses

### H1: A shared Atlas improves orientation

An Explorer with Music + Technology signals can discover DJ/VJ, understand what
it is, and see how its concepts connect without needing a complete assessment.

### H2: Multiple Guides are more useful than one official checklist

The Explorer understands why a club-first and visual-first route differ and can
choose based on audience, assumptions, and outcome rather than popularity.

### H3: Creators can express route knowledge with shared Nodes

A DJ/VJ practitioner can build a coherent Guide by reusing shared concepts,
marking route roles, and adding practical context without fighting the graph
model.

### H4: Adoption plus remix creates ownership

The Explorer can copy a Guide into a personal Build, change at least one Step,
and still understand the source and consequences of that change.

### H5: Progress can feel useful without pressure

The Explorer can record a Step as interested, tried, practicing,
demonstrated, paused, skipped, or not for me and does not infer a deadline,
streak, grade, or global level.

### H6: Selective sharing is legible

The Explorer can produce a read-only view containing only chosen interests,
Build Steps, and Artifacts and can accurately explain what remains private.

## Prototype content

### Canonical Path

**DJ/VJ and Live Audiovisual Performance**

The Path overview covers:

- what DJ/VJ practitioners do in several settings;
- DJ-led, VJ-led, no-code, and generative variants;
- time, cost, equipment, access, and live-setting realities;
- common foundations and genuine alternatives;
- related Paths such as Creative Coding for Music, projection mapping, event
  technology, and music production.

### Shared Nodes

Use approximately 12-16 Nodes, including:

- rhythm and song structure;
- music selection;
- music theory;
- playing an instrument;
- signal flow;
- visual composition;
- reactive visuals;
- projection and display basics;
- live control;
- equipment setup;
- observing a live set;
- private one-track experiment;
- ten-minute audiovisual set.

Music theory and playing an instrument must be available for Creators to mark
as required, recommended, optional, or excluded. The prototype should expose
that authorial disagreement rather than settle it in advance.

### Guides

Provide two comparable fixtures:

1. **Club-first DJ/VJ with borrowed gear** - music selection and live control,
   with theory and instrument experience as optional depth.
2. **Visual-first reactive performance** - composition and reactive visuals,
   with DJ technique as an alternative branch.

The Creator journey authors or materially edits the first Guide. The second
provides a meaningful comparison.

## Connected golden journey

### Creator

1. Choose the existing DJ/VJ Path.
2. Set audience, starting point, outcome, and practical assumptions.
3. Search and place shared Nodes on a branching route.
4. Mark each Step's route role.
5. Explain why music theory and instrument practice are optional in this route.
6. Add one checkpoint and one alternative.
7. Preview the Guide as an Explorer.
8. Create an unlisted link.

### Explorer

1. Begin with Music + Technology or open the unlisted link.
2. Understand the DJ/VJ Path and compare the two Guides.
3. Adopt the club-first Guide into a personal Build.
4. Replace a controller-dependent Step with a keyboard-only alternative.
5. Mark one Step interested and attempt one bounded real-world Step.
6. Record it as tried, practicing, or not for me; evidence remains optional.
7. See the Build and Atlas update without a deadline or global score.
8. Preview a selective share page and choose exactly what appears.

## Prototype surfaces

1. **Atlas / Discover:** search, interest entry, and nearby Paths.
2. **Path overview:** literal practice description, variants, realities, and
   related Paths.
3. **Guide comparison:** route differences, assumptions, trust, and outcomes.
4. **Guide builder:** shared-Node search, route composition, role assignment,
   context, and preview.
5. **Personal Build:** adopted route, provenance, remixing, and progress states.
6. **Step detail:** explanation, optional Quest, resources, and progress update.
7. **Share preview:** granular selection and read-only output.

The Atlas visual renderer remains the primary orientation surface. Supporting
workflows may use structured lists or editors where spatial editing would make
the first prototype harder to understand.

## Functional acceptance criteria

- Path, Guide, and Build are distinguishable without moderator explanation.
- A Creator can reuse a Node and create a visibly provisional custom Node.
- Required, recommended, optional, alternative, and checkpoint roles are
  visually and semantically distinct.
- Guide comparison exposes at least three material differences.
- Adopting creates an independent personal Build with source provenance.
- Remixing never modifies the source Guide.
- No Guide adoption creates a schedule, deadline, or reminder automatically.
- All non-coercive Step states are reachable.
- The Atlas reflects the selected Path and personal Build rather than seeded
  fixture history.
- The user can dismiss or edit any proposed next Step.
- The share preview begins empty and exposes no unselected private data.
- No screen presents a global level, life-completion percentage, or streak.
- The experience works at phone and desktop review sizes.

## Research plan

### Creator sessions

Recruit 4-6 adult practitioners or experienced learners, including at least two
with DJ/VJ or adjacent live-creative experience.

Observe whether they can:

- model their real route without turning every preference into a requirement;
- find and reuse Nodes;
- express alternatives and audience assumptions;
- understand the public review boundary;
- recognize where the model oversimplifies their knowledge.

### Explorer sessions

Recruit 6-8 adults interested in music, technology, visuals, or new creative
hobbies. Include novices and people with adjacent experience.

Observe whether they can:

- explain the Path in their own words;
- compare Guides and identify meaningful differences;
- adopt and change a route deliberately;
- choose an honest progress state;
- leave with a useful next possibility without feeling pressure;
- predict the contents of a shared profile.

A parent-child use case may be explored through a co-viewing interview, but no
child profile or evidence is stored in this prototype.

## Decision thresholds

Proceed to a broader roadmap library when:

- at least 80% of Explorers distinguish Path, Guide, and Build;
- at least 70% identify a meaningful reason to prefer one Guide;
- at least 70% make a deliberate Build change rather than accepting blindly;
- most Creators can model their route primarily with shared Nodes;
- no participant believes adopting a Guide creates obligations or allows the
  Creator to grade them;
- every participant correctly predicts what the share view exposes;
- the repeated top blocker is content breadth rather than model confusion.

Revise the model before adding breadth when terminology, route roles,
ownership, or progress repeatedly require moderator explanation.

## Explicit non-goals

- Full public publishing and moderation operations.
- Accounts, cloud synchronization, or multi-device evidence transfer.
- Real child accounts or parental dashboards.
- A creator marketplace or paid Guide ranking.
- AI-generated public Paths.
- Formal credentials or employer verification.
- A general social feed, direct messaging, streaks, or notifications.
- A comprehensive recommendation engine.
- Migrating every current Alpha feature before the roadmap model is validated.

## Relationship to the current application

The current Expo client supplies reusable foundations: Atlas rendering,
responsive navigation, local persistence, evidence handling, themes, and test
harnesses. Its onboarding, recommendation, Quest resolution, Guide deck, Atlas
statuses, and hard-coded Live AV HUD were built for the earlier
experiment-first Alpha and should be treated as migration inputs rather than
the final workflow.

Implementation should begin with a versioned roadmap domain model and fixture
data. Do not connect authentication or the legacy backend until Creator and
Explorer tests validate the object model.
