# Deployment

## Target: Timeweb VPS + Beget S3

### Server requirements

- 4 vCPU / 8GB RAM / 80GB NVMe (Timeweb ~1,980 RUB/mo)
- Ubuntu 22.04+ or Debian 12+
- Docker & Docker Compose installed

### Storage

- Beget S3 bucket (~2.10 RUB/GB/mo, unlimited egress)
- Configure CORS on the bucket to allow frontend direct upload + HLS playback

### 1. Clone and configure

```bash
git clone <repo-url> /opt/pravko
cd /opt/pravko
cp .env.example .env
# Edit .env with production values
```

### 2. Create Logto database

```bash
docker compose up postgres -d
docker exec -it pravko-postgres-1 createdb -U pravko logto
```

### 3. Start all services

```bash
# Production — only nginx exposes ports 80/443, everything else is internal
docker compose -f docker-compose.yml up -d
```

### 4. Set up Logto

Open `https://yourdomain.ru:4002` (or tunnel) to configure:
- Create SPA application, save `LOGTO_APP_ID`
- Create M2M application, save `LOGTO_APP_SECRET`
- Update `.env` and restart: `docker compose restart api`

### 5. Build and deploy frontend

```bash
cd /opt/pravko
bun install
bun run build
# Static files are served by nginx from /var/www/pravko/dist/
cp -r dist/client/* /var/www/pravko/dist/
```

Or configure a CI/CD pipeline to build and copy on push.

### 6. SSL (recommended)

Install certbot and configure nginx for HTTPS:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.ru
```

## Docker Compose services

| Service | Port (dev) | Port (prod) | Description |
|---------|------------|-------------|-------------|
| `nginx` | 80, 443 | 80, 443 | Reverse proxy, static files, SSL termination |
| `api` | — | — | Fastify API server (internal only) |
| `logto` | 4001, 4002 | — | Auth server (OIDC) + admin console |
| `postgres` | 4432 | — | PostgreSQL 16 database |
| `redis` | 4380 | — | Sessions, rate limiting, job queue, pub/sub |
| `worker` | — | — | FFmpeg transcode worker (BullMQ consumer) |
| `mailpit` | 4025, 4026 | — | Dev-only SMTP catch-all |
| `minio` | 4090, 4091 | — | Dev-only S3 storage |

> Dev ports are exposed by `docker-compose.override.yml` (auto-loaded). Production uses only `docker-compose.yml` where only nginx has host ports.

## YooKassa webhook

Configure YooKassa to send webhook notifications to:

```
https://yourdomain.ru/api/yookassa/webhook
```

Events to enable: `payment.succeeded`, `payment.canceled`, `refund.succeeded`.

For security, whitelist YooKassa's IP addresses in nginx or configure an HMAC webhook secret.

## Estimated monthly cost

| Resource | Cost |
|----------|------|
| Timeweb VPS (4c/8GB) | ~1,980 RUB |
| Beget S3 (500GB) | ~1,050 RUB |
| **Total** | **~3,030 RUB (~$30)** |
