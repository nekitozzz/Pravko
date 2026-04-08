# Browser Testing Steps

Manual checklist for verifying Pravko in the browser after code changes.

## Prerequisites

Start infrastructure and servers:

```bash
# From project root /Users/nikita/RuClaude/Pravko

# 1. Start Docker services (postgres, redis, logto)
docker compose up postgres redis -d

# 2. Start backend (must source .env first — server/ has no dotenv auto-load)
set -a && source .env && set +a && cd server && npm run dev
# Expected: "Server listening at http://0.0.0.0:3000"

# 3. Start frontend (separate terminal, from project root)
bun run dev
# Expected: "Local: http://localhost:5296/"
```

Logto admin console: `http://localhost:4001`
Test account: username `testuser`, password `TestPravko2024!`

## 1. Homepage

- [ ] Open `http://localhost:5296/`
- [ ] Page renders (marketing homepage with "ПРАВКО" branding)
- [ ] "ВОЙТИ" (Login) button visible in header
- [ ] No console errors

## 2. Login Flow

- [ ] Click "ВОЙТИ" — redirects to Logto sign-in (`http://localhost:4001/sign-in/...`)
- [ ] Enter credentials, submit
- [ ] Redirects back to `/dashboard`
- [ ] Dashboard loads (not stuck on "Загрузка..." / Loading)
- [ ] No infinite re-render loop (check: page doesn't flicker, CPU is normal)
- [ ] User avatar visible in top-right header

## 3. Team Creation

- [ ] If no teams exist: "СОЗДАЙТЕ СВОЮ ПЕРВУЮ КОМАНДУ" empty state shown
- [ ] Click "+ СОЗДАТЬ КОМАНДУ" — dialog opens
- [ ] Type team name, click "СОЗДАТЬ КОМАНДУ"
- [ ] Redirects to `/dashboard/<team-slug>`
- [ ] Team page loads with header showing team name

### Billing bypass (local dev only)

New teams have no subscription. To bypass for testing:

```bash
docker exec pravko-postgres-1 psql -U pravko -d pravko \
  -c "UPDATE teams SET billing_status = 'active' WHERE slug = '<team-slug>';"
```

Then reload the page. The billing banner should disappear and "+ НОВЫЙ ПРОЕКТ" button appears.

## 4. Project Creation

- [ ] Click "+ СОЗДАТЬ ПРОЕКТ" (or "+ НОВЫЙ ПРОЕКТ" in header)
- [ ] Dialog opens with project name input
- [ ] Type name, click "СОЗДАТЬ"
- [ ] Redirects to project page `/dashboard/<team>/<project-uuid>`
- [ ] Upload zone visible ("Перетащите видео или нажмите для загрузки")

## 5. Team Page — Project List

- [ ] Navigate back to team page (click team name in breadcrumb)
- [ ] Project card shows with name, video count, "Открыть проект" link
- [ ] Navigation between team and project pages works

## 6. Header Navigation

- [ ] Breadcrumb links work (Правко → dashboard, team-slug → team page, project name → project)
- [ ] Settings gear icon works
- [ ] User avatar menu works (if present)
- [ ] Theme toggle (light/dark) works

## 7. Video Upload (requires S3 configured)

- [ ] Click upload zone or "ЗАГРУЗИТЬ" button
- [ ] File picker opens, select a video file
- [ ] Upload progress indicator appears
- [ ] After upload: video appears in project list
- [ ] Video page opens with player

## 8. Sign Out

- [ ] Click user avatar → sign out
- [ ] Redirects to sign-in page
- [ ] Visiting `/dashboard` redirects to sign-in

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Загрузка..." forever | `getAccessToken()` not getting JWT | Check `VITE_API_URL` env var matches Logto resource |
| 401 on all API calls | Server missing env vars | Start server with `set -a && source .env && set +a` |
| "invalid input syntax for type uuid" on login | Logto nanoid IDs vs UUID columns | Run ALTER TABLE migrations (users.id → TEXT) |
| Infinite re-render / high CPU | `isLoading` toggling from `getAccessToken()` | Use `initialAuthResolved` pattern in dashboard layout |
| "too many clients already" | PostgreSQL connection exhaustion from retry storms | Fix root API errors first, restart server |
| Route conflict "upload-targets" | `/api/projects/:id` matching before upload-targets | Ensure `/api/projects/upload-targets` route registered first |
