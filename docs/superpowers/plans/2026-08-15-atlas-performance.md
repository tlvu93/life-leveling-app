# Atlas Performance Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (inline execution chosen — tasks are deeply interdependent and the executor holds the full audit context). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all verified findings from the 2026-08-15 Atlas performance audit (see memory `atlas-perf-audit` and artifact https://claude.ai/code/artifact/857cd60f-f2a2-4bea-a6ce-7e4b14bc7bf7) while preserving the achieved "Living Universe" look.

**Architecture:** Three thrusts: (1) replace every hot-path `BlurMask` with visually-equivalent gradient/layered-stroke/offset-copy forms; (2) split the scene into a world canvas whose only animated prop is the camera (content baked to an `SkPicture` via `drawAsPicture`) plus a tiny overlay canvas for particle/twinkle/selection-ring, with loops gated on focus + reduce-motion; (3) cut JS/UI-thread churn (single camera-transform parent for hit targets, band-change-only semantic-zoom notify, deduped node passes, stable identities). Plus release-build measurement tooling.

**Tech Stack:** Expo SDK 57, RN 0.86.2, @shopify/react-native-skia 2.6.2 (`drawAsPicture`, `Picture`, `RadialGradient`, `Group layer`), Reanimated 4.5.1, gesture-handler 2.32, vitest, Playwright.

**Working state:** branch `atlas-perf` off `atlas-living-universe` (repo root `life-leveling-app/`, app in `apps/mobile/`). Commit after every task.

**Visual safety net:** baseline captures in `apps/mobile/.tmp/atlas-shots-baseline` (Task 0). After each visual task: re-capture, `node scripts/compose-compare.mjs --shots .tmp/atlas-shots`, eyeball every crop. e2e visual specs (`e2e/atlas-visual.spec.ts`, maxDiffPixelRatio 0.02) may legitimately exceed tolerance for intentional technique swaps — re-baseline ONLY after side-by-side review confirms the look is preserved, and say so in the commit message.

---

### Task 0: Branch + baselines
- [ ] `git checkout -b atlas-perf`
- [ ] Verify green start: `npm --prefix apps/mobile test` and `npm --prefix apps/mobile run typecheck`
- [ ] Start dev web server in background: `npm --prefix apps/mobile run web` (port 8085)
- [ ] Capture baseline: `node scripts/capture-atlas.mjs --out .tmp/atlas-shots-baseline` (from apps/mobile)

### Task 1: Blur substitutions (same look, no BlurMask on the hot path)
**Files:** Modify `src/components/atlas/atlas-node-renderers.tsx`, `src/components/atlas/AtlasScene.skia.tsx`, `src/theme/atlas-style.ts`.
Substitutions (tune each against the baseline crops):
- [ ] `LayeredShell` two always-on blurred fills → one `RadialGradient` halo circle (glow color center → transparent, radius ≈ r×1.9; opacity active 0.34 / dormant 0.12); active rim blooms (2 blurred strokes) → 2–3 concentric plain strokes, wide→narrow, α ascending; keep gradient body + crisp rim unchanged.
- [ ] `HubNode` icon glow blurred circle → RadialGradient circle.
- [ ] Skill/nearby glow blurred circle → RadialGradient circle; active rim bloom stroke → layered strokes.
- [ ] `SelectionRing` blur → wide faint stroke + crisp stroke (still SharedValue-driven; moves to overlay in Task 4).
- [ ] `MarkerLabel` halo BlurMask(2.5) → 4 offset halo copies (±1.25px) under the ink copy.
- [ ] `SpacedText` per-glyph halo blurs → ONE `<Group layer={<Paint><BlurMask blur={6}/></Paint>}>` per label around all halo glyphs (6 small layers total; acceptable).
- [ ] Route 3-pass (σ12+σ5+core) → 3 plain strokes: bloom w≈18 α0.20 routeBloom, soft w≈8 α0.5 routeSoft, core w=3; beads/waypoints/particle blurs → soft-alpha under-circles; webs/guides blur pass → wider low-alpha stroke.
- [ ] Recapture + compose-compare + eyeball; `npm test` + `typecheck`; commit `perf(atlas): replace hot-path BlurMask glows with gradient/stroke equivalents`

### Task 2: JS-thread plumbing (pure fixes + tests)
**Files:** Modify `src/domain/atlas.ts`, `src/domain/atlas.test.ts`, `src/components/atlas/use-atlas-camera.ts`, `src/screens/AtlasScreen.tsx`, `src/components/atlas/AtlasScene.skia.tsx`.
- [ ] `visibleAtlasEdges` accepts optional precomputed `visibleIds: ReadonlySet<string>` (scene passes ids from its own `visibleNodes` memo — kills the double node pass). Test: passing ids gives identical output to the legacy path.
- [ ] `use-atlas-camera`: return object wrapped in `useMemo`; `settle` becomes UI-thread worklet path — mark `clampCameraTranslation`/`clampAtlasCamera` as worklets, gestures call `settleOnUI()` worklet (clamp + `withTiming` on UI thread), `runOnJS(onSemanticZoom)` fired ONLY when `semanticZoomForScale` band differs from previous band tracked in a SharedValue.
- [ ] `applyCamera`: when animated, defer `onSemanticZoom` to the `withTiming` completion callback (runOnJS); immediate when `duration === 0`.
- [ ] `AtlasScreen`: key `devFlags` memo on primitive param values (`params.reveal/showcase/static/theme`), not the params object.
- [ ] Tests green, typecheck, commit `perf(atlas): dedupe node passes, band-gated zoom notify, stable camera identity`

