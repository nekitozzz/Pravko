# Setup

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- FFmpeg (installed automatically in Docker, needed locally for worker dev)

## Development

### 1. Start infrastructure

```bash
docker compose up postgres redis -d
```

### 2. Run database migration

```bash
cd server
cp ../.env.example .env   # edit with your local values
npm install
npm run migrate
```

### 3. Set up Logto

```bash
# Create the Logto database
docker exec -it pravko-postgres-1 createdb -U pravko logto

# Start Logto
docker compose up logto -d
```

Open http://localhost:4002 (admin console) to:
- Create a "Single Page App" application (save the App ID)
- Create a "Machine-to-Machine" application for backend API calls
- Configure sign-in methods (email + password)

### 4. Start the API server

```bash
cd server
npm run dev
```

### 5. Start the frontend

```bash
bun install
bun run dev:web
```

### 6. Start the transcode worker (optional, for video processing)

```bash
cd server
npm run dev:worker
```

## Full stack via Docker

```bash
docker compose up -d
```

This starts all services: postgres, redis, logto, api, worker, nginx.

> **Dev vs production**: `docker compose up` auto-loads `docker-compose.override.yml`, which exposes standard ports (5432, 6379, 3001, etc.) and adds dev-only services (mailpit, minio). For production (no host ports except nginx 80/443): `docker compose -f docker-compose.yml up -d`.

## Build / Run

### Frontend

```bash
bun run build
bun run start
```

### Server

```bash
cd server
npm run build
npm run start
```

## Quality checks

```bash
bun run typecheck          # Frontend
cd server && npm run typecheck  # Server
bun run lint               # Frontend lint
```

## Environment variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `LOGTO_ENDPOINT` | Logto OIDC issuer URL |
| `LOGTO_APP_ID` | Logto SPA application ID |
| `LOGTO_APP_SECRET` | Logto M2M application secret |
| `S3_ENDPOINT` | S3-compatible endpoint (e.g. `https://s3.beget.com`) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | S3 credentials |
| `S3_BUCKET` | S3 bucket name |
| `S3_PUBLIC_URL` | Public URL for S3 objects (for HLS playback) |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | YooKassa payment credentials |
| `PUBLIC_URL` | Public URL of the app (e.g. `https://yourdomain.ru`) |
