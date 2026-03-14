# AI Video Repurposer

AI-powered platform to transform long-form videos into short, viral clips.

## Quick Start

```bash
pnpm install
cp .env.example .env.local    # Fill in your values
pnpm drizzle-kit migrate
pnpm dev
```

→ http://localhost:3002

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (Postgres) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Schema/Migrations** | Drizzle ORM |
| **AI** | OpenAI (GPT-4 Vision, Whisper) |
| **Package Manager** | pnpm |

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages
│   └── (dashboard)/       # Dashboard pages
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Drizzle schema definitions
│   │   └── index.ts       # Drizzle client
│   ├── supabase/          # Supabase clients (server/browser)
│   └── database.types.ts  # Auto-generated Supabase types
├── drizzle/               # Migration files
└── drizzle.config.ts      # Drizzle configuration
```

## Getting Started

### 1. Install

```bash
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Get from |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database (Pooler) |
| `OPENAI_API_KEY` | platform.openai.com (optional) |

**Note:** Vercel auto-injects `VERCEL_URL` for deployment URLs - no manual setup needed.

### 3. Run Migrations

```bash
pnpm drizzle-kit migrate
```

### 4. Start Dev Server

```bash
pnpm dev
```

App runs at `http://localhost:3002`

## Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm lint                   # Run ESLint

# Database
pnpm drizzle-kit generate   # Create migration
pnpm drizzle-kit migrate    # Apply migrations
pnpm drizzle-kit studio     # Open DB GUI
```

## Database Workflow

1. Edit `lib/db/schema.ts`
2. `pnpm drizzle-kit generate`
3. `pnpm drizzle-kit migrate`
4. `npx supabase gen types typescript --project-id <id> > lib/database.types.ts`

## Deployment

Auto-deploys to Vercel on push to `main`.

**Note:** Set `NEXT_PUBLIC_*` env vars in all Vercel environments (Production, Preview, Development) so they embed at build time.

**Note:** Set `NEXT_PUBLIC_*` env vars in all Vercel environments (Production, Preview, Development) so they embed at build time.
