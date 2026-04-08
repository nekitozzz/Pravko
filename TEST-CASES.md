# Pravko — Test Cases

**Last updated:** 2026-03-03
**Environment:** localhost:5296 (Vite dev), localhost:3456 (API), Chrome

## Summary

### Phase 1: Translation & Visual (2026-02-28)

| Status | Count |
|--------|-------|
| PASS   | 18    |
| FAIL (fixed) | 3 |
| KNOWN ISSUE  | 1 |

### Phase 2: Functional & Edge Cases (2026-03-03)

| Status | Count |
|--------|-------|
| PASS   | 25    |
| FINDING (fixed) | 3 |

---

## Test Cases

### TC-01: Homepage (`/`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 01.1 | Load homepage | Page title in Russian | "Правко — видеоревью для креативных команд" | PASS |
| 01.2 | Check nav bar | All nav items translated | "ЦЕНЫ СРАВНЕНИЕ ВОЙТИ НАЧАТЬ" | PASS |
| 01.3 | Check hero section | Heading, subtitle, CTA in Russian | "ВИДЕОРЕВЬЮ ДЛЯ КРЕАТИВНЫХ КОМАНД", "МЕНЬШЕ ФУНКЦИЙ. БЕЗ ЕРУНДЫ.", "$5/мес", "ПОПРОБОВАТЬ БЕСПЛАТНО →" | PASS |
| 01.4 | Check value props | 4 cards translated | "OPEN SOURCE", "РЕАЛЬНО БЫСТРЫЙ", "ФИКСИРОВАННАЯ ЦЕНА", "ПРОСТОЙ ШАРИНГ" with Russian descriptions | PASS |
| 01.5 | Check how-it-works | 3 steps translated | "ЗАГРУЗИТЬ", "ПОДЕЛИТЬСЯ", "РЕВЬЮ" with "ШАГ" labels | PASS |
| 01.6 | Check competitor section | Comparison table translated | Frame.io cons/Правко pros all in Russian, "$1 080" savings | PASS |
| 01.7 | Check pricing section | Plan cards translated | Basic/Pro with "Безлимит мест/проектов/клиентов", "ПОДКЛЮЧИТЬ BASIC/PRO" | PASS |
| 01.8 | Check footer | All links translated | "ПРОДУКТ", "СРАВНЕНИЕ", "КЕЙСЫ", "OPEN SOURCE" sections | PASS |
| 01.9 | Console errors | No JS errors | None | PASS |

### TC-02: Pricing (`/pricing`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 02.1 | Load pricing | Title translated | "Цены — $5/месяц, безлимит мест \| Правко" | PASS |
| 02.2 | Check hero | Heading and subtitle Russian | "ЦЕНЫ." / "$5/месяц. Не за пользователя..." | PASS |
| 02.3 | Check plan cards | Features translated | "Безлимит мест/проектов/клиентов", "100 ГБ / 1 ТБ хранилища" | PASS |
| 02.4 | Check FAQ | All Q&A translated | 5 questions with natural Russian answers | PASS |
| 02.5 | Check CTA | Bottom CTA translated | "ВСЁ ЕЩЁ ЧИТАЕТЕ?" / "ПОПРОБОВАТЬ БЕСПЛАТНО" | PASS |

### TC-03: Compare Frame.io (`/compare/frameio`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 03.1 | Load page | Title translated | "Правко vs Frame.io — дешевле, быстрее, проще" | PASS |
| 03.2 | Check hero | Translated with personality | "МЫ НЕ ЛУЧШЕ. МЫ ДЕШЕВЛЕ И БЫСТРЕЕ." | PASS |
| 03.3 | Check comparison table | All rows translated | "БИТВА ФУНКЦИЙ." — ЦЕНА, МЕСТА, СКОРОСТЬ, OPEN SOURCE, etc. | PASS |
| 03.4 | Check cost calculator | Translated with humor | "ПОСЧИТАЕМ ЦИФРЫ." — 3/5/10/20 ЧЕЛОВЕК cards | PASS |
| 03.5 | Check advice section | Two columns translated | "ИСПОЛЬЗУЙТЕ FRAME.IO, ЕСЛИ..." / "ПРАВКО ПОДОЙДЁТ, ЕСЛИ..." | PASS |
| 03.6 | Check CTA | Bottom CTA translated | "ПОПРОБОВАТЬ Правко БЕСПЛАТНО" | PASS |

