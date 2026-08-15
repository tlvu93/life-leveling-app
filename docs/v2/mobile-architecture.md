# Mobile Architecture

- **Status:** Implemented technical foundation; roadmap domain migration pending
- **Primary platform:** Android
- **Secondary platforms:** Web and iOS
- **Stack:** Expo SDK 57, React Native 0.86, Expo Router, React Native Skia, Reanimated, Gesture Handler

## Decision

Life Leveling V2 is an Android-first universal application. Expo provides the native application lifecycle, routing, assets, haptics, and build path while retaining a supported web target. React remains the component model, but the app no longer depends on browser-only layout or graph rendering.

The canonical roadmap-centered product model is defined in
[`../product/`](../product/). This document describes the current client. Its
journey state and several supporting screens still implement the archived
experiment-first Alpha.

The legacy Next.js application remains in the repository. It is not the V2 UI shell. Its database and API work can be reused behind explicit service interfaces only after the roadmap domain model has been validated.

## Why this stack

- Expo Router keeps one route model across Android, iOS, and web.
- React Native controls keep touch targets, safe areas, haptics, and accessibility in the native component tree.
- Skia provides a customizable high-performance scene for thousands of paths, regions, particles, and nodes.
- Reanimated shared values update camera transforms and visual effects without React render cycles.
- Gesture Handler supplies native pan and pinch recognition. Web adds wheel zoom at the renderer boundary.

Three.js is not the default Atlas renderer. The current world is a two-dimensional information map, so a 3D scene would add camera, accessibility, text, battery, and bundle complexity without improving the core interaction. It remains an option for a future explicitly three-dimensional mode.

## Boundaries

### Domain

`src/domain/atlas.ts` is platform neutral. It owns node and edge types, canonical prototype data, semantic visibility, path geometry, and camera calculations. It must not import React Native, Skia, or browser APIs.

The current in-memory graph is a vertical-slice fixture. It contains seeded
statuses and some Live AV-specific presentation that are not valid long-term
personal state. The next domain version must separate the canonical Atlas from
Path, Guide, personal Build, Step, and progress records while preserving stable
Node identifiers.

### Renderer

`AtlasScene.skia.tsx` owns drawing and native gestures. It renders regions, relation edges, personal routes, community guides, nodes, labels, and animated route signals.

`AtlasScene.web.tsx` is the web-only adapter. It loads CanvasKit asynchronously and adds wheel zoom. `scripts/setup-skia-web.mjs` copies the version-matched CanvasKit runtime into `public` after dependency installation. Bundled Inter font files are loaded through Skia because browser system-font matching is not supported by its CanvasKit backend.

Interactive routes render through `ClientOnly` on web. Static rendering cannot know viewport dimensions, and selecting responsive HUD branches on the server creates invalid hydration at narrow widths. The native targets render immediately; web initially renders a small stable loading surface and mounts the viewport-dependent shell after hydration.

Accessible React Native press targets sit above the canvas. The canvas is visual; selection and navigation are not canvas-only interactions.

### HUD

The Atlas never creates document scroll. Responsive behavior uses three compositions:

1. Portrait phone: compact header, vertical tools, bottom-sheet inspector, full-width native navigation.
2. Landscape phone: compact header, horizontal tools, right inspector, full-width navigation.
3. Tablet and desktop: full title context, vertical tools, right inspector, shaped centered navigation.

Supporting screens use a scrollable content region between the fixed header and navigation.

### State

`src/domain/journey.ts` owns the versioned, platform-neutral discovery state. `src/data/journey-repository.ts` defines the persistence boundary and its local, in-memory, and HTTP implementations. The application provider depends on that interface; it does not call AsyncStorage or an API directly.

The default adapter persists the complete onboarding → Path → Quest → reflection journey in AsyncStorage. Onboarding completion, Path start, and Quest resolution wait for the repository write before navigating. Draft edits are queued immediately, and an interrupted write can be retried at the next milestone. Stored data is migrated and normalized to journey version 3 when loaded.

The HTTP adapter is implemented but not enabled. Activating it requires authenticated V2 sessions and a server endpoint with the contract in `journey-persistence.md`. It deliberately removes device-local artifact URIs from remote documents while retaining evidence metadata. Camera position and selection remain local UI state. The Skia scene never calls storage or API routes directly.

Theme, Atlas camera/selection, and pending picker state remain local UI state. Authentication, community publishing, moderation, remote evidence upload, conflict resolution, and offline synchronization are not yet connected.

## Verification

The current checks cover:

- graph identifier and edge integrity;
- local, in-memory, and HTTP journey repository contracts;
- complete onboarding, Path, Quest, reflection, and evidence-metadata persistence;
- semantic zoom and camera helpers;
- TypeScript and Expo lint;
- Expo Doctor compatibility;
- static web export with CanvasKit;
- Android Hermes bundle export;
- nonblank canvas rendering in Edge;
- HUD bounds and collision checks at 320x568, 568x320, 390x844, 844x390, 768x1024, 1440x900, and 1920x1080;
- Atlas controls, navigation, and supporting-screen interactions.

The native project has been regenerated with Expo, assembled with Java 17 and Android SDK 36, installed on an API 36 emulator, and checked for a nonblank Atlas render and fatal runtime errors. A representative physical Android device is still required for final touch, sustained frame-time, battery, and haptic validation.

## Dependency security

`npm audit --omit=dev` currently reports advisories in the Expo, React Native, Metro, and Skia dependency chain. The suggested automatic fixes downgrade outside the SDK 57 compatibility matrix, so `npm audit fix --force` must not be used. Track supported Expo updates and re-run Expo Doctor after dependency changes.

## Next migration slice

1. Introduce a versioned roadmap domain model for Path, shared Node, Guide,
   personal Build, Step role, and non-coercive progress.
2. Implement the local DJ/VJ Creator and Explorer prototype in
   [`../product/dj-vj-prototype-plan.md`](../product/dj-vj-prototype-plan.md)
   before selecting a production backend.
3. Remove seeded personal history, hard-coded Live AV inspector content, and
   decorative global levels from the Atlas shell.
4. Preserve version-3 journey migration until existing local Alpha data has an
   explicit roadmap-state migration or retirement policy.
5. Measure Atlas frame time on a representative mid-range physical Android
   device and establish a performance budget.
6. Add authentication, remote evidence, and conflict handling only after the
   Creator/Explorer model passes participant validation; never treat a
   device-local file URI as remotely usable.
