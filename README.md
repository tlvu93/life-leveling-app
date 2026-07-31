# Life Leveling App

A playful, game-like application designed to help kids, teens, and adults set life goals, simulate possible growth paths, and compare themselves with peers in a healthy, non-pressured environment.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (developed against Node 24)
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

## 🏗️ Architecture

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

### Key Features

- **LifeStat Matrix**: Dynamic radar chart visualization of user skills
- **Adventure Mode**: Real-world goal setting and retrospective reflection
- **Architect Mode**: Simulation and "what-if" scenario planning
- **Peer Comparison**: Anonymous, healthy benchmarking with age-appropriate cohorts
- **Family Mode**: Parent-child interaction with privacy controls
- **Path System**: Predefined and user-created growth paths

## 📁 Project Structure

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

## 🔒 Security & Privacy

- **Child Privacy**: COPPA and GDPR oriented data handling
- **Anonymous Comparisons**: No personally identifiable information in peer data
- **Secure Authentication**: JWT tokens with HTTP-only cookies
- **Family Mode**: Transparent parent-child interactions with child consent

## 🧪 Testing

```bash
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm test             # Vitest
npm run build        # Production build (also type-checks)
```

Unit tests live next to the code they cover as `*.test.ts`. The Architect-mode
forecast maths (`src/lib/simulation.ts`) is the main covered surface.

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User profiles and basic information
- `user_interests` - Skills and commitment levels
- `goals` - User-set goals and promises
- `retrospectives` - Reflection sessions and progress updates
- `cohort_stats` - Anonymous comparison data
- `predefined_paths` - Growth paths and progressions
- `family_relationships` - Parent-child connections
- `simulation_scenarios` - Saved Architect-mode scenarios

## 🚀 Deployment

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