### TC-04: Compare Wipster (`/compare/wipster`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 04.1 | Load page | Title translated | "Правко vs Wipster — проще видеоревью, фиксированная цена" | PASS |
| 04.2 | Check comparison table | All rows translated | "БОК О БОК." — ЦЕНЫ, OPEN SOURCE, СКОРОСТЬ, ОБЩИЙ ДОСТУП, ПРОСТОТА, СОГЛАСОВАНИЯ | PASS |
| 04.3 | Check cost calculator | Translated | "ПОСЧИТАЕМ ЦИФРЫ." — 3/5/10/25 ЧЕЛОВЕК | PASS |
| 04.4 | Check advice section | Two columns translated | "ИСПОЛЬЗУЙТЕ WIPSTER, ЕСЛИ..." / "ПРАВКО ПОДОЙДЁТ, ЕСЛИ..." | PASS |

### TC-05: For Video Editors (`/for/video-editors`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 05.1 | Load page | Title translated | "Видеоревью для монтажёров — покадровая обратная связь \| Правко" | PASS |
| 05.2 | Check hero | Translated | "ВИДЕОРЕВЬЮ, КОТОРЫМ МОНТАЖЁРЫ ДЕЙСТВИТЕЛЬНО ХОТЯТ ПОЛЬЗОВАТЬСЯ." | PASS |
| 05.3 | Check pain points | 4 cards with "РЕШЕНО" badges | "КЛИЕНТЫ НЕ ЗНАЮТ ТАЙМКОДЫ", "ЗАГРУЗКА, ОЖИДАНИЕ, ТРАНСКОД, ОЖИДАНИЕ", etc. | PASS |
| 05.4 | Check how-it-works | 3 steps translated | "ЗАГРУЗИТЕ МОНТАЖ", "ОТПРАВИТЬ ССЫЛКУ", "СОБРАТЬ И ЭКСПОРТИРОВАТЬ" | PASS |

### TC-06: For Agencies (`/for/agencies`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 06.1 | Load page | Title translated | "Видеоревью для агентств — хватит платить за каждое место \| Правко" | PASS |
| 06.2 | Check hero | Translated | "ХВАТИТ ПЛАТИТЬ ЗА МЕСТО. НАЧИНАЙТЕ ВЫПУСКАТЬ РАБОТУ." | PASS |
| 06.3 | Check pain points | 4 cards translated | "ЖИЗНЬ АГЕНТСТВА И ТАК НЕПРОСТО." section | PASS |
| 06.4 | Check cost table | Savings calculated | 5/10/15+ teams with annual savings in Russian | PASS |

### TC-07: Dashboard (`/dashboard`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 07.1 | Load dashboard | Breadcrumb translated | Initially showed "dashboard" (English) | **FAIL → FIXED** |
| 07.2 | Verify fix | Breadcrumb now Russian | "Правко. / панель управления" | PASS |
| 07.3 | Check team cards | UI elements translated | "НЕ ОПЛАЧЕНА", "Оплата", "Управление командой →", "ПРОЕКТОВ ПОКА НЕТ", "ОТКРЫТЬ КОМАНДУ" | PASS |
| 07.4 | Check buttons | Translated | "+ НОВАЯ КОМАНДА" | PASS |

### TC-08: Team Page (`/dashboard/test-team`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 08.1 | Load team page | Buttons translated | "ОПЛАТА", "УЧАСТНИКИ", "+ НОВЫЙ ПРОЕКТ" | PASS |
| 08.2 | Check project card | Translated | "0 видео", "Открыть проект →" | PASS |

### TC-09: Settings Page (`/dashboard/test-team/settings`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 09.1 | Check breadcrumb | Translated | "Правко. / test-team / настройки" | PASS |
| 09.2 | Check plan info | Labels translated | "ТАРИФ", "ХРАНИЛИЩЕ", "МЕСТА", "АКТИВНА", "Безлимит" | PASS |
| 09.3 | Check plan cards | Translated | "500 ₽/мес", "2500 ₽/мес", "Безлимит мест", storage info | PASS |
| 09.4 | Check members section | Translated | "УЧАСТНИКИ", "+ ПРИГЛАСИТЬ" | PASS |
| 09.5 | Check role display | Role translated | Initially showed "OWNER" (English) | **FAIL → FIXED** |
| 09.6 | Verify role fix | Role now Russian | "ВЛАДЕЛЕЦ" | PASS |
| 09.7 | Check delete section | Translated | "Удалить команду", "Отмените активную подписку...", "УДАЛИТЬ" | PASS |

