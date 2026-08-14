# Life Leveling V2: Decision Log

Last updated: 2026-08-11

This log records product decisions for the V2 reset. **Accepted** decisions guide the prototype. **Assumptions** must be tested. **Deferred** items stay out of the prototype and MVP until evidence justifies them.

## Accepted

### D-001: Reframe the product around life path discovery

**Decision:** The primary product is a discovery and experimentation system, not a life score, comparison dashboard, or general goal tracker.

**Why:** Users who do not yet know what they want cannot benefit from more tracking. Discovery is the differentiated problem; goals become useful only after a plausible Path exists.

### D-002: Use a build-planning metaphor, not punitive RPG mechanics

**Decision:** Borrow routes, branches, prerequisites, variants, and community builds from games such as Path of Exile. Do not use health loss, broken streaks, grind, random rewards, or global levels.

**Why:** Build planning explains multiple viable routes and meaningful tradeoffs. Punishment and cosmetic reward loops are common sources of anxiety and product drift in gamified habit products.

### D-003: Make real-world experiments the unit of progress

**Decision:** Progress requires an attempted Quest plus an Artifact or reflection. App interactions alone do not grant meaningful experience.

**Why:** This aligns incentives with lived change and prevents engagement metrics from replacing the user's actual goal.

### D-004: Make reflection part of the core loop

**Decision:** Every taster ends with a short structured reflection that may continue, revise, or stop the route.

**Why:** Completion does not establish fit. Energy, curiosity, attraction, and friction provide better evidence for the next recommendation.

### D-005: Treat stopping as a successful outcome

**Decision:** A deliberately abandoned Path remains visible as useful evidence and carries no penalty.

**Why:** The product promises cheaper learning, not forced perseverance. Identity pressure would make exploration less honest.

### D-006: Use the Atlas as the main personal surface

**Decision:** Replace the legacy dashboard and life-stat matrix emphasis with an evolving map of interests, Paths, Builds, experiments, and adjacent possibilities.

**Why:** A map supports orientation and branching without implying that every life category should be maximized.

### D-007: Keep initial input light

**Decision:** Start with two to four interests and a few practical constraints. Detailed skill assessment and full life audits are not required before results.

**Why:** Deep configurability can become cognitive overhead. The first value moment must arrive before the user has to model their life.

### D-008: Explain recommendations without precise match scores

**Decision:** Show why a Path appeared using interest and constraint evidence. Do not display exact compatibility percentages.

**Why:** Early recommendation evidence is too weak for numerical precision. Explanations make uncertainty and user correction visible.

### D-009: Structure community feedback by experience

**Decision:** Separate Saved, Attempted, Completed, Helpful, Accurate, and Needs Update. Weight verified attempts, accuracy, recency, and user fit over raw votes.

**Why:** Build-guide communities frequently suffer from popular but stale, expensive, or beginner-hostile guides. A single upvote count cannot distinguish aspiration from evidence.

### D-010: Require guide context and versioning

**Decision:** Published guides identify audience, prerequisites, time, cost, equipment, fit, non-fit, variants, capstone, author experience, disclosure, version, and last verification.

**Why:** These fields address recurring complaints about hidden assumptions, unrealistic budgets, missing beginner stages, and outdated advice.

### D-011: Curate the cold start

**Decision:** Launch with a small editorial library and invited contributors before open publishing.

**Why:** Community quality cannot emerge from an empty marketplace, and moderation rules need real examples before broad contribution.

### D-012: Use AI as an assistant, not an authority

**Decision:** AI may propose tags, route variants, summaries, and personal adaptations. Public Paths and material claims require human review and experience signals.

**Why:** Generated breadth is useful, but unverified confidence would damage the trust model.

### D-013: Keep the complete basic loop free

**Decision:** Discovery, a workable Path, taster, reflection, private evidence, and basic Atlas access cannot be paywalled.

**Why:** Charging before a person can establish value undermines experimentation and biases community outcomes toward paying users.

### D-014: Monetize depth without selling influence

