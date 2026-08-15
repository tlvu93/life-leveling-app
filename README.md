# Life Leveling

Life Leveling is an Android-first, community-powered roadmap app for exploring
hobbies, skills, creative practices, and possible careers. People can discover
Paths, compare practitioner-created Guides, remix them into personal Builds,
and selectively record or share progress. Its central surface is a zoomable
Atlas rather than a score dashboard or obligation list.

## Repository Layout

This repository intentionally contains two applications during the V2 migration:

```text
apps/mobile/  Current Expo V2 client for Android, iOS, and web
src/          Legacy Next.js application and API routes
prisma/       Legacy database schema and migrations
docs/product/ Canonical product direction and next prototype plan
docs/v2/      Current mobile, persistence, and Atlas technical specifications
docs/archive/ Superseded briefs, research, and implementation history
```

Use the explicit `mobile:*` or `legacy:*` scripts when switching between them. The unprefixed root scripts remain aliases for the legacy Next.js application until its backend responsibilities have been migrated.

## V2 Universal Prototype

The current client lives in [`apps/mobile`](apps/mobile). It uses Expo and React Native for Android, iOS, and web, with a React Native Skia Atlas. The current UI still contains parts of the earlier experiment-first Alpha and will migrate incrementally toward the roadmap-centered model.

```bash
npm --prefix apps/mobile install
npm run mobile:web
```

The Expo terminal displays the development URL. `npm run mobile:start` uses port `8085`; press `w` in that terminal to open the web target.

Start with the [`documentation index`](docs/README.md). Canonical product
direction lives in [`docs/product`](docs/product), while the implemented
architecture and migration boundary are described in
[`docs/v2/mobile-architecture.md`](docs/v2/mobile-architecture.md).

### Android development

Install Android Studio with Android SDK 36 and a Java 17 JDK. Set `JAVA_HOME` and `ANDROID_HOME`, then run:

```powershell
npm --prefix apps/mobile install
cd apps/mobile
npx expo prebuild --platform android
npm run android
```

The Expo config plugin at `apps/mobile/plugins/with-android-build-setup.js` keeps Gradle on Java 17 and moves native CMake intermediates to a short path on Windows. This avoids the Windows 260-character object-file limit after future `expo prebuild --clean` runs. Set `LIFE_LEVELING_CXX_DIR` to override that build location.

Android Studio can open `apps/mobile/android` directly. `android/local.properties` is machine-local and must point `sdk.dir` to the installed Android SDK.

## Legacy Web Application

The Next.js application at the repository root is the earlier implementation. It remains available as a backend and data-model reference while V2 is developed. New product UI work belongs in `apps/mobile`; do not add V2 screens to the root `src/app` tree.

> The setup, architecture, feature, security, database, and deployment sections
> below describe this legacy Next.js application unless they explicitly mention
> `mobile:*` or `apps/mobile`. They are retained as an implementation reference,
> not as the current product roadmap.

## 🚀 Legacy Web: Getting Started

### Prerequisites

- Node.js 22.13+ (developed against Node 24)
- npm
- A Neon (PostgreSQL) database
- A Vercel KV (Redis) store — used to cache Architect-mode scenarios

### Environment Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root and set the following variables. Only
   the **names** are listed here — get the values from your Neon and Vercel
   dashboards, and never commit them.

```env
# Neon / PostgreSQL connection string. Read by both the Neon HTTP driver
# (src/lib/db.ts) and the Prisma pg adapter (src/lib/prisma.ts).
DATABASE_URL=

# Signing key for the auth JWT stored in an HTTP-only cookie.
JWT_SECRET=

# Vercel KV (Redis) — used by src/lib/scenario-cache.ts.
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

`.env*` is gitignored. The Prisma CLI reads `DATABASE_URL` through
`prisma.config.ts` (which loads `.env`); Next.js loads `.env.local` at runtime.

3. Generate the Prisma client:

```bash
npm run db:generate
```

### Database Setup

1. Start the development server:

```bash
npm run dev
```

2. Initialize the database schema (development only — the route refuses to run
   in production):

```bash
npm run db:init
```

3. Check database health:

```bash
npm run db:health
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Next.js dev server                              |
| `npm run build`        | Production build (runs a full type check)       |
| `npm start`            | Serve the production build                      |
| `npm run legacy:verify`| Verify the legacy app                            |
| `npm run mobile:start` | Start Expo on port 8085                          |
| `npm run mobile:web`   | Start the Expo web target                       |
| `npm run mobile:android` | Build and run the Android target              |
| `npm run mobile:verify` | Test, type-check, lint, and diagnose V2         |
| `npm run mobile:test:e2e` | Run the V2 browser interaction suite          |
| `npm run verify`       | Verify both applications                        |
| `npm run lint`         | ESLint over the whole repo                      |
| `npm run lint:fix`     | ESLint with `--fix`                             |
| `npm run type-check`   | `tsc --noEmit`                                  |
| `npm test`             | Vitest, single run                              |
| `npm run test:watch`   | Vitest in watch mode                            |
| `npm run db:generate`  | `prisma generate`                               |
| `npm run db:validate`  | `prisma validate`                               |
| `npm run db:migrate`   | `prisma migrate dev`                            |
| `npm run db:deploy`    | `prisma migrate deploy`                         |
| `npm run db:init`      | POST `/api/init-db` (creates tables)            |
| `npm run db:seed`      | POST `/api/seed-db` with `{"action":"seed"}`    |
| `npm run db:health`    | GET `/api/health`                               |