### TC-10: 404 Page (`/nonexistent`)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 10.1 | Navigate to invalid URL | 404 page in Russian | "КОД ОТВЕТА // 404", "НЕ НАЙДЕНО.", "ВЕРНУТЬСЯ НА ГЛАВНУЮ" | PASS |

### TC-11: Dark/Light Mode

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 11.1 | Toggle to light mode | All text readable, translations intact | Light theme renders correctly, all Russian text preserved | PASS |
| 11.2 | Toggle back to dark mode | Theme toggles cleanly | Dark theme restored, toggle label switches between "Переключить на светлую/тёмную тему" | PASS |

### TC-12: `lang` Attribute

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 12.1 | Check `<html>` lang attribute | `lang="ru"` | Changed from `lang="en"` in Phase 1 | PASS |

---

## Bugs Found & Fixed During Testing

### BUG-01: Missing PO entries for new `t()` strings
- **Severity:** Medium
- **Location:** `src/locales/ru/messages.po`
- **Description:** Phase 1 code changes added `t()` calls for 9 new strings (dashboard, settings, Error, subscription statuses, etc.) but the PO file wasn't updated with translations.
- **Fix:** Ran `bun run i18n:extract`, added translations for all 9 entries, compiled.

### BUG-02: "dashboard" breadcrumb not translated
- **Severity:** Low
- **Location:** `app/routes/dashboard/index.tsx`
- **Description:** Breadcrumb showed English "dashboard" because PO entry was missing.
- **Fix:** Added `msgstr "панель управления"` to PO file.

### BUG-03: "OWNER" role displayed in English on settings page
- **Severity:** Low
- **Location:** `src/components/teams/MemberInvite.tsx`
- **Description:** `getRoleLabel()` function only mapped admin/member/viewer roles, missing "owner". The owner role fell through to raw string.
- **Fix:** Added `owner: t({message: "Owner"})` to the labels map. Existing PO entry "Владелец" was used.

---

## Known Issues (Pre-existing, Not Translation-Related)

### KNOWN-01: React DOM `removeChild` error on route transitions
- **Severity:** Low (cosmetic, auto-recovered by error boundary)
- **Console:** `NotFoundError: Failed to execute 'removeChild' on 'Node'` in `<link>` component
- **Description:** React hydration issue when navigating between routes with different `<head>` `<link>` tags. TanStack Router/React known issue. App recovers automatically via error boundary.

---

## Translation Quality Notes

All translations reviewed in visual context. Key observations:
- **Tone is consistent:** Conversational, witty Russian that matches the brand's personality (e.g., "Мы помешаны на этом до неприличия", "Это целая гора буррито")
- **Technical terms preserved appropriately:** "open source", "NLE", "ProRes", "Mux" kept in English where expected
- **Button sizing:** No overflow observed after `w-auto min-w-28` fix on role dropdown
- **SEO titles all translated:** Every page has a Russian `<title>` tag
- **No untranslated English strings remaining** on any tested page (team/project names are user-created content)

---
---

# Phase 2: Functional & Edge Case Tests (2026-03-03)

**Scope:** End-to-end functional testing, edge cases, security, findings from browser automation session.

## Test Cases

### TC-20: Authentication

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 20.1 | Sign up new account | Email verification flow, redirect to dashboard | Logto sign-up form → verification code → dashboard | PASS |
| 20.2 | Sign out | Redirect to homepage, dashboard inaccessible | Clicked avatar → sign out → redirected to `/` | PASS |
| 20.3 | Sign in with wrong password | Error message, no redirect | Logto shows "Incorrect email or password" | PASS |
| 20.4 | Sign in with correct password | Redirect to dashboard | Successful login → `/dashboard` | PASS |
| 20.5 | Visit `/dashboard` while signed out | Redirect to sign-in | Redirects to Logto sign-in | PASS |

### TC-21: Team Management

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 21.1 | Create team with valid name | Team created, redirected to team page | Created "Тестовая Команда", redirected to `/dashboard/<teamId>` | PASS |
| 21.2 | Create team with empty name | Validation error or disabled submit | Submit button disabled when name is empty | PASS |
| 21.3 | Team page shows billing required | Billing banner visible for new teams | "НЕ ОПЛАЧЕНА" banner with "Оплата" button | PASS |

