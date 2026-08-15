# Atlas Interaction Specification

- **Status:** Implemented renderer direction; roadmap-state migration pending
- **Scope:** Shared knowledge graph, personal discovery state, and community Guide routes

## Product role

The Atlas is the spatial model behind Life Leveling, not a decorative progress screen. It connects interests, Paths, reusable Nodes, Guides, personal Builds, and Galaxies into a shared world while showing each person only the portion relevant to their exploration.

Canonical meanings come from
[`../product/vocabulary.md`](../product/vocabulary.md). Publishing and graph
change rules come from
[`../product/path-and-guide-governance.md`](../product/path-and-guide-governance.md).

The public graph can grow continuously. The personal Atlas remains understandable through stable geography, semantic zoom, filtering, and progressive discovery.

## Core principles

1. **Stable world, personal visibility.** Approved nodes have stable positions. A person's interests and evidence control emphasis and discovery state, not global geography.
2. **Guides are routes.** A Guide normally connects existing nodes in a recommended order. It creates new nodes only when the shared graph is genuinely missing a concept.
3. **One bright route.** The active personal route is visually dominant. Alternative and community routes remain available without competing for attention.
4. **Meaning before scale.** Node and edge types are explicit. Proximity alone must not imply a prerequisite or recommendation.
5. **Growth adds depth.** New content increases regional richness, but semantic zoom prevents the screen from becoming a wall of nodes.
6. **Meaningful progress changes the map.** Interest, trying, practice, demonstrated outcomes, pauses, and deliberate route changes can alter personal emphasis without changing global geography.
7. **The Atlas is a place, not a page.** The world owns the viewport. Navigation, tools, route context, and node details appear as compact HUD layers without introducing document scrolling.

## Graph objects

| Object | Meaning | Typical appearance |
| --- | --- | --- |
| Interest | Broad area that attracts a person, such as Music | Large regional hub |
| Node | Reusable foundation, skill, experience, project, milestone, or material resource | Type-specific marker |
| Path | Possible practice or direction, such as Live Audiovisual Performer | Prominent diamond or framed node |
| Guide | Official or community-authored roadmap through shared Nodes | Named route overlay with trust state |
| Build | Explorer-owned adoption or remix of one or more Guides | Dominant personal route |
| Galaxy | Curated view across related Paths, Guides, and Nodes | Named region or subgraph overlay |
| Quest | Optional bounded real-world action attached to a Step | Numbered or status-marked node |
| Milestone | Observable outcome | Flag or destination node |
| Artifact | Optional evidence or memory attached to progress | Badge on the relevant Node or Step |

## Edge types

- **Develops:** a Quest or Path develops a Skill.
- **Requires:** a node is a meaningful prerequisite for another node.
- **Combines:** a Path combines multiple Interests or Skills.
- **Leads to:** a common progression relationship without implying a hard prerequisite.
- **Alternative to:** two nodes provide different ways toward a similar outcome.
- **Related to:** a weaker discovery relationship used for nearby possibilities.

Edge type must be available on selection or hover. Color alone never communicates its meaning.

## Semantic zoom

### Level 1: Regions

- Shows Interest regions, discovered Paths, the current position, and major cross-region connections.
- Displays regional activity as a subtle density signal rather than hundreds of nodes.
- Intended for orientation and discovering unfamiliar territories.

### Level 2: Paths

- Reveals major Skills, Paths, nearby possibilities, and active Guide routes.
- Shows labels only where they do not collide.
- Intended for comparing directions and understanding why regions connect.

### Level 3: Details

- Reveals Quests, milestones, prerequisites, artifacts, and route alternatives around the selected node.
- Limits the view to the selected neighborhood rather than magnifying the entire world.
- Intended for planning and starting action.

Zooming changes information density, not merely pixel scale. The camera also scales continuously within each semantic level so users can inspect spatial relationships without abrupt jumps. Controls include zoom in, zoom out, fit world, and keyboard equivalents. Pointer dragging pans the map; mouse wheel, trackpad, and pinch gestures zoom it. These interactions are part of the prototype rather than a production-only placeholder.

## Selection and focus

Selecting a node:

- highlights its immediate connections;
- dims unrelated edges without removing geographic context;
- opens a compact inspector with type, description, trust context, and available actions;
- keeps the node visible when the inspector opens;
- updates the URL in production so a focused Atlas state can be shared.

