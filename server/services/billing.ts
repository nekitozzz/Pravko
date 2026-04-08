import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { teams, projects, videos } from "../db/schema.js";

export type TeamPlan = "basic" | "pro";

const GIBIBYTE = 1024 ** 3;

export const TEAM_PLAN_MONTHLY_PRICE_RUB: Record<TeamPlan, number> = {
  basic: Number(process.env.YOOKASSA_BASIC_PRICE_RUB) || 800,
  pro: Number(process.env.YOOKASSA_PRO_PRICE_RUB) || 3700,
};

export const TEAM_PLAN_STORAGE_LIMIT_BYTES: Record<TeamPlan, number> = {
  basic: 100 * GIBIBYTE,
  pro: 1024 * GIBIBYTE,
};

export function normalizeTeamPlan(plan: string): TeamPlan {
  if (plan === "pro" || plan === "team") return "pro";
  return "basic";
}

export function hasActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function getTeamStorageUsedBytes(teamId: string): Promise<number> {
  const teamProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.teamId, teamId));

  if (teamProjects.length === 0) return 0;

  let total = 0;
  for (const project of teamProjects) {
    const projectVideos = await db
      .select({ fileSize: videos.fileSize, status: videos.status })
      .from(videos)
      .where(eq(videos.projectId, project.id));

    for (const video of projectVideos) {
      if (video.status === "failed") continue;
      if (typeof video.fileSize === "number" && Number.isFinite(video.fileSize)) {
        total += video.fileSize;
      }
    }
  }

  return total;
}

export async function assertTeamCanStoreBytes(teamId: string, incomingBytes: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) throw Object.assign(new Error("Team not found"), { statusCode: 404 });

  if (!hasActiveSubscriptionStatus(team.billingStatus)) {
    throw Object.assign(new Error("An active Basic or Pro subscription is required."), { statusCode: 402 });
  }

  const plan = normalizeTeamPlan(team.plan);
  const storageUsed = await getTeamStorageUsedBytes(teamId);
  const storageLimit = TEAM_PLAN_STORAGE_LIMIT_BYTES[plan];
  const requested = Number.isFinite(incomingBytes) ? Math.max(0, incomingBytes) : 0;

  if (storageUsed + requested > storageLimit) {
    throw Object.assign(
      new Error(`Storage limit reached for the ${plan} plan. Upgrade to continue uploading.`),
      { statusCode: 402 },
    );
  }

  return { team, plan, storageUsed, storageLimit };
}

// YooKassa API client
const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";

function yookassaHeaders(): Record<string, string> {
  const shopId = process.env.YOOKASSA_SHOP_ID || "";
  const secretKey = process.env.YOOKASSA_SECRET_KEY || "";
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  };
}

export async function createYookassaPayment(params: {
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
  savePaymentMethod?: boolean;
  idempotencyKey: string;
}) {
  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: "POST",
    headers: {
      ...yookassaHeaders(),
      "Idempotence-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      amount: {
        value: params.amount.toFixed(2),
        currency: params.currency || "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: params.returnUrl,
      },
      capture: true,
      description: params.description,
      save_payment_method: params.savePaymentMethod ?? false,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YooKassa payment creation failed: ${response.status} ${body}`);
  }

  return response.json();
}

/**
 * YooKassa webhook IP ranges (official list).
 * https://yookassa.ru/developers/using-api/webhooks
 */
const YOOKASSA_WEBHOOK_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
  "77.75.154.128/25",
];

function ipToBits(ip: string): string {
  return ip.split(".").map((o) => parseInt(o).toString(2).padStart(8, "0")).join("");
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr);
  return ipToBits(ip).slice(0, prefix) === ipToBits(network).slice(0, prefix);
}

/** Verify that a webhook request comes from a known YooKassa IP. */
export function isYookassaWebhookIp(ip: string | undefined): boolean {
  if (!ip) return false;
  return YOOKASSA_WEBHOOK_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
}

export async function assertActiveSubscription(teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) throw Object.assign(new Error("Team not found"), { statusCode: 404 });
  if (!hasActiveSubscriptionStatus(team.billingStatus)) {
    throw Object.assign(new Error("An active subscription is required."), { statusCode: 402 });
  }
  return team;
}

export async function getTeamIdForVideo(videoId: string): Promise<string> {
  const [video] = await db.select({ projectId: videos.projectId }).from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!video) throw Object.assign(new Error("Video not found"), { statusCode: 404 });
  const [project] = await db.select({ teamId: projects.teamId }).from(projects).where(eq(projects.id, video.projectId)).limit(1);
  if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });
  return project.teamId;
}

/** Fetch payment status directly from YooKassa API to confirm webhook data. */
export async function fetchYookassaPaymentStatus(paymentId: string) {
  const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
    headers: yookassaHeaders(),
  });
  if (!response.ok) return null;
  return response.json() as Promise<{ id: string; status: string; metadata?: Record<string, string> }>;
}