**Decision:** Explore a Plus subscription, optional paid creator depth, and later organization licensing. Reject advertising, personal-data sales, artificial urgency, paid ranking, and paid recommendation placement.

**Why:** Trust is the product's compounding asset. Monetization that changes what gets recommended would make guide quality ambiguous.

### D-015: Prototype one complete vertical journey

**Decision:** Build a high-fidelity static prototype for Music + Technology + Visual Creativity -> Live Audiovisual Performer across Discover, Crossroads, Path, Build, Quest, Reflection, Atlas, and Community Guide.

**Why:** One coherent loop tests the concept more reliably than broad but disconnected feature screens.

### D-016: Make game feeling structural

**Decision:** Present Life Leveling as an explorable strategy-game world with a HUD, world map, Crossroads activation, build trees, Expeditions, and evidence-driven unlocks. Reject the quiet dashboard shell used in the first V2 prototype iteration.

**Why:** Concept review showed that game terminology inside a restrained SaaS layout did not create fun or curiosity. The target user comes from games and expects anticipation, spatial discovery, expressive feedback, and meaningful reward moments. These qualities must shape navigation and interaction, not be added later as decoration.

### D-017: Default to Living Atlas, retain Night Atlas

**Decision:** Use the light Living Atlas theme by default and offer the darker Night Atlas as an immediate appearance switch. Keep the game structure identical in both themes, while using plain exploration language in primary flows and reserving stronger game terminology for concepts it makes clearer.

**Why:** The dark prototype created the intended fun and spatial identity, but its neon and cyber cues risked signaling that the product was only for technical or gaming audiences. A bright world broadens the invitation without flattening the experience into a dashboard, while the optional dark theme preserves the original intensity for users who prefer it.

### D-018: Model Guides as routes through a shared graph

**Decision:** Build the Atlas from canonical typed nodes and edges. Community Guides select and order routes through that graph and may propose missing nodes or relationships for review. Use stable regional geography and semantic zoom rather than rendering every approved item at once.

**Why:** Treating every Guide as an independent node collection would create duplicates, unstable clustering, and an unreadable global view. Shared concepts let multiple Guides accumulate useful evidence around the same practices while preserving author-specific routes and variants.

### D-019: Make the Atlas a viewport-locked world

**Decision:** The Atlas uses the full available viewport with no document scrolling. Map tools and primary navigation remain compact HUD controls above one continuous graph scene. Destination details, Navigator routes, and the legend share one mutually exclusive context surface that can be closed. Smaller screens reduce panel content and use a bottom sheet instead of stacking panels below the graph.

**Why:** A title, toolbar, framed graph, and follow-up content band made the experience read as another web application even when the graph itself was game-inspired. A stable world with edge-mounted controls and persistent spatial context is closer to the reference experience and makes exploration feel like the primary action.

### D-020: Make the product Android-first and universal

**Decision:** Build the V2 client with Expo and React Native, targeting Android first while retaining supported iOS and web builds from the same route and component model. The previous Next.js application remains a legacy backend and data-model reference rather than the V2 interface.

**Why:** The Atlas, Expeditions, evidence capture, haptics, notifications, and offline use are fundamentally mobile interactions. Starting from native primitives avoids a later browser-to-mobile rewrite, while Expo keeps the web prototype available for review and community authoring. This decision supersedes the earlier deferral in F-006.

### D-021: Render the Atlas with React Native Skia

**Decision:** Use React Native Skia for the two-dimensional Atlas scene, Reanimated for camera and visual state, and Gesture Handler for pan and pinch input. Keep accessible controls and node hit targets in the React Native view tree above the canvas. Do not introduce Three.js unless a future feature genuinely requires a three-dimensional world.

**Why:** The Atlas needs custom regions, curved routes, semantic zoom, particles, and a game-like visual language across native and web. Skia provides that control without the DOM overhead and browser-only assumptions of the prototype, while retaining a smaller conceptual and performance surface than a 3D engine.

