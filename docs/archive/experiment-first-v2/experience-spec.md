# Life Leveling V2: Experience Specification

> **ARCHIVED 2026-08-15.** This journey is not the current product
> specification. See [`../../product/flows.md`](../../product/flows.md).

- Status: Prototype specification
- Last updated: 2026-08-10

## Purpose

This document defines the interaction model and content needed to test the V2 product thesis. It is intentionally narrower than an implementation specification. The prototype should answer whether the journey feels valuable before the data model, recommendation engine, or production architecture is designed.

## Experience promise

Within ten minutes, a new user should move from a loose combination of interests to a credible Path, understand several ways to practice it, and start a real-world experiment that fits their constraints.

After the experiment, the user should be able to record what happened in under two minutes and see a visibly changed Atlas with an understandable next choice.

## Mental model

The interface borrows the useful clarity of game build planning without treating life as a game that can be won:

- The **Atlas** is the world map.
- A **Crossroads** reveals nearby directions.
- A **Path** explains a possible practice.
- A **Build** is the route adapted to the user.
- A **Quest** is an action in the real world.
- An **Expedition** is a time-boxed test of a direction.
- A **Milestone** is a demonstrable capability.
- An **Artifact** is evidence and memory.

The product never labels a person as a class, assigns a permanent identity, or converts life areas into a competitive global level.

## Information architecture

### Primary destinations

- **Atlas:** personal landscape, current position, active Build, and discovered branches.
- **Discover:** interests, Crossroads, curated Paths, and search.
- **Expedition:** current Quest, evidence, reflection, and next step.
- **Community:** Paths, Builds, authors, updates, and contribution.

Desktop uses a quiet left rail with those four destinations. Mobile uses a four-item bottom navigation. Contextual back links remain visible within a journey.

### Prototype screens

The prototype provides eight route-like screens:

1. Discover
2. Crossroads
3. Path detail
4. Build planner
5. Quest
6. Reflection
7. Atlas
8. Community guide

Each screen must have one obvious primary action. Supporting detail can expand or move below the fold.

## Golden journey

### 1. Discover

**User intent:** "Show me what my interests could become together."

Default state:

- Music, Technology, and Visual Creativity are available among a compact set of interest tokens.
- The user can select two to four interests.
- Three constraints are visible and already set to the prototype persona: 3 hours per week, up to EUR 100 to start, and hobby with side-income potential.
- The primary action reads **Find my crossroads** and is disabled with fewer than two interests.

Interaction rules:

- Interest selection uses clear pressed states and removable tokens, not free-form onboarding pages.
- Constraints are lightweight controls, not a full assessment.
- Copy frames results as possibilities, not recommendations with certainty.
- The user can skip detailed constraints and refine later.

Success state: the user submits Music + Technology + Visual Creativity and reaches Crossroads.

### 2. Crossroads

**User intent:** "Help me compare unfamiliar directions without opening ten tabs."

The header repeats the selected interests and constraints. Results are arranged as a small route map on desktop and an ordered route list on mobile.

Each result shows:

- Path name and one-sentence practice description;
- why it connects the selected interests;
- beginner access, typical weekly time, and starting cost range;
- a confidence explanation such as "strong interest overlap, workable budget" rather than a percentage;
- number of verified attempts and freshness of the leading guide;
- a short taster preview.

Prototype results:

- Live Audiovisual Performer, primary match;
- Interactive Installation Maker;
- Creative Coding for Music;
- Stage Technology Operator.

The primary action on the leading result is **Explore this path**.

### 3. Path detail

**User intent:** "What is this actually like, and can someone like me try it?"

The first viewport establishes the practice with a real performance image, literal Path name, concise description, and practical facts. It must not resemble a marketing hero.

Required content:

- what practitioners make or do;
- why it matches the selected Crossroads;
- time, cost, equipment, setting, and learning curve;
- explicit "good fit if" and "less suitable if" statements;
- a beginner taster available with free or borrowed tools;
- four variants: DJ-led, VJ-led, Generative Visuals, and No-code Visuals;
- route overview from taster to a small live set;
- community trust summary and last verification date.

The primary action is **Compare routes**. A secondary action opens the community guide.

### 4. Build planner

**User intent:** "Make this route realistic for my version of the Path."

The Build is presented as a branching route, not a task backlog. The initial node is shared; selecting a variant changes the middle route and estimated requirements.

Prototype branches:

- **No-code VJ:** fastest, EUR 0-40, visual emphasis.
- **DJ + reactive visuals:** balanced, EUR 40-100 with borrowed gear.
- **Generative visuals:** more technical, EUR 0-60, coding emphasis.
- **DJ craft first:** audio emphasis, EUR 60-100.

