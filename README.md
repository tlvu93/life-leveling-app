# Life Leveling App

A playful, game-like application designed to help kids, teens, and adults set life goals, simulate possible growth paths, and compare themselves with peers in a healthy, non-pressured environment.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon Database account (PostgreSQL)
- Vercel account (for KV and Blob storage)

### Environment Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment variables template:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your actual values:

```env
# Database - Get from Neon Dashboard
DATABASE_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"

# Vercel KV - Get from Vercel Dashboard
KV_URL="redis://[kv-url]"
KV_REST_API_URL="https://[kv-rest-api-url]"
KV_REST_API_TOKEN="[kv-rest-api-token]"

# Vercel Blob Storage - Get from Vercel Dashboard
BLOB_READ_WRITE_TOKEN="[blob-token]"

# Authentication - Generate secure secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Setup

1. Start the development server:

```bash
npm run dev
```

2. Initialize the database schema:

```bash
npm run db:init
```

3. Check database health:

```bash
npm run db:health
```

### Development

The app will be available at [http://localhost:3000](http://localhost:3000).

## 🏗️ Architecture

### Tech Stack

- **Frontend & Backend**: Next.js 14+ with App Router
- **Database**: Neon (PostgreSQL)
- **Cache & Sessions**: Vercel KV (Redis)
- **File Storage**: Vercel Blob Storage
- **Styling**: Tailwind CSS
- **Charts**: D3.js
- **Authentication**: JWT with HTTP-only cookies

### Key Features

- **LifeStat Matrix**: Dynamic radar chart visualization of user skills
- **Adventure Mode**: Real-world goal setting and retrospective reflection
- **Architect Mode**: Simulation and "what-if" scenario planning
- **Peer Comparison**: Anonymous, healthy benchmarking with age-appropriate cohorts
- **Family Mode**: Parent-child interaction with privacy controls
- **Path System**: Predefined and user-created growth paths

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── login/            # Authentication pages
│   └── register/
├── lib/                   # Core utilities
│   ├── auth.ts           # Authentication service
│   ├── db.ts             # Database connection
│   ├── kv.ts             # Redis/KV utilities
│   ├── init-db.ts        # Database initialization
│   └── schema.sql        # Database schema
├── types/                 # TypeScript type definitions
└── components/           # Reusable React components
```

## 🔒 Security & Privacy

- **Child Privacy**: COPPA and GDPR compliance
- **Anonymous Comparisons**: No personally identifiable information in peer data
- **Secure Authentication**: JWT tokens with HTTP-only cookies
- **Data Encryption**: At rest and in transit
- **Family Mode**: Transparent parent-child interactions with child consent

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests (when implemented)
npm test
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User profiles and basic information
- `user_interests` - Skills and commitment levels
- `goals` - User-set goals and promises
- `retrospectives` - Reflection sessions and progress updates
- `cohort_stats` - Anonymous comparison data
- `predefined_paths` - Growth paths and progressions
- `family_relationships` - Parent-child connections

## 🚀 Deployment

The app is designed to deploy on Vercel with:

1. Automatic deployments from Git
2. Neon database for production
3. Vercel KV for session management
4. Vercel Blob for file storage

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure privacy and security best practices

## 📝 License

This project is private and proprietary.
