import { FastifyInstance } from "fastify";
import { eq, and, isNull, sql } from "drizzle-orm";
import { comments, users, videos, projects, shareAccessGrants, shareLinks } from "../db/schema.js";
import { requireUser, ensureDbUser, requireVideoAccess } from "../lib/auth.js";
import { notifyComments } from "../lib/realtime.js";
import { assertActiveSubscription, getTeamIdForVideo } from "../services/billing.js";

interface ThreadedComment {
  id: string;
  videoId: string;
  userId: string | null;
  userName: string | null;
  userAvatarUrl: string | null;
  text: string;
  timestampSeconds: number | null;
  parentId: string | null;
  resolved: boolean;
  createdAt: Date;
  replies: Omit<ThreadedComment, "replies">[];
}

type CommentRow = Omit<ThreadedComment, "replies">;

function toThreaded(rows: CommentRow[]): ThreadedComment[] {
  const topLevel = rows
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.timestampSeconds ?? 0) - (b.timestampSeconds ?? 0));

  return topLevel.map((c) => ({
    ...c,
    replies: rows
      .filter((r) => r.parentId === c.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  }));
}

/** Select comments with live user profile data (name/avatar from users table). */
async function selectCommentsWithUser(fastify: FastifyInstance, videoId: string): Promise<CommentRow[]> {
  const rows = await fastify.db
    .select({
      id: comments.id,
      videoId: comments.videoId,
      userId: comments.userId,
      userName: sql<string | null>`COALESCE(${users.name}, ${comments.guestName})`.as("user_name"),
      userAvatarUrl: users.avatarUrl,
      text: comments.text,
      timestampSeconds: comments.timestampSeconds,
      parentId: comments.parentId,
      resolved: comments.resolved,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.videoId, videoId), isNull(comments.deletedAt)));

  return rows;
}

async function resolveActiveShareGrant(fastify: FastifyInstance, grantToken: string) {
  const [grant] = await fastify.db
    .select()
    .from(shareAccessGrants)
    .where(eq(shareAccessGrants.token, grantToken))
    .limit(1);

  if (!grant || grant.expiresAt <= new Date()) return null;

  const [link] = await fastify.db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.id, grant.shareLinkId))
    .limit(1);

  if (!link || (link.expiresAt && link.expiresAt <= new Date())) return null;

  return { grant, shareLink: link };
}