For the golden journey, DJ + reactive visuals is selected. The adapted route contains:

1. Taste: react visuals to one track, 60 minutes.
2. Learn: create a three-track mini mix, 2-3 hours.
3. Connect: attend or observe one local/open online set, 90 minutes.
4. Combine: produce a ten-minute audiovisual set, 4-6 hours.
5. Share: perform privately or at a small community event.

The planner shows total initial cost, weekly rhythm, equipment assumptions, and where a branch can be changed. The primary action is **Start the taster**.

### 5. Quest

**User intent:** "Tell me exactly what to do next without making this feel like homework."

Quest: **Make one track visible**

Finish condition: play one chosen track while mapping at least two visual changes to its rhythm or sections, then save a screenshot, short clip, or private note.

The screen includes:

- estimated 60-minute sequence: setup 10, experiment 35, capture 5, reflect 10;
- two free tool options and a no-install fallback;
- equipment and setup checklist;
- a calm timer that is optional and not a streak mechanism;
- troubleshooting tips hidden behind disclosure;
- private-by-default Artifact capture.

The prototype completion action opens an Artifact sheet with options to add a short note, simulated file, or external link. The primary action becomes **Reflect on attempt** after evidence exists.

### 6. Reflection

**User intent:** "Help me notice fit, not judge my performance."

Required inputs:

- Energy after doing it: lower / same / higher.
- Curiosity now: closed / unsure / want another step.
- Which part pulled you in: music selection / live control / visual design / system building.
- What created friction: setup / tools / cost / confidence / time / none.
- Optional note.

The screen explicitly states that stopping is a useful result. It does not ask for a numeric self-rating or public post.

For the golden journey, higher energy, another step, live control, and setup friction are selected. The resulting recommendation says: keep the balanced Build, but insert a low-setup practice Quest before buying equipment.

The primary action is **Update my Atlas**.

### 7. Atlas

**User intent:** "What did this attempt teach me, and where could I go next?"

Desktop displays an explorable map with:

- selected interests as origin nodes;
- Live Audiovisual Performer as a discovered Path;
- the taster node marked with an Artifact;
- the active personalized Build extending toward a ten-minute set;
- adjacent paths revealed with lower visual emphasis;
- one reflection insight attached to the completed node.

Mobile displays the same information as a vertical route with an adjacent-path drawer. The map must never shrink into unreadable dots.

The primary action is **Continue build**. A contextual action opens the recommended community guide.

No global life score, peer rank, deficit chart, or daily streak appears.

### 8. Community guide

**User intent:** "Can I trust this route for my situation?"

Guide: **Your first reactive-visual mini set with borrowed gear**

Required trust context:

- author experience and disclosure;
- audience and prerequisites;
- tested versions of tools or workflow;
- cost and time claims;
- last verified date and update history;
- verified Attempted, Completed, Helpful, and Accurate counts;
- fit and non-fit notes from completers;
- sections for taster, beginner route, branches, and capstone;
- report-needs-update action.

The guide may be saved without affecting its quality rank. Accuracy feedback becomes available only after an attempt. The prototype's primary action is **Use this build**, returning to the planner with the guide route selected.

## Recommendation behavior

Prototype recommendations are deterministic fixtures but must explain themselves in user language. A recommendation consists of:

- **Signal:** selected interests, constraint, or reflection input.
- **Inference:** what that signal may mean, stated with uncertainty.
- **Change:** which Path, branch, or Quest moved and why.
- **Control:** a visible way for the user to correct it.

Example:

> You liked live control but setup got in the way. We kept the DJ + reactive visuals route and added a browser-based practice before any equipment purchase. Change route.

The system does not claim that a Path is the user's calling or predict success.

## Content design

### Voice

- Concrete, curious, and non-judgmental.
- Prefer verbs that imply exploration: try, taste, compare, notice, revise.
- Avoid destiny language: calling, meant for you, perfect match.
- Avoid productivity pressure: overdue, failed, fell behind, get back on track.
- Name real tradeoffs instead of disguising them with motivational copy.

### Labels

Use game-inspired terms only where they reduce complexity. Always pair an unfamiliar term with plain-language context the first time it appears.

### Match explanations

Do not show precise fit percentages. Use evidence statements such as:

- Combines all three selected interests.
- Fits a three-hour weekly rhythm.
- Taster works within your starting budget.
- Community evidence is current but still limited.

## Visual system

### Direction

The interface is an explorable contemporary game world. A full-screen map, compact HUD, command dock, path unlocks, build-tree nodes, expedition framing, and evidence rewards create anticipation and a sense of place. It should feel closer to a strategy-game world map or build planner than a SaaS dashboard. Practical information still appears at the point of decision, but it should not dominate the first impression as rows of cards, settings panels, or statistics.

