# Pravko

Video review platform for creative teams. Upload videos, leave frame-accurate timestamped comments, manage team roles, and share review links.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TanStack Router, TanStack Query, Tailwind CSS v4 |
| Backend | Fastify, Drizzle ORM, PostgreSQL 16 |
| Auth | Logto (self-hosted OIDC) |
| Video | FFmpeg HLS transcoding, HLS.js player |
| Storage | S3-compatible (Beget S3) |
| Real-time | WebSocket with Redis pub/sub |
| Payments | YooKassa |
| Queue | BullMQ (Redis) |
| Infra | Docker Compose, Nginx |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/) 1.3.6+ (frontend)
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [FFmpeg](https://ffmpeg.org/) (on the worker machine for transcoding)
- S3-compatible storage bucket (Beget, MinIO, AWS, etc.)

## Quick Start (Docker Compose)

Start all services at once — suitable for production or a quick demo.

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — fill in all required values (see Environment Variables below)

# 2. Start infrastructure
docker compose up -d

# 3. Create the Logto database (first run only)
docker exec -it pravko-postgres-1 createdb -U pravko logto

# 4. Restart Logto so it initializes its database
docker compose restart logto

# 5. Open Logto admin console to create an application
#    http://localhost:4002
#    - Create a "Single Page App" → copy App ID into VITE_LOGTO_APP_ID and LOGTO_APP_ID
#    - Set redirect URI: https://yourdomain.ru/callback
#    - Set post-logout redirect URI: https://yourdomain.ru
```

The app is now available at `http://localhost` (Nginx on port 80).

## Local Development

For day-to-day development, run the database and Redis in Docker and everything else natively.

### 1. Start infrastructure services

```bash
docker compose up postgres redis -d
```

### 2. Create the Logto database (first run only)

```bash
docker exec -it pravko-postgres-1 createdb -U pravko logto
```

### 3. Start Logto locally (or in Docker)

```bash
docker compose up logto -d
# Admin console: http://localhost:4002
# Auth endpoint: http://localhost:4001
```

Create a "Single Page App" in the Logto admin console. Set:
- Redirect URI: `http://localhost:5296/callback`
- Post-logout redirect URI: `http://localhost:5296`
- Copy the App ID into your `.env` as `VITE_LOGTO_APP_ID` and `LOGTO_APP_ID`

### 4. Initialize the database

```bash
cd server
npm install
npm run migrate
```

### 5. Configure environment

```bash
cp .env.example .env
```

Fill in the values — see [Environment Variables](#environment-variables) below.

### 6. Start the backend

```bash
cd server
npm run dev          # API server on port 4000
npm run dev:worker   # Transcode worker (separate terminal)
```

### 7. Start the frontend

```bash
bun install
bun run dev          # Dev server on port 5296
```

Open `http://localhost:5296`.

## Environment Variables

Copy `.env.example` and fill in the values:

| Variable | Description |
|----------|-------------|
| **PostgreSQL** | |
| `POSTGRES_DB` | Database name (default: `pravko`) |
| `POSTGRES_USER` | Database user (default: `pravko`) |
| `POSTGRES_PASSWORD` | Database password |
| `LOGTO_DB` | Logto database name (default: `logto`) |
| **App** | |
| `DATABASE_URL` | Full Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `PUBLIC_URL` | Public-facing app URL (e.g. `https://yourdomain.ru`) |
| **Logto Auth** | |
| `LOGTO_ENDPOINT` | Logto server URL |
| `LOGTO_ADMIN_ENDPOINT` | Logto admin console URL |
| `LOGTO_APP_ID` | Logto application ID |
| `LOGTO_APP_SECRET` | Logto application secret |
| **S3 Storage** | |
| `S3_ENDPOINT` | S3-compatible endpoint URL |
| `S3_REGION` | S3 region (default: `ru-1`) |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |
| `S3_BUCKET` | Bucket name |
| `S3_PUBLIC_URL` | Public URL for the bucket (for HLS playback) |
| **YooKassa** | |
| `YOOKASSA_SHOP_ID` | YooKassa shop ID |
| `YOOKASSA_SECRET_KEY` | YooKassa secret key |
| `YOOKASSA_WEBHOOK_SECRET` | Webhook verification secret |
| `YOOKASSA_BASIC_PRICE_RUB` | Basic plan price (default: 500) |
| `YOOKASSA_PRO_PRICE_RUB` | Pro plan price (default: 2500) |
| **Frontend (Vite)** | |
| `VITE_API_URL` | API base URL (default: `/api`) |
| `VITE_WS_URL` | WebSocket URL (e.g. `ws://localhost:4000/ws`) |
| `VITE_LOGTO_ENDPOINT` | Logto endpoint for frontend |
| `VITE_LOGTO_APP_ID` | Logto app ID for frontend |
| `VITE_S3_PUBLIC_URL` | S3 public URL for video playback |

## Project Structure

```
Pravko/
├── app/
│   ├── routes/                 # TanStack Router file-based routes
│   │   ├── __root.tsx          # Root layout (providers, auth)
│   │   ├── -home.tsx           # Landing page
│   │   ├── -pricing.tsx        # Pricing page
│   │   ├── -share.tsx          # Public share view
│   │   ├── -watch.tsx          # Public video view
│   │   ├── -invite.tsx         # Team invite acceptance
│   │   ├── auth/               # Auth callback routes
│   │   └── dashboard/          # Authenticated app
│   │       ├── $teamSlug/
│   │       │   └── $projectId/
│   │       │       └── $videoId.tsx
│   │       └── -settings.tsx
│   ├── app.tsx                 # App entry
│   └── app.css                 # Global styles + theme variables
├── src/
│   ├── components/
│   │   ├── ui/                 # Radix UI primitives (Button, Dialog, etc.)
│   │   ├── comments/           # Comment system components
│   │   ├── video-player/       # HLS.js video player
│   │   ├── teams/              # Team management
│   │   └── ...                 # Feature components
│   └── lib/
│       ├── api.ts              # Typed REST API client
│       ├── queryClient.ts      # TanStack Query client
│       ├── providers.tsx        # Logto + Query providers
│       ├── useSubscription.ts  # WebSocket real-time hook
│       ├── playback.ts         # S3 HLS URL builders
│       └── utils.ts            # Shared utilities
├── server/
│   ├── index.ts                # Fastify entry point
│   ├── plugins/                # Fastify plugins (auth, db, redis, s3, ws)
│   ├── routes/                 # API route handlers
│   │   ├── teams.ts            # Team CRUD + members + invites
│   │   ├── projects.ts         # Project CRUD
│   │   ├── videos.ts           # Video CRUD + upload + playback
│   │   ├── comments.ts         # Threaded comments
│   │   ├── share.ts            # Share links + access grants
│   │   ├── billing.ts          # YooKassa integration
│   │   └── workspace.ts        # Navigation context resolution
│   ├── services/               # Business logic (transcode, storage, billing)
│   ├── worker/
│   │   └── transcodeWorker.ts  # BullMQ FFmpeg worker
│   ├── db/
│   │   ├── schema.ts           # Drizzle ORM schema
│   │   ├── schema.sql          # Raw SQL DDL
│   │   └── migrate.ts          # Migration runner
│   └── lib/                    # Rate limiting, auth helpers
├── docker-compose.yml
├── nginx.conf
├── vite.config.ts
└── .env.example
```

## Commands

### Frontend

```bash
bun install              # Install dependencies
bun run dev              # Dev server (port 5296)
bun run build            # Production build
bun run start            # Preview production build
bun run typecheck        # TypeScript check
bun run lint             # ESLint
bun run i18n:extract     # Extract translation strings
bun run i18n:compile     # Compile translations
```

### Backend (`server/`)

```bash
cd server
npm install              # Install dependencies
npm run dev              # API server with hot reload
npm run dev:worker       # Transcode worker with hot reload
npm run build            # Compile TypeScript
npm run start            # Production API server
npm run start:worker     # Production transcode worker
npm run migrate          # Run database migrations
npm run typecheck        # TypeScript check
```

### Infrastructure

```bash
docker compose up -d                              # Dev: all services + exposed ports + mailpit/minio
docker compose -f docker-compose.yml up -d        # Production: only nginx exposes 80/443
docker compose up postgres redis -d               # Start only DB + Redis
docker compose logs -f api                        # Follow API logs
docker compose restart api                        # Restart API
```

## S3 Bucket Setup

Create a bucket with the following structure (directories are created automatically on upload):

```
bucket/
├── raw/{videoId}/          # Original uploads
├── hls/{videoId}/          # HLS master playlist + segments
│   ├── master.m3u8
│   ├── 360p/
│   ├── 720p/
│   └── 1080p/
└── thumb/{videoId}/        # Thumbnails
```

Set CORS on the bucket to allow frontend upload and HLS playback:

```json
{
  "AllowedOrigins": ["https://yourdomain.ru"],
  "AllowedMethods": ["GET", "PUT", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 86400
}
```

## Video Pipeline

1. Frontend requests a presigned upload URL from the API
2. Frontend uploads the raw file directly to S3 (`raw/{videoId}/`)
3. Frontend notifies the API that upload is complete
4. API enqueues a BullMQ transcode job
5. Worker picks up the job, downloads from S3, runs FFmpeg:
   - Generates adaptive bitrate HLS (360p, 720p, 1080p)
   - Generates thumbnail at 1s mark
   - Uploads HLS segments + playlists + thumbnail to S3
6. Worker updates video status to `ready`
7. Frontend player loads `{S3_PUBLIC_URL}/hls/{videoId}/master.m3u8` via HLS.js

## Deployment

### Production (single VPS)

```bash
# Build frontend
cd Pravko && bun run build

# Build server
cd server && npm run build

# Start everything (production — no host ports except nginx 80/443)
docker compose -f docker-compose.yml up -d
```

### Nginx

The included `nginx.conf` handles:
- Static SPA files with cache headers
- API proxy (`/api/` → Fastify on port 4000)
- WebSocket upgrade (`/ws` → Fastify)
- Logto auth proxy (`/auth/` → Logto on port 4001)
- 5GB upload limit (`client_max_body_size`)

For HTTPS, add SSL certificates and update the Nginx config or use a reverse proxy like Caddy.

## Architecture Notes

- **Real-time**: WebSocket at `/ws` with channel-based subscriptions. After any mutation, Redis pub/sub fans out to subscribed clients. TanStack Query cache is invalidated on update, giving a live-query feel.
- **Auth**: Logto OIDC with JWT verification on the backend via JWKS. Role-based access: owner > admin > member > viewer.
- **Billing**: YooKassa recurring payments. Plans: basic (800 RUB/mo, 100GB) and pro (3700 RUB/mo, 1TB).
- **Videos**: Dual ID system — `publicId` for URLs, `id` (UUID) internally. Status flow: `uploading` → `processing` → `ready` / `failed`. Workflow status: `review` / `rework` / `done`.
