# Mobile Architecture

- **Status:** Implemented technical foundation
- **Primary platform:** Android
- **Secondary platforms:** Web and iOS
- **Stack:** Expo SDK 57, React Native 0.86, Expo Router, React Native Skia, Reanimated, Gesture Handler

## Decision

Life Leveling V2 is an Android-first universal application. Expo provides the native application lifecycle, routing, assets, haptics, and build path while retaining a supported web target. React remains the component model, but the app no longer depends on browser-only layout or graph rendering.

The legacy Next.js application remains in the repository. It is not the V2 UI shell. Its database and API work can be reused behind explicit service interfaces once the discovery loop needs persistence.

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

The current in-memory graph is a vertical-slice fixture. A production graph service should return the same typed shape and preserve stable node identifiers.

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

Theme, selection, camera, guide visibility, and the supporting-screen interactions are local prototype state. Authentication, persistence, community publishing, moderation, and offline synchronization are not yet connected.

When persistence is added, keep remote state behind domain services. Do not make the Skia scene call API routes directly.

## Verification

The current checks cover:

- graph identifier and edge integrity;
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

1. Define a typed repository interface for Atlas discovery state and Guide routes.
2. Connect the smallest useful API slice: interests, selected Path, Quest completion, and private reflection.
3. Persist camera-independent user state; camera position remains local UI state.
4. Measure Atlas frame time on a representative mid-range physical Android device and establish a performance budget.
5. Replace scaffold app icons and splash art after the visual identity is approved.
