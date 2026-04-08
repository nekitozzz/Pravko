# Production Deployment Checklist

Everything you need to do before deploying Pravko to production.

---

## 1. Environment Variables

Set all variables in your production `.env`. Never use defaults from `.env.example` in production.

### Required — will break if missing

| Variable | What to set | Notes |
|----------|-------------|-------|
| `PUBLIC_URL` | `https://pravko.ru` | Used for CORS origin, must match your domain exactly |
| `VITE_SITE_URL` | `https://pravko.ru` | Used for SEO canonical URLs, sitemap, robots.txt |
| `VITE_API_URL` | `/api` or `https://pravko.ru/api` | Frontend API endpoint |
| `VITE_WS_URL` | `wss://pravko.ru/ws` | Must be `wss://` in production (not `ws://`) |
| `VITE_LOGTO_ENDPOINT` | `https://pravko.ru/auth` | Public Logto endpoint |
| `VITE_LOGTO_APP_ID` | Your Logto app ID | From Logto admin console |
| `DATABASE_URL` | `postgres://user:STRONG_PASSWORD@host:4432/pravko` | Use a strong password |
| `POSTGRES_PASSWORD` | A strong random password (32+ chars) | **Change from `changeme`** |
| `LOGTO_ENDPOINT` | `http://logto:3001` (internal) or your Logto URL | Server-side Logto endpoint |
| `LOGTO_APP_ID` | Your Logto app ID | |
| `LOGTO_APP_SECRET` | Your Logto app secret | Keep secret |
| `S3_ACCESS_KEY` | Beget S3 access key | |
| `S3_SECRET_KEY` | Beget S3 secret key | Keep secret |
| `S3_BUCKET` | Your S3 bucket name | |
| `S3_PUBLIC_URL` | `https://s3.beget.com/your-bucket` | Public URL for video playback |
| `YOOKASSA_SHOP_ID` | Your YooKassa shop ID | |
| `YOOKASSA_SECRET_KEY` | Your YooKassa secret key | Keep secret |
| `NODE_ENV` | `production` | Disables dev logging, closes CORS |

### Optional

| Variable | Default | Notes |
|----------|---------|-------|
| `LOG_LEVEL` | `info` | Use `warn` in production to reduce noise |
| `PORT` | `3000` | API server port (internal) |
| `REDIS_URL` | `redis://localhost:4380` | Add password if Redis is exposed |

---

## 2. HTTPS / TLS

The current `nginx.conf` serves HTTP only. You **must** add TLS before going live.

**Option A — Let's Encrypt (recommended):**

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d pravko.ru -d www.pravko.ru
```

**Option B — Add to nginx.conf manually:**

```nginx
server {
    listen 443 ssl http2;
    server_name pravko.ru;

    ssl_certificate     /etc/letsencrypt/live/pravko.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pravko.ru/privkey.pem;

    # ... existing location blocks ...
}

server {
    listen 80;
    server_name pravko.ru;
    return 301 https://$host$request_uri;
}
```

**Verify:** `VITE_WS_URL` must use `wss://` (not `ws://`) once TLS is enabled.

---

## 3. Database Security

- [ ] Change `POSTGRES_PASSWORD` from `changeme` to a strong random password
- [ ] Ensure PostgreSQL only listens on `127.0.0.1` or Docker internal network (already done in `docker-compose.yml`)
- [ ] Enable connection SSL if database is on a separate host
- [ ] Set up automated backups (daily minimum)
- [ ] Test backup restoration

---

## 4. Redis Security

- [ ] Set a password: add `--requirepass YOUR_PASSWORD` to the Redis command in `docker-compose.yml`
- [ ] Update `REDIS_URL` to include the password: `redis://:YOUR_PASSWORD@localhost:6379`
- [ ] Ensure Redis only listens on `127.0.0.1` (already done in `docker-compose.yml`)

---

## 5. S3 Storage

- [ ] Verify S3 bucket CORS `AllowedOrigins` is set to `https://pravko.ru` (not `*`)
- [ ] Enable bucket versioning for accidental deletion recovery
- [ ] Verify `S3_PUBLIC_URL` is accessible from end users' browsers
- [ ] Test video upload + playback end-to-end

---

## 6. YooKassa Payments

- [ ] Switch from YooKassa test mode to live mode
- [ ] Set `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY` to live credentials
- [ ] Register webhook URL in YooKassa dashboard: `https://pravko.ru/api/yookassa/webhook`
- [ ] Verify nginx IP whitelist matches current YooKassa IPs (see `nginx.conf`)
- [ ] Test a real payment end-to-end

---

## 7. Logto Authentication

- [ ] Configure Logto with your production domain
- [ ] Set redirect URIs to `https://pravko.ru/callback` in Logto admin console
- [ ] Set post-logout redirect URI to `https://pravko.ru`
- [ ] Verify `LOGTO_APP_SECRET` is set (empty in dev)

---

## 8. Build & Deploy

```bash
# 1. Install dependencies
bun install

# 2. Build frontend (generates static files + Vite bundle)
bun run build

# 3. Build server
cd server && npm run build

# 4. Run database migrations
cd server && npm run migrate

# 5. Start everything (production — skip override, only nginx exposes 80/443)
docker compose -f docker-compose.yml up -d
```

---

## 9. DNS & Domain

- [ ] Point `pravko.ru` A record to your server IP
- [ ] Add `www.pravko.ru` CNAME → `pravko.ru` (or redirect in nginx)
- [ ] Verify `VITE_SITE_URL` matches the domain

---

## 10. Monitoring

- [ ] Set up uptime monitoring for `https://pravko.ru/api/health`
- [ ] Monitor disk space (video transcoding creates temp files)
- [ ] Set up log aggregation or at minimum log rotation
- [ ] Monitor Redis memory usage (rate limiting, BullMQ queues)
- [ ] Monitor PostgreSQL connection pool

---

## 11. Post-Deploy Verification

- [ ] Homepage loads with correct fonts (no external CDN requests)
- [ ] Sign up / sign in flow works
- [ ] Video upload → transcode → playback works end-to-end
- [ ] Share link creation and access works (with and without password)
- [ ] Comments with timestamps work
- [ ] Payment checkout flow works
- [ ] WebSocket real-time updates work
- [ ] OG images render correctly when shared on social media
- [ ] `robots.txt` and `sitemap.xml` show correct domain
- [ ] No mixed content warnings (HTTP resources on HTTPS page)
