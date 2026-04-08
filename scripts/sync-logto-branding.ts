/**
 * Syncs Pravko's brutalist branding to the Logto sign-in experience.
 *
 * Usage:
 *   set -a && source .env && set +a && bun run scripts/sync-logto-branding.ts
 *
 * Requires: LOGTO_ENDPOINT, LOGTO_ADMIN_ENDPOINT env vars.
 * Auto-discovers M2M secrets from the Logto DB via docker exec.
 */

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || "http://localhost:4001";
const LOGTO_ADMIN_ENDPOINT =
  process.env.LOGTO_ADMIN_ENDPOINT || "http://localhost:4002";

// ── Custom CSS ──

const customCss = `
/* ═══════════════════════════════════════════════════
   Правко — Brutalist sign-in theme (light + dark)
   ═══════════════════════════════════════════════════ */

/* --- Shared variables (fonts, radius, shadows) --- */
#app {
  --color-shadow-1: none;
  --color-shadow-2: none;
  --radius: 0px;
  --font-body-1: 400 16px/24px 'Geist Mono', ui-monospace, monospace;
  --font-body-2: 400 14px/20px 'Geist Mono', ui-monospace, monospace;
  --font-body-3: 400 12px/16px 'Geist Mono', ui-monospace, monospace;
  --font-label-1: 700 14px/20px 'Geist Mono', ui-monospace, monospace;
  --font-label-2: 700 12px/16px 'Geist Mono', ui-monospace, monospace;
  --font-label-3: 700 10px/12px 'Geist Mono', ui-monospace, monospace;
  --font-title-1: 900 32px/40px 'Geist Mono', ui-monospace, monospace;
  --font-title-2: 900 28px/36px 'Geist Mono', ui-monospace, monospace;
  --font-title-3: 900 20px/28px 'Geist Mono', ui-monospace, monospace;
  --font-headline-1: 900 24px/32px 'Geist Mono', ui-monospace, monospace;
  --font-headline-2: 900 18px/24px 'Geist Mono', ui-monospace, monospace;
}

/* ── Light mode palette ── */
#app[class*='light'] {
  --color-bg-body: #f0f0e8;
  --color-bg-body-base: #f0f0e8;
  --color-bg-float: #f0f0e8;
  --color-bg-float-base: #f0f0e8;
  --color-type-primary: #1a1a1a;
  --color-type-secondary: #888888;
  --color-type-link: #2d5a2d;
  --color-line-border: #1a1a1a;
  --color-line-divider: #1a1a1a;
  --color-brand-default: #2d5a2d;
  --color-brand-hover: #3a6a3a;
  --color-brand-pressed: #1e3e1e;
  --color-brand-loading: #2d5a2d;
  --color-neutral-95: #e8e8e0;
  --color-neutral-99: #f0f0e8;
  --color-surface: #f0f0e8;
  --color-surface-2: #e8e8e0;
  --color-surface-3: #d8d8d0;
  --pravko-bg: #f0f0e8;
  --pravko-fg: #1a1a1a;
  --pravko-muted: #888888;
  --pravko-accent: #2d5a2d;
  --pravko-accent-hover: #3a6a3a;
  --pravko-shadow: #1a1a1a;
  --pravko-grid: rgba(26, 26, 26, 0.03);
}

/* ── Dark mode palette ── */
#app[class*='dark'] {
  --color-bg-body: #101410;
  --color-bg-body-base: #101410;
  --color-bg-float: #171c17;
  --color-bg-float-base: #171c17;
  --color-type-primary: #e7ede4;
  --color-type-secondary: #9aa79b;
  --color-type-link: #7cb87c;
  --color-line-border: #e7ede4;
  --color-line-divider: #374038;
  --color-brand-default: #7cb87c;
  --color-brand-hover: #91c991;
  --color-brand-pressed: #5a9a5a;
  --color-brand-loading: #7cb87c;
  --color-neutral-95: #202720;
  --color-neutral-99: #171c17;
  --color-surface: #171c17;
  --color-surface-2: #202720;
  --color-surface-3: #2b332b;
  --pravko-bg: #101410;
  --pravko-fg: #e7ede4;
  --pravko-muted: #9aa79b;
  --pravko-accent: #7cb87c;
  --pravko-accent-hover: #91c991;
  --pravko-shadow: #7cb87c;
  --pravko-grid: rgba(231, 237, 228, 0.03);
}

/* --- Body & background --- */
body {
  font-family: 'Geist Mono', ui-monospace, monospace !important;
}

/* Subtle grid pattern on the viewBox */
#app div[class$='viewBox'] {
  background-image:
    linear-gradient(var(--pravko-grid, rgba(26,26,26,0.03)) 1px, transparent 1px),
    linear-gradient(90deg, var(--pravko-grid, rgba(26,26,26,0.03)) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* --- Main card (desktop) --- */
body.desktop #app main[class*='main'] {
  border-radius: 0 !important;
  border: 2px solid var(--pravko-fg, #1a1a1a) !important;
  box-shadow: 6px 6px 0px 0px var(--pravko-shadow, #1a1a1a) !important;
}

/* --- Buttons (primary / submit) --- */
#app button[type='submit'],
#app button[class*='primary'] {
  border-radius: 0 !important;
  border: 2px solid var(--pravko-fg, #1a1a1a) !important;
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  box-shadow: 4px 4px 0px 0px var(--pravko-shadow, #1a1a1a) !important;
  transition: all 0.15s ease !important;
  color: #f0f0e8 !important;
  background: var(--pravko-accent, #2d5a2d) !important;
}

#app button[type='submit']:hover,
#app button[class*='primary']:hover {
  background: var(--pravko-accent-hover, #3a6a3a) !important;
  color: #f0f0e8 !important;
  transform: translate(2px, 2px) !important;
  box-shadow: 2px 2px 0px 0px var(--pravko-shadow, #1a1a1a) !important;
}

#app button[type='submit']:active,
#app button[class*='primary']:active {
  transform: translate(4px, 4px) !important;
  box-shadow: none !important;
}

/* --- Secondary / outline buttons --- */
#app button[class*='secondary'] {
  border-radius: 0 !important;
  border: 2px solid var(--pravko-fg, #1a1a1a) !important;
  background: transparent !important;
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}

/* --- Inputs --- */
#app input {
  border-radius: 0 !important;
  border: 2px solid var(--pravko-fg, #1a1a1a) !important;
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}

#app input:focus {
  border-color: var(--pravko-accent, #2d5a2d) !important;
  box-shadow: 4px 4px 0px 0px var(--pravko-accent, rgba(45,90,45,1)) !important;
  outline: none !important;
}

#app input::placeholder {
  color: var(--pravko-muted, #888) !important;
}

/* Input wrapper */
#app div[class*='inputField'] {
  border-radius: 0 !important;
}

/* --- Links (darkened for WCAG AA on --color-bg-float) --- */
#app a {
  color: #1e4a1e !important;
  text-decoration: underline !important;
  text-underline-offset: 3px !important;
  font-weight: 700 !important;
}

#app a:hover {
  color: var(--pravko-accent, #2d5a2d) !important;
}

#app[class*='dark'] a {
  color: #7cb87c !important;
}

#app[class*='dark'] a:hover {
  color: #91c991 !important;
}

/* --- Headings --- */
#app div[class*='title'],
#app div[class*='Title'] {
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  font-weight: 900 !important;
  letter-spacing: -0.02em !important;
}

/* --- Description text --- */
#app div[class*='description'],
#app div[class*='Description'] {
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  color: var(--pravko-muted, #888) !important;
}

/* --- Form errors --- */
#app div[class*='formErrors'],
#app div[class*='error'] {
  border-radius: 0 !important;
}

/* --- Hide "Powered by Logto" signature --- */
#app [class*='signature'] {
  display: none !important;
}

/* --- Tabs (sign-in / sign-up toggle) --- */
#app nav[class*='tabs'] button,
#app div[class*='tabs'] button,
#app button[class*='tab'] {
  border-radius: 0 !important;
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}

/* --- Password visibility toggle (don't style as button) --- */
#app button[class*='visibility'] {
  border: none !important;
  box-shadow: none !important;
  text-transform: none !important;
  background: transparent !important;
}

/* --- Toast / notification --- */
#app div[class*='toast'] {
  border-radius: 0 !important;
  border: 2px solid var(--pravko-fg, #1a1a1a) !important;
}

/* --- Hide Logto logo, show product name --- */
#app img[class*='logo'],
#app div[class*='logo'] img {
  display: none !important;
}

#app div[class*='logo'],
#app a[class*='logo'] {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 40px !important;
}

#app div[class*='logo']::after,
#app a[class*='logo']::after {
  content: 'ПРАВКО.' !important;
  font-family: 'Geist Mono', ui-monospace, monospace !important;
  font-weight: 900 !important;
  font-size: 32px !important;
  letter-spacing: -0.03em !important;
  display: block !important;
  color: var(--color-type-primary, #1a1a1a) !important;
}

/* --- Theme toggle button (injected via customContent) --- */
#pravko-theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  background: transparent;
  color: var(--pravko-muted, #888);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  font-family: 'Geist Mono', ui-monospace, monospace;
  box-shadow: none !important;
  text-transform: none !important;
  font-weight: 400 !important;
  letter-spacing: 0 !important;
}

#pravko-theme-toggle:hover {
  color: var(--pravko-fg, #1a1a1a) !important;
  border-color: var(--pravko-fg, #1a1a1a) !important;
  background: var(--color-surface-2, #e8e8e0) !important;
  transform: none !important;
}

/* --- Theme override via body attribute (React controls #app class, so we override on body) --- */
body[data-pravko-theme='light'] #app {
  --color-bg-body: #f0f0e8 !important;
  --color-bg-body-base: #f0f0e8 !important;
  --color-bg-float: #f0f0e8 !important;
  --color-bg-float-base: #f0f0e8 !important;
  --color-type-primary: #1a1a1a !important;
  --color-type-secondary: #888888 !important;
  --color-type-link: #2d5a2d !important;
  --color-line-border: #1a1a1a !important;
  --color-line-divider: #1a1a1a !important;
  --color-brand-default: #2d5a2d !important;
  --color-brand-hover: #3a6a3a !important;
  --color-brand-pressed: #1e3e1e !important;
  --color-neutral-95: #e8e8e0 !important;
  --color-neutral-99: #f0f0e8 !important;
  --color-surface: #f0f0e8 !important;
  --color-surface-2: #e8e8e0 !important;
  --color-surface-3: #d8d8d0 !important;
  --pravko-bg: #f0f0e8 !important;
  --pravko-fg: #1a1a1a !important;
  --pravko-muted: #888888 !important;
  --pravko-accent: #2d5a2d !important;
  --pravko-accent-hover: #3a6a3a !important;
  --pravko-shadow: #1a1a1a !important;
  --pravko-grid: rgba(26, 26, 26, 0.03) !important;
  --color-static-white: #f0f0e8 !important;
}

body[data-pravko-theme='dark'] #app {
  --color-bg-body: #101410 !important;
  --color-bg-body-base: #101410 !important;
  --color-bg-float: #171c17 !important;
  --color-bg-float-base: #171c17 !important;
  --color-type-primary: #e7ede4 !important;
  --color-type-secondary: #9aa79b !important;
  --color-type-link: #7cb87c !important;
  --color-line-border: #e7ede4 !important;
  --color-line-divider: #374038 !important;
  --color-brand-default: #7cb87c !important;
  --color-brand-hover: #91c991 !important;
  --color-brand-pressed: #5a9a5a !important;
  --color-neutral-95: #202720 !important;
  --color-neutral-99: #171c17 !important;
  --color-surface: #171c17 !important;
  --color-surface-2: #202720 !important;
  --color-surface-3: #2b332b !important;
  --pravko-bg: #101410 !important;
  --pravko-fg: #e7ede4 !important;
  --pravko-muted: #9aa79b !important;
  --pravko-accent: #7cb87c !important;
  --pravko-accent-hover: #91c991 !important;
  --pravko-shadow: #7cb87c !important;
  --pravko-grid: rgba(231, 237, 228, 0.03) !important;
  --color-static-white: #f0f0e8 !important;
}

body[data-pravko-theme='light'] {
  background: #f0f0e8 !important;
}

body[data-pravko-theme='dark'] {
  background: #101410 !important;
}

/* --- Selection --- */
#app ::selection {
  background: var(--pravko-accent, #2d5a2d);
  color: var(--pravko-bg, #f0f0e8);
}
`;