### Task 3: Hit-target collapse — one animated parent instead of N animated views
**Files:** Modify `src/components/atlas/AtlasScene.skia.tsx`.
- [ ] Replace per-node `NodeHitTarget` (each with own `useAnimatedStyle`) with ONE zero-size parent `Animated.View` at (0,0) whose single `useAnimatedStyle` applies `[{translateX: camera.x}, {translateY: camera.y}, {scale: camera.scale}]` (zero-size view ⇒ transform origin == world origin). Children: plain (non-animated) absolutely-positioned Pressables at world coords with world-unit hit sizes `max(40, nodeRadius*2 + 12)`, same accessibility labels/roles as today.
- [ ] Confirm overflow of zero-size parent renders on web + native styling (`overflow: 'visible'`).
- [ ] Playwright interaction spec (`e2e/atlas.spec.ts`) still passes against dev server; commit `perf(atlas): single camera-transform parent for node hit targets`

### Task 4: World picture + canvas split + loop gating
**Files:** Create `src/components/atlas/AtlasWorldScene.tsx`; modify `src/components/atlas/AtlasScene.skia.tsx`, `src/components/atlas/atlas-node-renderers.tsx`.
- [ ] Extract everything static-in-world-space (stars at frozen dust opacity 0.519, nebulas, region labels, webs, guides, personal route + beads + waypoints, all `AtlasNodeView`s WITHOUT selection ring) into pure `AtlasWorldScene` (no hooks, no SharedValues; props: nodes, edges-derived paths, fonts, visual, theme, semanticZoom, thinLabels).
- [ ] Bake: `drawAsPicture(<AtlasWorldScene .../>, Skia.XYWHRect(-140, -120, 1500, 960))` in an effect keyed on `[fonts, theme.mode, semanticZoom, showGuide, progress, devFlags.showcase, selectedId]`; keep previous picture until replacement resolves; render world canvas as `<Canvas><Group transform={cameraTransform}><Picture picture={worldPicture}/></Group></Canvas>`.
- [ ] Overlay canvas (absoluteFill, `pointerEvents="none"`): camera Group containing tiny-star twinkle `Points` (opacity `max(0,(pulse−0.55))×0.18`, so freeze ⇒ 0 and captures match the baked base), travelling particle (soft-alpha circles), `SelectionRing` at the selected node (pulseOpacity).
- [ ] Remove `pulseOpacity`/`dustOpacity`/particle bindings from the world canvas — its ONLY SharedValue prop is the camera transform. Add code comment stating that invariant.
- [ ] Gate loops: existing `freeze` + `AccessibilityInfo.isReduceMotionEnabled` (pin to freeze values) + `useFocusEffect` from expo-router (start on focus, `cancelAnimation` on blur).
- [ ] Recapture + compare (should be near-identical to Task 1 shots), tests, typecheck, web harness works (drawAsPicture under CanvasKit); commit `perf(atlas): bake static world to SkPicture, split world/overlay canvases, gate loops`

### Task 5: LOD
**Files:** Modify `src/components/atlas/atlas-node-renderers.tsx`, `src/components/atlas/AtlasWorldScene.tsx`.
- [ ] At semanticZoom 0, skip `HubNode` rays/glints/ticks and `MiniEnvironment` (sub-pixel at scale 0.34–0.72). Showcase captures render at tier ≥1 so baselines are unaffected — verify via capture.
- [ ] Commit `perf(atlas): drop sub-pixel hub detail at the regions zoom tier`

### Task 6: Measurement tooling + platform hygiene
**Files:** Modify `android/gradle.properties`, `package.json` (mobile), `AGENTS.md`; create `scripts/perf-pan.ps1`; modify `src/lib/atlas-dev-flags.ts`, `src/screens/AtlasScreen.tsx` (fps HUD).
- [ ] `android.enableMinifyInReleaseBuilds=true` in gradle.properties.
- [ ] npm script `"android:release": "expo run:android --variant release"`.
- [ ] `scripts/perf-pan.ps1`: gfxinfo reset → 10× `adb shell input swipe` → gfxinfo dump to timestamped file; document the 5-run/median/p95 protocol in AGENTS.md next to the visual protocol.
- [ ] Dev flag `fps=1` → minimal dropped-frame HUD (`useFrameCallback` counting frames >1.5× budget, surfacing via 500 ms runOnJS setState).
- [ ] Tests/typecheck/lint; commit `chore(atlas): release perf protocol, pan benchmark script, fps HUD flag`

### Task 7: Full verification + wrap-up
- [ ] `npm run mobile:verify` from repo root (tests, typecheck, lint, doctor)
- [ ] `npm --prefix apps/mobile run export:web` then `npm run serve:web:test` + final capture + compose-compare vs baseline; eyeball all crops both themes.
- [ ] `npx playwright test` (from apps/mobile). If visual specs exceed 2% AND side-by-side review confirms parity → `npx playwright test --update-snapshots` with justification in commit.
- [ ] Optional: `cd android && .\gradlew assembleRelease` to prove the release build compiles.
- [ ] Update memory `atlas-perf-audit` with implementation state; summarize for the user (what changed, evidence, how to run the on-device benchmark).
