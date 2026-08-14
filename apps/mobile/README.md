# Life Leveling Universal App

This is the Android-first Life Leveling V2 client. It uses Expo SDK 57 and Expo Router for Android, iOS, and static web builds. The Atlas is rendered with React Native Skia rather than DOM or SVG graph nodes.

The original Next.js application remains at the repository root as a legacy implementation and future backend/API source. New product UI work belongs here.

## Requirements

- Node.js 22.13 or newer
- npm
- Android Studio plus an Android SDK for local emulator or APK builds
- Microsoft Edge or a Playwright-managed Chromium browser for browser tests

## Run

```bash
npm install
npm start
```

The development server uses port `8085` so it does not conflict with services commonly running on port `3000`. The Expo terminal prints the LAN URL and QR code for testers.

From the Expo terminal, press `a` for Android or `w` for web. Direct commands are also available:

```bash
npm run android
npm run web
```

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run doctor
npm run export:web
npm run export:android
npm run test:e2e
```

The browser suite exports and serves the production web build at `http://127.0.0.1:8084`. The normal development server remains independent.

## Structure

- `src/app`: Expo Router route entry points.
- `src/screens`: Atlas, Discover, Quest, and Community screens.
- `src/components/atlas`: Skia scene, gesture camera, and responsive HUD.
- `src/domain/atlas.ts`: platform-neutral typed graph data and camera helpers.
- `src/domain/journey.ts`: versioned onboarding, Path, Quest, reflection, and Guide state.
- `src/data`: typed local, memory, and HTTP journey repository adapters.
- `src/theme`: Living Atlas and Night Atlas design tokens.
- `public/canvaskit.wasm`: generated after install from Skia's CanvasKit dependency and loaded only by the web renderer.
- `e2e`: viewport, interaction, and navigation checks.

See `../../docs/v2/mobile-architecture.md` for the migration boundary and implementation decisions, and `../../docs/v2/journey-persistence.md` for the repository and remote API contract.
