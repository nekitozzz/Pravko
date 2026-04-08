const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT;
const LOGTO_M2M_APP_ID = process.env.LOGTO_M2M_APP_ID;
const LOGTO_M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getM2MToken(): Promise<string | null> {
  if (!LOGTO_ENDPOINT || !LOGTO_M2M_APP_ID || !LOGTO_M2M_APP_SECRET) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: LOGTO_M2M_APP_ID,
      client_secret: LOGTO_M2M_APP_SECRET,
      resource: "https://default.logto.app/api",
      scope: "all",
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

export function isLogtoManagementConfigured(): boolean {
  return !!(LOGTO_ENDPOINT && LOGTO_M2M_APP_ID && LOGTO_M2M_APP_SECRET);
}

export async function updateLogtoUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string },
): Promise<boolean> {
  const token = await getM2MToken();
  if (!token) return false;

  const endpoint = process.env.LOGTO_ADMIN_ENDPOINT || LOGTO_ENDPOINT;
  const res = await fetch(`${endpoint}/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return res.ok;
}

export async function changeLogtoPassword(
  userId: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = await getM2MToken();
  if (!token) return { ok: false, error: "Management API not configured" };

  const endpoint = process.env.LOGTO_ADMIN_ENDPOINT || LOGTO_ENDPOINT;
  const res = await fetch(`${endpoint}/api/users/${userId}/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message || "Failed to change password" };
  }

  return { ok: true };
}