### TC-22: Billing Bypass (dev only)

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 22.1 | Set billing_status='active' via SQL | Team becomes active, upload enabled | `UPDATE teams SET billing_status = 'active'` → banner disappears, "+ НОВЫЙ ПРОЕКТ" appears | PASS |

### TC-23: Project Management

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 23.1 | Create project with valid name | Project created, redirected | Created "Тестовый Проект" | PASS |
| 23.2 | Create project with empty name | Validation prevents submit | Submit button disabled | PASS |
| 23.3 | Project page shows upload zone | Drop zone visible | "Перетащите видео или нажмите для загрузки" | PASS |

### TC-24: Video Upload

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 24.1 | Upload valid video file | Upload starts, progress shown, transcoding begins | Upload progress → "processing" status | PASS |
| 24.2 | Upload invalid file (synthetic blob) | Upload succeeds, transcoding fails | Status transitions: uploading → processing → failed | PASS (expected) |
| 24.3 | Failed video shows error | Error indicator on video card | Failed status badge visible | PASS |

### TC-25: Comments

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 25.1 | Add comment on video page | Comment appears in list with timestamp | Comment created and displayed | PASS |

### TC-26: Share Links

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 26.1 | Create password-protected share link | Link created with password | Share dialog → set password → link generated | PASS |
| 26.2 | Access share link for ready video | Password prompt shown | Share page shows lock icon + password input | PASS |
| 26.3 | **Access share link for failed video** | **Password prompt first, then "video unavailable"** | **Was: "Link expired or invalid" (no password prompt)** | **FINDING → FIXED** |

### TC-27: Public Watch

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 27.1 | Watch URL for ready video (`/watch/<publicId>`) | Video plays | Player loads with HLS stream | PASS |
| 27.2 | Watch URL for invalid publicId | Error message | "Видео не найдено" error card | PASS |

### TC-28: Workflow Status

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 28.1 | Change workflow status (Ревью → Доработка) | Status updates | Dropdown changes, badge updates | PASS |

### TC-29: Navigation

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 29.1 | Breadcrumb navigation (Правко → team → project) | Each crumb navigates correctly | All breadcrumb links work | PASS |
| 29.2 | Browser back/forward | Navigation state preserved | History navigation works correctly | PASS |

### TC-30: Theme

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 30.1 | Toggle light → dark → light | Theme switches, content preserved | Toggle works, all text remains readable | PASS |

### TC-31: Settings Page

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 31.1 | Load settings page | Full billing info displayed | Plan, storage, subscription status all shown | PASS |
| 31.2 | Members section | Current user listed | User with role "ВЛАДЕЛЕЦ" visible | PASS |

### TC-32: Profile Page

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 32.1 | Load `/dashboard/profile` | Profile page renders | Name, email, avatar settings visible | PASS |

### TC-33: Edge Cases — Non-existent Team

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 33.1 | **Navigate to `/dashboard/<non-existent-team-id>`** | **"Team not found" error** | **Was: blank page with "team" in breadcrumb (infinite loading)** | **FINDING → FIXED** |
| 33.2 | Regression: valid team loads normally | Team page renders | After fix, valid teams still load correctly | PASS |

