import Fastify, { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { generateOpaqueToken, hashPassword } from "../services/security.js";
import Redis from "ioredis";

const { users, teams, teamMembers, projects, videos, shareLinks, shareAccessGrants, comments } = schema;

// ── Minimal plugins (no S3, no WS, no Logto JWKS) ─────────────────────────

const dbPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("db", db);
});

const redisPlugin = fp(async (fastify: FastifyInstance) => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:4380";
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
  const redisSub = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
  fastify.decorate("redis", redis);
  fastify.decorate("redisSub", redisSub);
  fastify.addHook("onClose", async () => {
    await redis.quit();
    await redisSub.quit();
  });
});

const s3StubPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("s3", {} as any);
  fastify.decorate("s3Bucket", "test-bucket");
  fastify.decorate("s3PublicUrl", "http://localhost:4090/test-bucket");
});

/** Stub auth plugin that skips JWKS but still supports the public-paths bypass
 *  and a `verifyJwt` decorator for email-restricted links. */
const authStubPlugin = fp(async (fastify: FastifyInstance) => {
  // verifyJwt stub — tests that need email-restricted flow call setTestJwt()
  let testJwtPayload: Record<string, unknown> | null = null;

  fastify.decorate("verifyJwt", async (_token: string) => {
    if (!testJwtPayload) throw new Error("No test JWT payload configured");
    return testJwtPayload;
  });
  fastify.decorate("setTestJwt", (payload: Record<string, unknown> | null) => {
    testJwtPayload = payload;
  });

  fastify.decorateRequest("user", undefined);

  const publicPaths = [
    "/api/health",
    "/api/share/",
    "/api/yookassa/webhook",
    "/api/videos/public/",
    "/api/presence/",
    "/api/teams/invites/",
  ];

  fastify.addHook("onRequest", async (request, reply) => {
    if (publicPaths.some((p) => request.url.startsWith(p))) return;
    if (!request.url.startsWith("/api/")) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.code(401).send({ error: "Missing authorization token" });
      return;
    }

    const token = authHeader.slice(7);
    // For tests, we decode a simple JSON token: base64-encoded JSON payload
    try {
      const payload = JSON.parse(Buffer.from(token, "base64").toString());
      request.user = {
        id: payload.sub,
        email: payload.email || "",
        name: payload.name || "Test User",
        avatarUrl: payload.picture,
      };
    } catch {
      reply.code(401).send({ error: "Invalid token" });
    }
  });
});

const wsStubPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("wsClients", new Map());
  fastify.decorate("wsBroadcast", (_channel: string, _data: unknown) => {});
  fastify.decorate("wsPresence", new Map());
});

// ── Build test app ──────────────────────────────────────────────────────────

import commentRoutes from "../routes/comments.js";
import shareRoutes from "../routes/share.js";

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(dbPlugin);
  await app.register(redisPlugin);
  await app.register(authStubPlugin);
  await app.register(s3StubPlugin);
  await app.register(wsStubPlugin);
  await app.register(commentRoutes);
  await app.register(shareRoutes);

  await app.ready();
  return app;
}

// ── Auth token helper ────────────────────────────────────────────────────────

export function makeAuthToken(payload: { sub: string; email?: string; name?: string }): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

// ── Seed data helpers ────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto";

function uid() { return "test_" + randomBytes(12).toString("hex"); }

export interface TestSeed {
  user: { id: string; email: string; name: string };
  team: { id: string };
  project: { id: string };
  video: { id: string; publicId: string };
}

export async function seedTestData(): Promise<TestSeed> {
  const userId = uid();
  const userEmail = `${userId}@test.local`;

  // Create user
  await db.insert(users).values({
    id: userId,
    email: userEmail,
    name: "Test User",
  });
  createdUserIds.push(userId);

  // Create team
  const [team] = await db.insert(teams).values({
    name: "Test Team",
    slug: uid(),
    ownerId: userId,
    plan: "basic",
    billingStatus: "active",
  }).returning();

  // Add user as team member
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "owner",
  });

  // Create project
  const [project] = await db.insert(projects).values({
    teamId: team.id,
    name: "Test Project",
  }).returning();

  // Create video (ready status)
  const publicId = uid();
  const [video] = await db.insert(videos).values({
    projectId: project.id,
    uploadedById: userId,
    title: "Test Video",
    publicId,
    status: "ready",
    s3Key: "test/video.mp4",
    s3HlsPrefix: "hls/test",
  }).returning();

  return {
    user: { id: userId, email: userEmail, name: "Test User" },
    team: { id: team.id },
    project: { id: project.id },
    video: { id: video.id, publicId },
  };
}

export async function createShareLink(
  videoId: string,
  createdById: string,
  opts?: { password?: string; restrictedEmail?: string },
): Promise<{ id: string; token: string }> {
  const token = generateOpaqueToken(32);
  let passwordHash: string | null = null;
  if (opts?.password) {
    passwordHash = await hashPassword(opts.password);
  }

  const [link] = await db.insert(shareLinks).values({
    videoId,
    token,
    createdById,
    expiresAt: null,
    allowDownload: false,
    passwordHash,
    restrictedEmail: opts?.restrictedEmail?.toLowerCase() ?? null,
    failedAccessAttempts: 0,
    lockedUntil: null,
    viewCount: 0,
  }).returning();

  return { id: link.id, token: link.token };
}

export async function createGrant(shareLinkId: string): Promise<string> {
  const token = generateOpaqueToken(40);
  await db.insert(shareAccessGrants).values({
    shareLinkId,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return token;
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

const createdUserIds: string[] = [];

export async function cleanupTestData() {
  for (const userId of createdUserIds) {
    const userTeams = await db.select({ id: teams.id }).from(teams).where(eq(teams.ownerId, userId));
    for (const team of userTeams) {
      await db.delete(teams).where(eq(teams.id, team.id));
    }
    await db.delete(users).where(eq(users.id, userId));
  }
  createdUserIds.length = 0;
}

declare module "fastify" {
  interface FastifyInstance {
    setTestJwt: (payload: Record<string, unknown> | null) => void;
  }
}
