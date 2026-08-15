# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Product source of truth

Before changing product vocabulary, state, navigation, recommendations,
progress, Guide creation, or sharing, read `docs/README.md` and the canonical
documents in `docs/product/` from the repository root. The current onboarding,
Quest-resolution flow, finite Guide deck, seeded Atlas statuses, and Live
AV-specific HUD were built for an archived experiment-first Alpha; existing UI
is not evidence that those behaviors remain product requirements.

# Atlas visual verification

The Atlas ("Living Universe") look is verified against the design mock with a
screenshot loop — see `docs/v2/atlas-visual-rubric.md` for the rubric and the
capture/compare protocol (`apps/mobile/scripts/{slice-mock,capture-atlas,compose-compare}.mjs`).

Dev-only URL flags on the Atlas route (web): `?showcase=1` renders every node
and edge ungated with a fill-world camera, `?static=1` freezes the looping
animations for reproducible screenshots, `?theme=living|night` forces a theme,
`?fps=1` shows the UI-thread frame-time HUD. They are view-only and never
touch persisted journey state.

# Atlas performance verification

Frame-time claims are only valid from a RELEASE build on a physical device —
dev/debug builds carry 2-5x JS/UI-thread overhead and once masked the pan-lag
regression entirely (2026-08 audit, `docs/superpowers/plans/2026-08-15-atlas-performance.md`).

Protocol:
1. Build + install: `npm run android:release` (kill Metro first; the release
   buildType is pre-signed with the debug keystore).
   Known issue on this Windows machine (verified 2026-08-15, present with and
   without the R8 flag): the release native variant fails in
   react-native-skia/worklets CMake configure with `ninja: manifest
   'build.ninja' still dirty after 100 tries` - a CMake 3.22.1 + ninja
   timestamp bug. First aid: check the system clock, delete the libraries'
   `android/.cxx` dirs, retry; or install a newer CMake via Android Studio's
   SDK Manager. Until fixed, `npx expo run:android --variant debugOptimized`
   is the measurement fallback: optimized JS bundle with the (working) debug
   native variant - close enough for before/after comparisons, though absolute
   numbers still read slightly worse than true release.
2. Open the Atlas, wait ~5 s for warm-up, then run the scripted pan benchmark:
   `powershell -File scripts/perf-pan.ps1 -Label before` — it resets
   `dumpsys gfxinfo`, drives identical `adb shell input swipe` pans, and saves
   frame stats (janky %, p50/p90/p95/p99) to `.tmp/perf/`.
3. Do 5 runs, discard the first (shader warm-up), compare MEDIANS of janky %
   and p95 frame time. Change ONE variable per cycle; re-baseline noise by
   benchmarking an unchanged build twice.
4. Deeper attribution (which thread is over budget): Perfetto
   `record_android_trace -o pan.trace -t 15s gfx view sched freq input`, or
   `adb shell setprop debug.hwui.profile visual_bars` for on-screen GPU bars.

Architecture invariant guarding the wins: the big world canvas in
`AtlasScene.skia.tsx` must keep the camera transform as its ONLY Reanimated
binding (everything else is baked into its SkPicture); animated additions
belong on the small overlay canvas. One always-animating binding on the world
canvas re-enables full-scene redraws at 60fps.