### D-022: Let uncertainty be a truthful onboarding state

**Decision:** Interests may be empty when “Nothing stands out yet” is the honest answer, and skills may remain “Starting fresh.” The product responds with a playable Starting Fresh Sampler that compares small, contrasting real-world experiments. Sports and movement, making, storytelling, photo/video, and related signals are now represented explicitly. Child accounts and family mode remain deferred.

**Why:** Requiring two interests and an existing strength forced some people to invent a profile before the product could help them. The sampler earns personalization from reflected attempts instead of treating missing inputs as missing motivation. Sports + Creative can be tested with adults and general private use without silently expanding the Alpha into child-account safety, consent, and parental-control scope.

### D-023: Use a finite Guide deck and local-first route creation

**Decision:** Guide discovery is a capped session of five contextual Guides with explicit pass, save, inspect, and try actions. It must stop rather than load an endless feed. Anyone may create a private route locally and deliberately turn it into an unlisted link. Opening an unlisted link imports a private copy. Public discovery and canonical Path creation remain proposal- and review-gated.

**Why:** Swipe gestures can reduce discovery effort, but endless content would optimize browsing rather than the north-star reflected real-world attempt. Private and unlisted routes provide ownership and sharing now while preserving the Guide trust lifecycle and avoiding an unmoderated creator marketplace.

## Assumptions to validate

### A-001: The vocabulary is learnable

Path, Build, Quest, Expedition, Artifact, Atlas, and Crossroads may be memorable, but the total set may create unnecessary translation cost.

### A-002: Interest combinations produce genuine surprise

The Crossroads mechanic must reveal useful practices people did not already know, rather than merely restating obvious jobs or hobbies.

### A-003: A 60-minute taster can create decision evidence

Some Paths may require more setup or exposure before energy and curiosity are meaningful signals.

### A-004: An Atlas is clearer than a dashboard

The route map must communicate current position and next options without becoming decorative or visually intimidating.

### A-005: Constraints improve results without narrowing too soon

Budget, time, and intent can make recommendations credible, but early constraint filtering may hide inspiring possibilities that can be adapted.

### A-006: Trust metadata affects behavior

Users may say they value accuracy and author context but still choose concise, popular, or visually polished guides.

### A-007: Side-income intent belongs beside hobby exploration

It may help people choose viable routes, or it may reintroduce career pressure into an intentionally exploratory product.

### A-008: Community contribution follows successful attempts

Completers may be willing to verify cost, time, and fit, but contribution must be substantially easier than writing a full guide.

## Deferred

### F-001: Production recommendation architecture

No vector search, AI orchestration, knowledge graph, or ranking model will be selected until the prototype clarifies the required inputs and explanations.

### F-002: Full guide marketplace

Pricing, refunds, creator payouts, taxes, and marketplace governance follow evidence that free Paths and trusted authors create recurring value.

### F-003: Social feed and direct messaging

Community begins around Paths, guides, and structured evidence. A general feed would create moderation cost and reward content production over real-world experiments.

### F-004: Family mode and peer comparison

These legacy concepts are excluded from the V2 MVP because they do not serve the first discovery loop and introduce sensitive safety and comparison dynamics.

### F-005: Comprehensive life overview

A future overview may show the distribution of active and paused Paths, but V2 will not revive a universal life-stat matrix or deficit score.

### F-006: Native-only capabilities beyond the universal core

The Android-first universal client is accepted in D-020. Defer background location, platform-exclusive UI, complex notifications, and other native-only capabilities until the basic discovery loop has device evidence.

### F-007: Notifications and streaks

Reminders may later support an explicitly scheduled Expedition, but daily engagement pressure is excluded.

### F-008: Public Artifact hosting

Artifacts remain private by default. Public portfolios require consent, moderation, storage, copyright, and safety decisions beyond this prototype.

## Change protocol

Update this log when prototype research changes an accepted decision or resolves an assumption. Record the new decision and evidence rather than silently editing the rationale. Implementation choices belong in technical ADRs after the product loop is validated.
