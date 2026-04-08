import { FastifyInstance } from "fastify";
import { eq, and, gt } from "drizzle-orm";
import { users, teams, teamInvites } from "../db/schema.js";
import { requireUser, ensureDbUser } from "../lib/auth.js";
import { generatePresignedPutUrl } from "../services/storage.js";
import { updateLogtoUserProfile, changeLogtoPassword, isLogtoManagementConfigured } from "../services/logto.js";

const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/me — get current user profile
  fastify.get("/api/users/me", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      avatarUrl: dbUser.avatarUrl,
      canChangePassword: isLogtoManagementConfigured(),
    };
  });

  // PATCH /api/users/me — update profile
  fastify.patch<{
    Body: { name?: string; email?: string; avatarUrl?: string };
  }>("/api/users/me", async (request, reply) => {
    const user = requireUser(request, reply);
    const { name, email, avatarUrl } = request.body ?? {};

    const updates: Record<string, string> = {};
    if (name && name.trim()) updates.name = name.trim();
    if (email && email.trim()) updates.email = email.trim();
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    if (Object.keys(updates).length === 0) {
      return reply.code(200).send({ ok: true });
    }

    // Upsert: create if not exists, update if exists
    await fastify.db
      .insert(users)
      .values({
        id: user.id,
        name: updates.name ?? null,
        email: updates.email ?? null,
        avatarUrl: updates.avatarUrl ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: updates,
      });

    // Best-effort sync to Logto
    const logtoUpdates: { name?: string; avatar?: string } = {};
    if (updates.name) logtoUpdates.name = updates.name;
    if (updates.avatarUrl) logtoUpdates.avatar = updates.avatarUrl;
    if (Object.keys(logtoUpdates).length > 0) {
      updateLogtoUserProfile(user.id, logtoUpdates).catch(() => {});
    }

    return { ok: true };
  });

  // POST /api/users/me/avatar-upload-url — presigned S3 URL for avatar
  fastify.post<{
    Body: { contentType: string };
  }>("/api/users/me/avatar-upload-url", async (request, reply) => {
    const user = requireUser(request, reply);
    const { contentType } = request.body ?? {};

    if (!contentType || !ALLOWED_AVATAR_TYPES.has(contentType)) {
      return reply.code(400).send({ error: "Invalid content type. Allowed: jpeg, png, webp" });
    }

    const ext = contentType.split("/")[1];
    const key = `avatars/${user.id}.${ext}`;

    const uploadUrl = await generatePresignedPutUrl(
      fastify.s3,
      fastify.s3Bucket,
      key,
      contentType,
      300,
    );

    const avatarUrl = `${fastify.s3PublicUrl}/${key}`;

    return { uploadUrl, avatarUrl };
  });

  // POST /api/users/me/password — change password via Logto Management API
  fastify.post<{
    Body: { password: string };
  }>("/api/users/me/password", async (request, reply) => {
    const user = requireUser(request, reply);
    const { password } = request.body ?? {};

    if (!password || password.length < 8) {
      return reply.code(400).send({ error: "Password must be at least 8 characters" });
    }

    if (!isLogtoManagementConfigured()) {
      return reply.code(501).send({ error: "Password management is not configured" });
    }

    const result = await changeLogtoPassword(user.id, password);
    if (!result.ok) {
      return reply.code(500).send({ error: result.error });
    }

    return { ok: true };
  });

  // GET /api/users/me/invites — pending invites for current user
  fastify.get("/api/users/me/invites", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);

    if (!dbUser.email) return [];

    const invites = await fastify.db
      .select({
        token: teamInvites.token,
        teamName: teams.name,
        invitedByName: teamInvites.invitedByName,
        role: teamInvites.role,
      })
      .from(teamInvites)
      .innerJoin(teams, eq(teamInvites.teamId, teams.id))
      .where(
        and(
          eq(teamInvites.email, dbUser.email.toLowerCase()),
          gt(teamInvites.expiresAt, new Date()),
        ),
      );

    return invites;
  });
}