### TC-34: Edge Cases — Security

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 34.1 | Invalid watch URL `/watch/does-not-exist` | Generic error, no info leak | Shows "Видео не найдено" (no details about server state) | PASS |
| 34.2 | Share link for failed video (password-protected) | Password prompt first (don't leak video status to unauthenticated) | After fix: shows password prompt, then "video unavailable" after auth | PASS |

### TC-35: Pricing Consistency

| ID | Action | Expected | Actual | Status |
|----|--------|----------|--------|--------|
| 35.1 | **All marketing pages show same pricing** | **Prices match billing backend (800 ₽ / 3 700 ₽)** | **Was: $5/$25 USD on frontend, 800/3700 RUB on backend** | **FINDING → FIXED** |
| 35.2 | Homepage pricing cards | 800 ₽ (Basic), 3 700 ₽ (Pro) | Matches `PRICING` config in `product.ts` | PASS |
| 35.3 | Pricing page | Same values as homepage | Basic 800 ₽/mo, Pro 3 700 ₽/mo | PASS |
| 35.4 | Settings/billing page | Same values | Backend `TEAM_PLAN_MONTHLY_PRICE_RUB` matches | PASS |
| 35.5 | Comparison pages (Frame.io, Wipster) | Product price in ₽, competitor in $ | Side-by-side comparison, no cross-currency math | PASS |
| 35.6 | For-agencies, for-video-editors pages | Product price in ₽ | All use `formatPrice(PRICING.basic.price)` | PASS |
| 35.7 | JSON-LD structured data | `priceCurrency: "RUB"` | Was "USD", now "RUB" with correct amounts | PASS |

---

## Bugs Found & Fixed (Phase 2)

### BUG-04: Non-existent team URL shows blank page (infinite loading)

- **Severity:** Medium
- **Location:** `app/routes/dashboard/-team.data.ts:25`
- **Root cause:** `useTeamData` hook maps `context.data === undefined` to "loading" state. When API returns 404 for non-existent team, TanStack Query sets `isError=true` but keeps `data=undefined`, so the component stays in loading state forever. Breadcrumb shows "team" as fallback label.
- **Fix:** Added `context.isError ? null :` check — error state now maps to `null`, which triggers the existing "Team not found" UI in `-team.tsx`.
- **Regression risk:** Low — only changes the error mapping, valid teams unaffected.

### BUG-05: Share link for failed video doesn't show password prompt

- **Severity:** Medium (security: leaks video status to unauthenticated visitors)
- **Location:** `server/routes/share.ts:149-171` (GET `/api/share/:token`)
- **Root cause:** Video status check (`video.status !== "ready"`) happened *before* password/email auth checks. For failed videos, endpoint returned `status: "missing"` regardless of password protection, leaking video state.
- **Fix:** (1) Moved auth checks (password, email) before video status check. (2) Added `error: "video_unavailable"` to POST access endpoint so frontend distinguishes wrong password from unavailable video. (3) Added `videoUnavailable` UI state in share page.
- **Files changed:** `server/routes/share.ts`, `app/routes/-share.tsx`

### BUG-06: Pricing inconsistency — frontend USD vs backend RUB

- **Severity:** High (customer-facing pricing mismatch)
- **Location:** All marketing pages, `src/lib/product.ts`
- **Root cause:** Marketing pages hardcoded `$5`/`$25` USD, while YooKassa billing charged 800/3700 RUB. `PRODUCT_PRICE_FLAT = 5` was a USD constant used in comparison calculators.
- **Fix:** Created `PRICING` config in `src/lib/product.ts` as single source of truth with RUB prices matching backend. Updated all 7 marketing pages + JSON-LD + docs. Removed `PRODUCT_PRICE_FLAT`. Comparison pages now show product price in ₽ alongside competitor USD prices without cross-currency savings math.
- **Files changed:** `src/lib/product.ts`, `-home.tsx`, `-pricing.tsx`, `-compare-frameio.tsx`, `-compare-wipster.tsx`, `-for-agencies.tsx`, `-for-video-editors.tsx`, `CLAUDE.md`, `README.md`

---

## Corner Cases & Regression Tests

These cases should be verified after any changes to related systems:

### Auth / Session

- Sign out then visit `/dashboard` → must redirect to sign-in (no blank page)
- Expired JWT → API returns 401 → auto-retry once → persistent 401 triggers sign-out

### Team / Workspace Resolution

- Non-existent team ID in URL → "Team not found" (not blank page)
- Valid team ID → loads normally
- User not a member of team → appropriate error (not blank page)

### Share Links

- Password-protected link, video ready → password prompt → player
- Password-protected link, video failed → password prompt → "video unavailable"
- Password-protected link, video processing → password prompt → "video unavailable"
- Non-password link, video ready → auto-grant → player
- Non-password link, video failed → "link expired or invalid"
- Expired share link → "link expired or invalid"
- Non-existent share token → "link expired or invalid"
- Wrong password 5 times → lockout (10 min)

### Pricing

- All marketing pages (home, pricing, compare/frameio, compare/wipster, for/agencies, for/video-editors) → prices from `PRICING` config
- Settings page billing info → prices from `TEAM_PLAN_MONTHLY_PRICE_RUB`
- JSON-LD structured data → `priceCurrency: "RUB"`, amounts match `PRICING`
- To change prices: update `PRICING` in `src/lib/product.ts` AND `YOOKASSA_*_PRICE_RUB` env vars AND `server/services/billing.ts` defaults

### Video Upload

- Upload valid video → status: uploading → processing → ready
- Upload invalid file → status: uploading → processing → failed
- Upload while over storage limit → 402 error
- Upload without active subscription → 402 error

### Navigation

- Breadcrumb links work at every level (dashboard → team → project → video)
- Browser back/forward preserves state
- Route prewarming on hover doesn't cause errors
