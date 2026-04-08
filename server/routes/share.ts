import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { shareLinks, shareAccessGrants, videos } from "../db/schema.js";
import { requireUser, ensureDbUser, requireVideoAccess } from "../lib/auth.js";
import { generateOpaqueToken, generateUniqueToken, hashPassword, verifyPassword } from "../services/security.js";
import { checkRateLimit } from "../lib/rateLimit.js";
import { buildHlsUrl, buildThumbnailUrl, buildDownloadFilename, generatePresignedGetUrl } from "../services/storage.js";

const MAX_PASSWORD_LENGTH = 256;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes
const GRANT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hasPasswordProtection(link: { passwordHash: string | null }): boolean {
  return Boolean(link.passwordHash);
}

export default async function shareRoutes(fastify: FastifyInstance) {
  // POST /api/videos/:videoId/share-links — create share link
  fastify.post<{ Params: { videoId: string } }>("/api/videos/:videoId/share-links", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);
    await requireVideoAccess(user.id, request.params.videoId, "member");

    const { expiresInDays, allowDownload, password, email } = request.body as {
      expiresInDays?: number;
      allowDownload?: boolean;
      password?: string;
      email?: string;
    };

    const token = generateOpaqueToken(32);
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    let passwordHash: string | null = null;
    if (password && password.length > 0) {
      if (password.length > MAX_PASSWORD_LENGTH) {
        return reply.code(400).send({ error: "Password is too long" });
      }
      passwordHash = await hashPassword(password);
    }

    const restrictedEmail = email?.trim().toLowerCase() || null;

    const [link] = await fastify.db
      .insert(shareLinks)
      .values({
        videoId: request.params.videoId,
        token,
        createdById: dbUser.id,
        createdByName: dbUser.name,
        expiresAt,
        allowDownload: allowDownload ?? false,
        passwordHash,
        restrictedEmail,
        failedAccessAttempts: 0,
        lockedUntil: null,
        viewCount: 0,
      })
      .returning();

    return { token: link.token };
  });

  // GET /api/videos/:videoId/share-links — list share links
  fastify.get<{ Params: { videoId: string } }>("/api/videos/:videoId/share-links", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.videoId);

    const links = await fastify.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.videoId, request.params.videoId));

    return links.map((link) => ({
      ...link,
      hasPassword: hasPasswordProtection(link),
      isExpired: link.expiresAt ? link.expiresAt < new Date() : false,
    }));
  });

  // DELETE /api/share-links/:id — delete share link
  fastify.delete<{ Params: { id: string } }>("/api/share-links/:id", async (request, reply) => {
    const user = requireUser(request, reply);

    const [link] = await fastify.db.select().from(shareLinks).where(eq(shareLinks.id, request.params.id)).limit(1);
    if (!link) return reply.code(404).send({ error: "Share link not found" });

    await requireVideoAccess(user.id, link.videoId, "member");

    await fastify.db.delete(shareAccessGrants).where(eq(shareAccessGrants.shareLinkId, link.id));
    await fastify.db.delete(shareLinks).where(eq(shareLinks.id, link.id));

    return { ok: true };
  });

  // PATCH /api/share-links/:id — update share link
  fastify.patch<{ Params: { id: string } }>("/api/share-links/:id", async (request, reply) => {
    const user = requireUser(request, reply);

    const [link] = await fastify.db.select().from(shareLinks).where(eq(shareLinks.id, request.params.id)).limit(1);
    if (!link) return reply.code(404).send({ error: "Share link not found" });

    await requireVideoAccess(user.id, link.videoId, "member");

    const { expiresInDays, allowDownload, password, email } = request.body as {
      expiresInDays?: number | null;
      allowDownload?: boolean;
      password?: string | null;
      email?: string | null;
    };

    const updates: Record<string, unknown> = {};

    if (expiresInDays !== undefined) {
      updates.expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;
    }
    if (allowDownload !== undefined) {
      updates.allowDownload = allowDownload;
    }
    if (password !== undefined) {
      if (password && password.length > 0) {
        if (password.length > MAX_PASSWORD_LENGTH) {
          return reply.code(400).send({ error: "Password is too long" });
        }
        updates.passwordHash = await hashPassword(password);
      } else {
        updates.passwordHash = null;
      }
      updates.failedAccessAttempts = 0;
      updates.lockedUntil = null;
    }
    if (email !== undefined) {
      updates.restrictedEmail = email ? email.trim().toLowerCase() : null;
    }

    if (Object.keys(updates).length > 0) {
      await fastify.db.update(shareLinks).set(updates).where(eq(shareLinks.id, link.id));
    }

    return { ok: true };
  });

  // GET /api/share/:token — get share link status
  fastify.get<{ Params: { token: string } }>("/api/share/:token", async (request) => {
    const [link] = await fastify.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, request.params.token))
      .limit(1);

    if (!link) return { status: "missing" };
    if (link.expiresAt && link.expiresAt < new Date()) return { status: "expired" };

    // Check auth requirements BEFORE video status — don't leak video state to unauthenticated visitors
    if (link.restrictedEmail) return { status: "requiresEmail" };
    if (hasPasswordProtection(link)) return { status: "requiresPassword" };

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, link.videoId))
      .limit(1);

    if (!video || video.status !== "ready") return { status: "missing" };

    return { status: "ok" };
  });

  // POST /api/share/:token/access — issue access grant
  fastify.post<{ Params: { token: string } }>("/api/share/:token/access", async (request, reply) => {
    // Rate limit
    const globalLimit = await checkRateLimit(fastify.redis, "share:global", { windowMs: 60_000, maxRequests: 600 });
    if (!globalLimit.ok) return { ok: false, grantToken: null };

    const tokenLimit = await checkRateLimit(fastify.redis, `share:token:${request.params.token}`, { windowMs: 60_000, maxRequests: 120 });
    if (!tokenLimit.ok) return { ok: false, grantToken: null };

    const [link] = await fastify.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, request.params.token))
      .limit(1);

    if (!link) return { ok: false, grantToken: null };
    if (link.expiresAt && link.expiresAt <= new Date()) return { ok: false, grantToken: null };

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, link.videoId))
      .limit(1);

    if (!video || video.status !== "ready") return { ok: false, grantToken: null, error: "video_unavailable" };

    // Email restriction check
    if (link.restrictedEmail) {
      // Try to parse JWT from Authorization header (auth hook skips it for /api/share/ routes)
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return { ok: false, grantToken: null, error: "email_auth_required" };
      }
      try {
        const jwtToken = authHeader.slice(7);
        const payload = await (fastify as any).verifyJwt(jwtToken);
        const userEmail = ((payload as any).email || "").toLowerCase();
        if (userEmail !== link.restrictedEmail) {
          return { ok: false, grantToken: null, error: "email_mismatch" };
        }
      } catch {
        return { ok: false, grantToken: null, error: "email_auth_required" };
      }
    }

    // Password check
    if (hasPasswordProtection(link)) {
      if (link.lockedUntil && link.lockedUntil > new Date()) {
        return { ok: false, grantToken: null };
      }

      const { password } = (request.body || {}) as { password?: string };
      const passwordMatches = link.passwordHash
        ? await verifyPassword(password ?? "", link.passwordHash)
        : false;

      if (!passwordMatches) {
        await checkRateLimit(fastify.redis, `share:pw:${request.params.token}`, { windowMs: 60_000, maxRequests: 10 });

        const failedAttempts = (link.failedAccessAttempts ?? 0) + 1;
        const updates: Record<string, unknown> = { failedAccessAttempts: failedAttempts };
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          updates.failedAccessAttempts = 0;
          updates.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        }
        await fastify.db.update(shareLinks).set(updates).where(eq(shareLinks.id, link.id));

        return { ok: false, grantToken: null };
      }

      // Reset failed attempts on success
      if ((link.failedAccessAttempts ?? 0) > 0 || link.lockedUntil) {
        await fastify.db.update(shareLinks).set({
          failedAccessAttempts: 0,
          lockedUntil: null,
        }).where(eq(shareLinks.id, link.id));
      }
    }

    // Issue grant
    const grantToken = await generateUniqueToken(
      40,
      async (candidate) => {
        const [existing] = await fastify.db
          .select({ id: shareAccessGrants.id })
          .from(shareAccessGrants)
          .where(eq(shareAccessGrants.token, candidate))
          .limit(1);
        return !!existing;
      },
    );

    await fastify.db.insert(shareAccessGrants).values({
      shareLinkId: link.id,
      token: grantToken,
      expiresAt: new Date(Date.now() + GRANT_TTL_MS),
    });

    await fastify.db.update(shareLinks).set({
      viewCount: (link.viewCount ?? 0) + 1,
    }).where(eq(shareLinks.id, link.id));

    return { ok: true, grantToken };
  });

  // GET /api/share/:grantToken/playback — get playback via share grant
  fastify.get<{ Params: { grantToken: string } }>("/api/share/:grantToken/playback", async (request) => {
    const [grant] = await fastify.db
      .select()
      .from(shareAccessGrants)
      .where(eq(shareAccessGrants.token, request.params.grantToken))
      .limit(1);

    if (!grant || grant.expiresAt <= new Date()) return { error: "Invalid or expired grant" };

    const [link] = await fastify.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, grant.shareLinkId))
      .limit(1);

    if (!link) return { error: "Share link not found" };

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, link.videoId))
      .limit(1);

    if (!video || video.status !== "ready") return { error: "Video not found" };

    return {
      url: buildHlsUrl(fastify.s3PublicUrl, video.id),
      posterUrl: video.thumbnailUrl || buildThumbnailUrl(fastify.s3PublicUrl, video.id),
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
      },
      grantExpiresAt: grant.expiresAt,
      allowDownload: link.allowDownload,
    };
  });

  // GET /api/share/:grantToken/download — download via share grant
  fastify.get<{ Params: { grantToken: string } }>("/api/share/:grantToken/download", async (request, reply) => {
    const [grant] = await fastify.db
      .select()
      .from(shareAccessGrants)
      .where(eq(shareAccessGrants.token, request.params.grantToken))
      .limit(1);

    if (!grant || grant.expiresAt <= new Date()) {
      return reply.code(403).send({ error: "Invalid or expired grant" });
    }

    const [link] = await fastify.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, grant.shareLinkId))
      .limit(1);

    if (!link || !link.allowDownload) {
      return reply.code(403).send({ error: "Download not allowed" });
    }

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, link.videoId))
      .limit(1);

    if (!video || video.status !== "ready" || !video.s3Key) {
      return reply.code(404).send({ error: "Video not found or not ready" });
    }

    const filename = buildDownloadFilename(video.title, video.s3Key);
    const url = await generatePresignedGetUrl(fastify.s3, fastify.s3Bucket, video.s3Key, {
      expiresIn: 600,
      filename,
      contentType: video.contentType || "video/mp4",
    });

    return { url, filename };
  });
}