// ── Helpers ──

async function getM2MSecret(appId: string): Promise<string> {
  const { execSync } = await import("child_process");
  const pgContainer =
    process.env.LOGTO_PG_CONTAINER || "pravko-postgres-1";
  const pgUser = process.env.POSTGRES_USER || "pravko";
  const logtoDb = process.env.LOGTO_DB || "logto";

  const cmd = `docker exec ${pgContainer} psql -U ${pgUser} -d ${logtoDb} -t -c "SELECT secret FROM applications WHERE id = '${appId}' LIMIT 1;"`;
  const output = execSync(cmd, { encoding: "utf-8" }).trim();

  if (!output) {
    throw new Error(`M2M app '${appId}' not found in Logto DB`);
  }
  return output;
}

async function getToken(
  endpoint: string,
  clientId: string,
  clientSecret: string,
  resource: string,
): Promise<string> {
  const res = await fetch(`${endpoint}/oidc/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      resource,
      scope: "all",
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Token request failed for ${clientId}: ${res.status} ${await res.text()}`,
    );
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ── Theme toggle (injected into Logto sign-in pages via customContent) ──

const sunIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

// Use <img onerror> to execute JS — React's dangerouslySetInnerHTML doesn't run <script> tags
// Mirrors src/components/theme/ThemeToggle.tsx — same icons, hotkey (Cmd/Ctrl+Shift+L), title tooltip
const themeToggleScript = `
if(!document.getElementById('pravko-theme-toggle')){
  var btn=document.createElement('button');
  btn.id='pravko-theme-toggle';
  var isMac=navigator.platform.indexOf('Mac')!==-1;
  function pIsDark(){var a=document.getElementById('app');return a&&a.className.indexOf('dark')!==-1}
  function pSetMeta(){
    btn.innerHTML=pIsDark()?'${sunIcon.replace(/'/g, "\\'")}':'${moonIcon.replace(/'/g, "\\'")}';
    var lbl=pIsDark()?'Светлая тема':'Тёмная тема';
    var shortcut=isMac?'⌘⇧L':'Ctrl+Shift+L';
    btn.setAttribute('title',lbl+' ('+shortcut+')');
    btn.setAttribute('aria-label',lbl);
  }
  function pApply(theme){
    var app=document.getElementById('app');
    if(app){var c=app.className.replace(/\\b(light|dark)\\b/g,'').trim();app.className=c+' '+theme}
    document.body.setAttribute('data-pravko-theme',theme);
    localStorage.setItem('pravko-logto-theme',theme);
    pSetMeta();
  }
  var saved=localStorage.getItem('pravko-logto-theme');
  if(saved){pApply(saved)}
  pSetMeta();
  btn.addEventListener('click',function(){pApply(pIsDark()?'light':'dark')});
  document.body.appendChild(btn);
  window.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key.toLowerCase()==='l'){e.preventDefault();pApply(pIsDark()?'light':'dark')}});
  var mo=new MutationObserver(function(){var s=localStorage.getItem('pravko-logto-theme');if(!s)return;var a=document.getElementById('app');if(a&&a.className.indexOf(s)===-1){var c=a.className.replace(/\\b(light|dark)\\b/g,'').trim();a.className=c+' '+s}});
  var appEl=document.getElementById('app');if(appEl){mo.observe(appEl,{attributes:true,attributeFilter:['class']})}
}
`.replace(/\n/g, "").replace(/\s{2,}/g, " ");

const themeToggleHtml = `<img src="x" onerror="${themeToggleScript.replace(/"/g, "&quot;")}" style="display:none">`;

// ── SMTP connector setup ──

async function ensureSmtpConnector(token: string) {
  const listRes = await fetch(`${LOGTO_ENDPOINT}/api/connectors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const connectors = (await listRes.json()) as Array<{ id: string; type: string }>;
  const existing = connectors.find((c) => c.type === "Email");

  // Logto runs in Docker — always use Docker service name to reach MailPit
  const smtpHost = process.env.LOGTO_SMTP_HOST || "mailpit";
  const smtpPort = Number(process.env.SMTP_PORT || "1025");
  const smtpFrom = process.env.SMTP_FROM || "noreply@pravko.ru";

  const smtpConfig = {
    host: smtpHost,
    port: smtpPort,
    fromEmail: smtpFrom,
    auth: { user: "mailpit", pass: "mailpit" },
    templates: [
      { usageType: "SignIn", subject: "Код для входа в Правко.", content: "<p>Ваш код подтверждения: <b>{{code}}</b></p><p>Код действует 10 минут.</p>", contentType: "text/html" },
      { usageType: "Register", subject: "Регистрация в Правко.", content: "<p>Ваш код подтверждения: <b>{{code}}</b></p><p>Код действует 10 минут.</p>", contentType: "text/html" },
      { usageType: "ForgotPassword", subject: "Сброс пароля — Правко.", content: "<p>Ваш код для сброса пароля: <b>{{code}}</b></p><p>Код действует 10 минут.</p>", contentType: "text/html" },
      { usageType: "Generic", subject: "Код подтверждения — Правко.", content: "<p>Ваш код подтверждения: <b>{{code}}</b></p><p>Код действует 10 минут.</p>", contentType: "text/html" },
    ],
  };

  if (existing) {
    // Update existing connector config
    const patchRes = await fetch(`${LOGTO_ENDPOINT}/api/connectors/${existing.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ config: smtpConfig }),
    });
    if (!patchRes.ok) {
      const body = await patchRes.text();
      throw new Error(`Failed to update SMTP connector: ${patchRes.status} ${body}`);
    }
    console.log(`  Updated SMTP connector (host: ${smtpHost}:${smtpPort}).`);
    return;
  }

  const res = await fetch(`${LOGTO_ENDPOINT}/api/connectors`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connectorId: "simple-mail-transfer-protocol",
      config: smtpConfig,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create SMTP connector: ${res.status} ${body}`);
  }

  console.log(`  Created SMTP connector (host: ${smtpHost}:${smtpPort}).`);
}

// ── Main ──

async function main() {
  console.log("Fetching M2M secrets from Logto DB...");
  const defaultSecret = await getM2MSecret("m-default");
  console.log("  m-default secret: OK");

  console.log("Getting management API token...");
  const token = await getToken(
    LOGTO_ADMIN_ENDPOINT,
    "m-default",
    defaultSecret,
    "https://default.logto.app/api",
  );
  console.log("  Token: OK");

  console.log("Ensuring SMTP email connector...");
  await ensureSmtpConnector(token);

  console.log("Patching sign-in experience...");
  const res = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      color: {
        primaryColor: "#2d5a2d",
        isDarkModeEnabled: true,
        darkPrimaryColor: "#7cb87c",
      },
      customCss,
      customContent: {
        "/sign-in": themeToggleHtml,
        "/register": themeToggleHtml,
      },
      // Use email as identifier instead of username
      signIn: {
        methods: [
          {
            identifier: "email",
            password: true,
            verificationCode: true,
            isPasswordPrimary: true,
          },
        ],
      },
      signUp: {
        identifiers: ["email"],
        password: true,
        verify: true,
      },
      // Always show Russian UI (product is Russian-language)
      languageInfo: {
        autoDetect: false,
        fallbackLanguage: "ru",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH sign-in-exp failed: ${res.status} ${body}`);
  }

  const result = (await res.json()) as {
    color?: { primaryColor?: string };
    customCss?: string;
    signIn?: { methods?: Array<{ identifier: string }> };
    languageInfo?: { fallbackLanguage?: string };
  };
  console.log("\nSign-in experience updated!");
  console.log(`  Primary color: ${result.color?.primaryColor}`);
  console.log(`  Custom CSS: ${result.customCss?.length ?? 0} chars`);
  console.log(`  Sign-in identifiers: ${result.signIn?.methods?.map((m) => m.identifier).join(", ")}`);
  console.log(`  Fallback language: ${result.languageInfo?.fallbackLanguage}`);

  // ── Custom Russian phrases (fix ё, formality, typos in Logto defaults) ──
  console.log("Patching Russian custom phrases...");
  const phrasesRes = await fetch(`${LOGTO_ENDPOINT}/api/custom-phrases/ru`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: {
        sign_in_to_your_account: "Войдите в свой аккаунт",
        create_your_account: "Создайте аккаунт",
        no_account: "Ещё не зарегистрированы? ",
        resend_after_seconds:
          "Ещё не получили? Отправить повторно через <span>{{seconds}}</span> секунд",
        resend_passcode:
          "Ещё не получили? <a>Отправить повторно код подтверждения</a>",
        password_changed: "Пароль изменён",
        create_account_id_exists:
          "Учётная запись {{value}} уже существует. Продолжить вход.",
        sign_in_id_does_not_exist:
          "Учётная запись для {{value}} не найдена. Создать новую?",
        sign_in_id_does_not_exist_alert:
          "Учётная запись для {{value}} не существует.",
        create_account_id_exists_alert:
          "Аккаунт с {{type}} {{value}} связан с другим аккаунтом. Пожалуйста, попробуйте другой {{type}}.",
      },
    }),
  });

  if (!phrasesRes.ok) {
    const body = await phrasesRes.text();
    console.error(`  Custom phrases failed: ${phrasesRes.status} ${body}`);
  } else {
    console.log("  Russian custom phrases: OK");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