export default async function commentRoutes(fastify: FastifyInstance) {
  // GET /api/videos/:videoId/comments — get threaded comments
  fastify.get<{ Params: { videoId: string } }>("/api/videos/:videoId/comments", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.videoId);

    const rows = await selectCommentsWithUser(fastify, request.params.videoId);
    return toThreaded(rows);
  });

  // GET /api/videos/public/:publicId/comments — get comments for public video
  fastify.get<{ Params: { publicId: string } }>("/api/videos/public/:publicId/comments", async (request) => {
    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.publicId, request.params.publicId))
      .limit(1);

    if (!video || video.visibility !== "public" || video.status !== "ready") {
      return [];
    }

    const rows = await selectCommentsWithUser(fastify, video.id);
    return toThreaded(rows.map((c) => ({
      ...c,
      userId: "", // hide user IDs in public view
    })));
  });

  // GET /api/share/:grantToken/comments — get comments via share grant
  fastify.get<{ Params: { grantToken: string } }>("/api/share/:grantToken/comments", async (request) => {
    const resolved = await resolveActiveShareGrant(fastify, request.params.grantToken);
    if (!resolved) return [];

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, resolved.shareLink.videoId))
      .limit(1);

    if (!video || video.status !== "ready") return [];

    const rows = await selectCommentsWithUser(fastify, video.id);
    return toThreaded(rows.map((c) => ({
      ...c,
      userId: "",
    })));
  });

  // POST /api/share/:shareToken/comments — create guest comment via share grant
  fastify.post<{ Params: { shareToken: string } }>("/api/share/:shareToken/comments", async (request, reply) => {
    const { grantToken, text, timestampSeconds, guestName, parentId } = request.body as {
      grantToken: string;
      text: string;
      timestampSeconds: number;
      guestName?: string;
      parentId?: string;
    };

    if (!grantToken) {
      return reply.code(401).send({ error: "Grant token required" });
    }

    const resolved = await resolveActiveShareGrant(fastify, grantToken);
    if (!resolved) {
      return reply.code(403).send({ error: "Invalid or expired grant" });
    }

    // Verify grant belongs to this share link
    const [link] = await fastify.db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, request.params.shareToken))
      .limit(1);

    if (!link || resolved.shareLink.id !== link.id) {
      return reply.code(403).send({ error: "Grant does not match share link" });
    }

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, link.videoId))
      .limit(1);

    if (!video || video.status !== "ready") {
      return reply.code(404).send({ error: "Video not found" });
    }

    // Subscription check
    const [project] = await fastify.db
      .select({ teamId: projects.teamId })
      .from(projects)
      .where(eq(projects.id, video.projectId))
      .limit(1);
    if (project) await assertActiveSubscription(project.teamId);

    // Guest name is required for anonymous users
    const trimmedGuestName = (guestName ?? "").trim();
    if (!trimmedGuestName || trimmedGuestName.length > 100) {
      return reply.code(400).send({ error: "Guest name is required (1-100 characters)" });
    }

    if (!text || !text.trim()) {
      return reply.code(400).send({ error: "Comment text is required" });
    }

    if (parentId) {
      const [parent] = await fastify.db.select().from(comments).where(eq(comments.id, parentId)).limit(1);
      if (!parent || parent.videoId !== video.id) {
        return reply.code(400).send({ error: "Invalid parent comment" });
      }
    }

    const [comment] = await fastify.db
      .insert(comments)
      .values({
        videoId: video.id,
        userId: null,
        guestName: trimmedGuestName,
        userName: trimmedGuestName,
        userAvatarUrl: null,
        text: text.trim(),
        timestampSeconds,
        parentId: parentId ?? null,
        resolved: false,
      })
      .returning();

    notifyComments(fastify, video.id);
    return comment;
  });

  // POST /api/videos/:videoId/comments — create comment
  fastify.post<{ Params: { videoId: string } }>("/api/videos/:videoId/comments", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);
    const { project } = await requireVideoAccess(user.id, request.params.videoId, "viewer");
    await assertActiveSubscription(project.teamId);

    const { text, timestampSeconds, parentId } = request.body as {
      text: string;
      timestampSeconds: number;
      parentId?: string;
    };

    if (parentId) {
      const [parent] = await fastify.db.select().from(comments).where(eq(comments.id, parentId)).limit(1);
      if (!parent || parent.videoId !== request.params.videoId) {
        return reply.code(400).send({ error: "Invalid parent comment" });
      }
    }

    const [comment] = await fastify.db
      .insert(comments)
      .values({
        videoId: request.params.videoId,
        userId: dbUser.id,
        userName: dbUser.name,
        userAvatarUrl: dbUser.avatarUrl,
        text,
        timestampSeconds,
        parentId: parentId ?? null,
        resolved: false,
      })
      .returning();

    notifyComments(fastify, request.params.videoId);
    return comment;
  });

  // POST /api/videos/public/:publicId/comments — create comment on public video
  fastify.post<{ Params: { publicId: string } }>("/api/videos/public/:publicId/comments", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.publicId, request.params.publicId))
      .limit(1);

    if (!video || video.visibility !== "public" || video.status !== "ready") {
      return reply.code(404).send({ error: "Video not found" });
    }

    // Derive teamId for subscription check
    const [project] = await fastify.db.select({ teamId: projects.teamId }).from(projects).where(eq(projects.id, video.projectId)).limit(1);
    if (project) await assertActiveSubscription(project.teamId);

    const { text, timestampSeconds, parentId } = request.body as {
      text: string;
      timestampSeconds: number;
      parentId?: string;
    };

    if (parentId) {
      const [parent] = await fastify.db.select().from(comments).where(eq(comments.id, parentId)).limit(1);
      if (!parent || parent.videoId !== video.id) {
        return reply.code(400).send({ error: "Invalid parent comment" });
      }
    }

    const [comment] = await fastify.db
      .insert(comments)
      .values({
        videoId: video.id,
        userId: dbUser.id,
        userName: dbUser.name,
        userAvatarUrl: dbUser.avatarUrl,
        text,
        timestampSeconds,
        parentId: parentId ?? null,
        resolved: false,
      })
      .returning();

    notifyComments(fastify, video.id);
    return comment;
  });

  // PATCH /api/comments/:id — update comment
  fastify.patch<{ Params: { id: string } }>("/api/comments/:id", async (request, reply) => {
    const user = requireUser(request, reply);

    const [comment] = await fastify.db.select().from(comments).where(eq(comments.id, request.params.id)).limit(1);
    if (!comment) return reply.code(404).send({ error: "Comment not found" });

    const teamId = await getTeamIdForVideo(comment.videoId);
    await assertActiveSubscription(teamId);

    if (comment.userId !== user.id) {
      return reply.code(403).send({ error: "You can only edit your own comments" });
    }

    const { text } = request.body as { text: string };
    await fastify.db.update(comments).set({ text }).where(eq(comments.id, request.params.id));

    notifyComments(fastify, comment.videoId);
    return { ok: true };
  });

  // DELETE /api/comments/:id — soft-delete comment
  fastify.delete<{ Params: { id: string } }>("/api/comments/:id", async (request, reply) => {
    const user = requireUser(request, reply);

    const [comment] = await fastify.db.select().from(comments).where(eq(comments.id, request.params.id)).limit(1);
    if (!comment) return reply.code(404).send({ error: "Comment not found" });

    const teamId = await getTeamIdForVideo(comment.videoId);
    await assertActiveSubscription(teamId);

    if (comment.userId !== user.id) {
      await requireVideoAccess(user.id, comment.videoId, "admin");
    }

    // Soft-delete replies first, then the comment itself
    const now = new Date();
    await fastify.db.update(comments).set({ deletedAt: now }).where(eq(comments.parentId, request.params.id));
    await fastify.db.update(comments).set({ deletedAt: now }).where(eq(comments.id, request.params.id));

    notifyComments(fastify, comment.videoId);
    return { ok: true };
  });

  // POST /api/comments/:id/resolve — toggle resolved
  fastify.post<{ Params: { id: string } }>("/api/comments/:id/resolve", async (request, reply) => {
    const user = requireUser(request, reply);

    const [comment] = await fastify.db.select().from(comments).where(eq(comments.id, request.params.id)).limit(1);
    if (!comment) return reply.code(404).send({ error: "Comment not found" });

    const teamId = await getTeamIdForVideo(comment.videoId);
    await assertActiveSubscription(teamId);

    await requireVideoAccess(user.id, comment.videoId, "member");

    await fastify.db.update(comments).set({ resolved: !comment.resolved }).where(eq(comments.id, request.params.id));

    notifyComments(fastify, comment.videoId);
    return { ok: true };
  });
}