Keyboard focus follows the same visual behavior. Nodes use meaningful accessible names and can be traversed without precise pointer input.

## Routes

### Personal route

The active Build determines the primary route. Tried, practicing, demonstrated,
paused, and not-for-me states remain visually distinct. A suggested next Step
may be emphasized, but it never appears overdue or mandatory unless a genuine
safety or outcome dependency exists.

### Community Guide route

A user may display one community Guide over the graph. The overlay includes:

- Guide name and author;
- validation state;
- number of verified attempts;
- starting assumptions;
- divergence from the personal Build;
- a clear action to inspect or adopt the route.

Multiple Guides are compared in a dedicated route comparison view, not drawn simultaneously on the Atlas.

## Contribution lifecycle

1. **Private draft:** visible only to the author and collaborators.
2. **Unlisted:** accessible through a deliberate link without public discovery.
3. **Proposed:** submitted with audience, route roles, cost, time, equipment, safety context, and intended outcome.
4. **Community tested:** enough credible attempts exist to show aggregate outcomes.
5. **Editorially verified:** node use, claims, safety, duplication, and disclosures have been reviewed.
6. **Needs review:** evidence is stale, assumptions changed, or credible reports challenge the route.
7. **Archived:** retained for history but excluded from default discovery.

A Guide proposal may also contain node or edge proposals. Reviewers can attach the Guide to an existing node, merge duplicate concepts, approve a new concept, request revision, or reject the proposal. Votes inform review but never modify the canonical graph automatically.

## Layout behavior

- The Atlas remains locked to the available viewport on desktop, tablet, and mobile. It never becomes a vertically stacked page.
- The graph continues beneath the HUD so controls feel attached to the world rather than arranged as dashboard sections.
- Details, Navigator routes, and the legend share one context surface. Only one of these views may be open at a time, and it can always be closed to return to an unobstructed map.
- Wide screens reserve a map-safe edge for the context surface. Compact screens use a closable drawer with less secondary detail. Mobile uses a bottom sheet that keeps the selected route visible above it.
- Route-reveal notifications appear only when they have dedicated HUD space; compact layouts communicate the same state through the Atlas title instead of stacking another overlay.
- Regions use a curated initial placement supported by relationship density.
- Approved node coordinates are stored and remain stable between visits.
- Layout algorithms may suggest placement for new nodes, but editorial review can adjust it.
- New graph releases animate only the newly added or moved neighborhood.
- Dense regions aggregate low-level nodes until the relevant zoom threshold.

## Personal state

The canonical graph, source Guides, personal Builds, and share configuration
remain separate. Personal state records:

- interest, tried, practicing, demonstrated, paused, skipped, or not-for-me
  progress where appropriate;
- personal Build structure and source Guide provenance;
- attached Artifacts;
- private notes and reflections;
- intentionally hidden or deprioritized Paths.

The Atlas must not imply that undiscovered territory is failure or that graph coverage is a life-completion score.

## Implemented renderer prototype scope

The current Atlas renderer includes:

- five Interest regions;
- one cross-region Path;
- approximately 25 Skills, Quests, and nearby nodes;
- three semantic zoom levels;
- continuous map panning plus mouse-wheel, trackpad, pinch, and HUD zoom controls;
- fit-world and selected-node focus actions;
- selectable nodes with an inspector;
- one active personal route;
- one toggleable, verified community Guide route;
- Living Atlas and Night Atlas appearances;
- responsive desktop, tablet, and mobile presentations.

## Prototype non-goals

- Physics simulation or automatic force-directed layout.
- Automatic community detection.
- Creating or moderating Guides.
- Comparing multiple Guide routes simultaneously.
- Persisting node focus or zoom between sessions.
- Rendering the eventual full public graph.

## Acceptance questions

1. Can a new user identify the major Interest regions within five seconds?
2. Can they explain the difference between the personal route and a community Guide?
3. Can they find a useful next Step without interpreting it as an assignment?
4. Does zoom reveal meaningfully different information rather than only enlarging shapes?
5. Does the map remain inviting to non-gamers while retaining the pleasure of exploring a complex build space?
6. Can users understand how DJ/VJ belongs between Music, Technology, Visual Creativity, and Performance?
