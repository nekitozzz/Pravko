# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pravko (Правко) — a video review platform for creative teams. Users upload videos, leave frame-accurate timestamped comments, manage team roles, and share review links. Built with React 19, TanStack Start, and a self-hosted backend.

## Commands

### Frontend

```bash
bun install                    # Install dependencies (bun 1.3.6)
bun run dev                    # Dev server (port 5296)
bun run build                  # Production build
bun run start                  # Preview production build on port 5296
bun run typecheck              # TypeScript check (frontend)
bun run lint                   # ESLint across app/ src/
```

### Backend (`server/`)

The `.env` file lives in the project root. Server scripts must be run with env vars loaded:

```bash
cd server
npm install                    # Install server dependencies
npm run dev                    # Run API server with hot reload (tsx watch)
npm run dev:worker             # Run transcode worker with hot reload
npm run build                  # Compile TypeScript
npm run start                  # Start production API server
npm run start:worker           # Start production transcode worker
npm run migrate                # Run database migrations
npm run typecheck              # TypeScript check (server)
```

### Infrastructure

```bash
docker compose up -d           # Start all services (postgres, redis, logto, api, worker, nginx)
docker compose up postgres redis -d  # Start only DB + Redis for local dev
```

No test runner is configured yet.

### Starting / restarting all dev services

When asked to "start", "restart", or "run the server", start **all three** services:

1. **Frontend** — from project root: `bun run dev`
2. **API server** — from `server/`: `set -a && source ../.env && set +a && npm run dev`
3. **Worker** — from `server/`: `set -a && source ../.env && set +a && npm run dev:worker`

Kill existing processes on ports 3456/5296 and any `transcodeWorker` processes before restarting. Run all three as background tasks.

## Architecture

### Frontend (`app/` + `src/`)

- **Routing**: TanStack React Router with file-based routes in `app/routes/`. Running in SPA mode via TanStack Start with selective prerendering for marketing pages.
- **Routes**: Public marketing at root level (`-home.tsx`, `-pricing.tsx`, `-share.tsx`), auth under `auth/`, authenticated app under `dashboard/`. Route pattern: `/dashboard/$teamSlug/$projectId/$videoId`.
- **Components**: `src/components/ui/` has Radix UI primitives styled with `class-variance-authority`. Feature components in `src/components/` (comments, videos, upload, presence, teams).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` (no tailwind config file). Theme colors defined as CSS variables in `app/app.css` with light/dark mode support.
- **API client**: `src/lib/api.ts` — typed fetch wrapper with JWT auth. All REST endpoints mapped to typed functions. Token wired via `setAccessTokenGetter()` in dashboard layout.
- **State**: TanStack Query (`src/lib/queryClient.ts`) for data fetching + caching. WebSocket (`src/lib/useSubscription.ts`) invalidates query cache for real-time feel. Upload state via React context (`src/lib/dashboardUploadContext.tsx`).
- **Auth**: Logto OIDC provider (`@logto/react`), configured in `src/lib/providers.tsx`. `useLogto()` hook for auth state, `getIdTokenClaims()` for user info, `signOut()` for logout.
- **Playback**: `src/lib/playback.ts` builds S3 HLS URLs (`/hls/{videoId}/master.m3u8`) and thumbnail URLs. HLS.js player unchanged.
- **Route prewarming**: Custom `useRoutePrewarmIntent` hook and `src/lib/convexRouteData.ts` (historical name) with `queryClient.prefetchQuery` deduplication.

### Backend (`server/`)

Self-hosted Fastify API server with PostgreSQL, Redis, and S3.

- **Entry**: `server/index.ts` — Fastify server with plugin registration and route mounting.
- **Database**: PostgreSQL 16 via Drizzle ORM. Schema in `server/db/schema.ts`, raw DDL in `server/db/schema.sql`.
- **Auth**: Logto JWT verification via JWKS (`server/plugins/auth.ts`). Role-based access: owner/admin/member/viewer. Access checks in `server/lib/auth.ts`.
- **Routes** (`server/routes/`):
  - `teams.ts` — Team CRUD, members, invites (14 endpoints)
  - `projects.ts` — Project CRUD, upload targets (6 endpoints)
  - `videos.ts` — Video CRUD, upload flow, playback, download (13 endpoints)
  - `comments.ts` — Threaded comments, public/share-grant comments (8 endpoints)
  - `share.ts` — Share links with password protection and rate limiting (7 endpoints)
  - `billing.ts` — YooKassa payment integration (3 endpoints)
  - `workspace.ts` — Context resolution for navigation (1 endpoint)
- **Plugins** (`server/plugins/`): db, redis, auth, s3, ws (WebSocket with presence)
- **Services** (`server/services/`): security (PBKDF2 hashing), storage (S3 presigned URLs), billing (YooKassa), transcode (FFmpeg HLS pipeline)
- **Worker**: `server/worker/transcodeWorker.ts` — BullMQ worker for FFmpeg transcode jobs
- **Real-time**: WebSocket server at `/ws` with channel subscriptions. Channels: `videos:list:{projectId}`, `video:{videoId}`, `comments:{videoId}`, `presence:{videoId}`
- **Video pipeline**: Upload to S3 via presigned URLs → transcode via FFmpeg (BullMQ) → HLS segments to S3. Video status: uploading → processing → ready → failed. Workflow status: review/rework/done.
- **Billing**: YooKassa integration for Russian payments. Plans: basic (800 RUB/mo, 100GB) / pro (3700 RUB/mo, 1TB). Pricing constants defined in `src/lib/product.ts` (frontend) and `server/services/billing.ts` (backend).

### Infrastructure

- **Docker Compose** (`docker-compose.yml`): postgres, redis, logto, api, worker, nginx
- **Nginx** (`nginx.conf`): Reverse proxy for API, WebSocket upgrade, Logto auth, static SPA files
- **Storage**: Beget S3 (unlimited egress). Bucket structure: `raw/`, `hls/`, `thumb/`
- **Config**: `.env.example` for all environment variables (server + `VITE_` frontend vars)

### Key Patterns

- REST API with TanStack Query on frontend for data fetching + caching.
- WebSocket subscriptions invalidate TanStack Query cache for real-time feel.
- Optimistic updates throughout — prioritize perceived performance.
- Share links use token-based access with optional password protection and expiration.
- Videos have both a `publicId` (for URLs) and internal `id` (UUID).
- RBAC role hierarchy: owner > admin > member > viewer.

## Development Philosophies

1. **Performance above all else** — optimistic updates, route prewarming on hover, avoid data-fetching waterfalls.
2. **Good defaults** — things should work well out of the box with minimal configuration.
3. **Convenience** — all links are share links by default, homepage to latest video in <4 clicks, minimize blocking states.
4. **Security** — always check team/user status before mutations. Be very careful with publicly exposed endpoints.

## Design Language

Brutalist, typographic, minimal — like a poster, not a dashboard.

- **Colors**: Background `#f0f0e8` (warm cream), text `#1a1a1a`, accent `#2d5a2d` (deep forest green), highlight `#7cb87c`. Dark mode uses deep olive/charcoal backgrounds.
- **Typography**: Font-black (900) headings with tight tracking, dramatic size contrast. Fonts: Geist Sans/Mono, Instrument Serif.
- **Borders**: Strong 2px `#1a1a1a` borders for cards/dividers. No gradients, no shadows, no rounded corners on primary UI.
- **Buttons**: Solid backgrounds, bold text, clear hover states.
- **Spacing**: Generous padding (p-6 to p-8). Let whitespace create hierarchy.
- Use green sparingly as accent. No decorative icons — only functional ones.