## 🏗️ Legacy Web Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + React 19
- **Language**: TypeScript 5 (strict)
- **Database**: Neon (PostgreSQL), accessed two ways —
  the Neon HTTP driver for hand-written SQL and Prisma 7 (with the
  `@prisma/adapter-pg` driver adapter) for the modelled tables
- **Cache**: Vercel KV (Redis)
- **Styling**: Tailwind CSS v4 (CSS-first; the design tokens live in
  `src/app/globals.css` under `@theme`, there is no `tailwind.config.ts`)
- **Charts**: D3.js
- **Auth**: JWT in an HTTP-only cookie, enforced by `src/proxy.ts`
- **Tests**: Vitest

> Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function
> from `middleware` to `proxy`; that is why routing/auth interception lives in
> `src/proxy.ts`.

### Legacy Feature Reference

These features belong to the earlier dashboard-centered application and are not
current roadmap-product commitments.

- **LifeStat Matrix**: Dynamic radar chart visualization of user skills
- **Adventure Mode**: Real-world goal setting and retrospective reflection
- **Architect Mode**: Simulation and "what-if" scenario planning
- **Peer Comparison**: Anonymous, healthy benchmarking with age-appropriate cohorts
- **Family Mode**: Parent-child interaction with privacy controls
- **Path System**: Predefined and user-created growth paths

## 📁 Legacy Web Project Structure

```
prisma/
└── schema.prisma           # Prisma models (datasource URL comes from prisma.config.ts)
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # Route handlers
│   ├── architect/          # Architect (simulation) mode
│   ├── dashboard/          # Main dashboard
│   ├── family/             # Family mode
│   └── login/ register/ onboarding/
├── components/             # React components, grouped by feature
│   └── ui/                 # Shared design-system primitives
├── contexts/               # React context providers
├── hooks/                  # Shared hooks
├── lib/                    # Core utilities
│   ├── auth.ts             # Authentication service
│   ├── db.ts               # Neon HTTP driver
│   ├── prisma.ts           # Prisma client + driver adapter
│   ├── simulation.ts       # Architect-mode forecast maths
│   ├── simulation.test.ts  # Vitest unit tests for the forecast
│   └── init-db.ts          # Database initialization
├── generated/prisma/       # Generated Prisma client (gitignored)
├── types/                  # Shared TypeScript types
└── proxy.ts                # Route protection (formerly middleware.ts)
```

## 🔒 Legacy Web Security & Privacy

- **Child Privacy**: COPPA and GDPR oriented data handling
- **Anonymous Comparisons**: No personally identifiable information in peer data
- **Secure Authentication**: JWT tokens with HTTP-only cookies
- **Family Mode**: Transparent parent-child interactions with child consent

## 🧪 Testing

```bash
npm run mobile:verify    # V2 unit tests, types, lint, Expo Doctor
npm run mobile:test:e2e  # V2 browser interaction suite
npm run legacy:verify    # Legacy tests, types, lint, production build
npm run verify           # Both non-E2E verification suites
```

V2 unit tests live beside the platform-neutral domain code in `apps/mobile/src/domain`. Playwright tests live in `apps/mobile/e2e` and cover the Atlas at phone, tablet, and desktop sizes. Legacy unit tests live next to the code they cover as `*.test.ts`.

## 📊 Legacy Web Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User profiles and basic information
- `user_interests` - Skills and commitment levels
- `goals` - User-set goals and promises
- `retrospectives` - Reflection sessions and progress updates
- `cohort_stats` - Anonymous comparison data
- `predefined_paths` - Growth paths and progressions
- `family_relationships` - Parent-child connections
- `simulation_scenarios` - Saved Architect-mode scenarios

## 🚀 Legacy Web Deployment

The app is designed to deploy on Vercel with:

1. Automatic deployments from Git
2. Neon database for production
3. Vercel KV for scenario caching

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new logic
3. Keep `npm run lint`, `npm run type-check` and `npm test` green
4. Never commit secrets — `.env*` is gitignored

## 📝 License

This project is private and proprietary.