The default presentation is **Living Atlas**: bright, welcoming, and legible for people who do not identify as gamers. **Night Atlas** is an optional dark appearance for people who prefer a more intense game interface. Both themes share the same information architecture, interactions, maps, and progression feedback; theme choice must never change product capability.

Game feeling must come from meaningful interactions:

- selecting interests feels like equipping a loadout;
- combining them activates a Crossroads;
- discovering a Path reveals territory;
- choosing a Build illuminates a route through a tree;
- completing a real attempt unlocks an Artifact and new branch;
- reflection changes the world map in a visible reveal;
- community authors feel like experienced players sharing verified builds.

The product can use strong color, angular framing, layered maps, responsive light, and restrained motion. It must not imitate medieval fantasy, default to cyber-terminal language, hide essential facts behind lore, or use game decoration to disguise ordinary task administration.

### Color

- Living Atlas uses cool mist gray, white, and soft green surfaces over a daylight world map.
- Night Atlas uses near-black charcoal with high-contrast text over the same world at night.
- Music uses coral.
- Technology uses teal or cyan.
- Visual Creativity uses saffron.
- Progress and verified evidence use green.
- Community uses magenta when a separate domain accent is needed.
- Muted gray carries unexplored routes.

No single hue should dominate the interface. Color is paired with shape or text and never carries meaning alone.

### Shape and density

- Corners remain at 8px or less; angular clipped corners are preferred for HUD surfaces.
- Cards are reserved for repeated Paths, guides, inventory-like Artifacts, or genuinely framed tools.
- Sections remain unframed and full-width within the app shell.
- Route nodes have stable dimensions so selection and completion do not shift layout.
- Headings scale by context; compact panels do not use hero typography.
- The desktop shell uses a compact top HUD and bottom command dock, not a persistent SaaS navigation rail.

### Motion

Transitions may trace a newly revealed route or confirm an Artifact pin. Motion stays below 250ms, respects reduced motion, and never blocks the next action.

## Responsive behavior

### Desktop, 1200px and above

- Persistent 216px navigation rail.
- Content width uses available space with a readable inner maximum.
- Atlas and Build routes use horizontal or freeform maps.
- Facts and primary action may remain in a narrow sticky context column where useful.

### Tablet, 720-1199px

- Compact navigation rail or top bar.
- Two-column content collapses when facts would fall below 280px.
- Route maps preserve meaningful labels and can scroll horizontally if needed.

### Mobile, below 720px

- Bottom navigation with safe-area spacing.
- Single-column layout.
- Route maps become ordered vertical routes, not scaled desktop diagrams.
- Primary actions remain reachable without covering content.
- Interest and constraint controls wrap; text cannot be clipped inside tokens.

## Accessibility requirements

- All controls use semantic elements and visible focus states.
- Minimum target size is 44 by 44px for primary touch controls.
- Text and meaningful graphics meet WCAG AA contrast.
- Interest, route, and reflection selection expose pressed or checked state.
- Map connections have an equivalent ordered text representation.
- Icons have accessible names when used without visible text.
- Timers are optional, can be paused, and do not announce every second.
- Animations respect `prefers-reduced-motion`.
- Artifacts are private by default and sharing is never preselected.

## Prototype state model

The prototype stores state in memory for the session:

- selected interest IDs;
- time, budget, and intent constraints;
- selected Path and variant;
- current Quest status;
- Artifact presence and note;
- reflection selections;
- Atlas update state;
- guide selection.

Routes can be represented with a URL hash so browser back and direct screen review remain possible. Refresh may reset fixtures.

## Usability test script

Give the participant only this prompt:

> You like music, technical systems, and visual creativity. You have about three hours a week and EUR 100 to explore a hobby that might someday earn side income. Use Life Leveling to find and start something worth trying.

Observe without teaching the terms. After the simulated Quest, ask the participant to record how it felt and decide what to do next.

Key questions:

1. What does the product help you do?
2. Which result would you open, and why?
3. What do you think a Path and a Build are?
4. Would you try the taster in real life? What would stop you?
5. What changed on the Atlas?
6. Which community signals made the guide more or less trustworthy?
7. Did any element create pressure, false certainty, or game-like distraction?

## Prototype acceptance criteria

- A participant can complete the eight-screen journey without explanation.
- The next primary action is identifiable within five seconds on each screen.
- The Path's real-world activity, cost, time, and variants are understood.
- The Quest finish condition is repeatable in the participant's own words.
- The participant understands that reflection can lead to continuing, changing, or stopping.
- The Atlas change is recognizable on desktop and mobile.
- Community popularity is not mistaken for verified quality.
- No layout overlaps or clips at 390x844, 768x1024, or 1440x900.
