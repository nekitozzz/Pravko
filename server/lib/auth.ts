import { FastifyRequest, FastifyReply } from "fastify";
import { eq, and } from "drizzle-orm";
import { AuthUser } from "../plugins/auth.js";
import { db } from "../db/index.js";
import { users, teamMembers, teams, projects, videos } from "../db/schema.js";

const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

export function requireUser(request: FastifyRequest, reply: FastifyReply): AuthUser {
  if (!request.user) {
    reply.code(401).send({ error: "Not authenticated" });
    throw new Error("Not authenticated");
  }
  return request.user;
}

export async function ensureDbUser(user: AuthUser) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (existing.length > 0) {
    // Only update fields if we have real (non-"Unknown") values from the token
    const updates: Record<string, string | null> = {};
    if (user.email && user.email !== existing[0].email) updates.email = user.email;
    if (user.name && user.name !== "Unknown" && user.name !== existing[0].name) updates.name = user.name;
    if (user.avatarUrl && user.avatarUrl !== existing[0].avatarUrl) updates.avatarUrl = user.avatarUrl;

    if (Object.keys(updates).length > 0) {
      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id))
        .returning();
      return updated;
    }
    return existing[0];
  }

  const [inserted] = await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email || null,
      name: user.name === "Unknown" ? null : (user.name || null),
      avatarUrl: user.avatarUrl,
    })
    .returning();

  return inserted;
}

export async function requireTeamAccess(
  userId: string,
  teamId: string,
  requiredRole?: Role,
) {
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    throw Object.assign(new Error("Not a team member"), { statusCode: 403 });
  }

  if (requiredRole && ROLE_HIERARCHY[membership.role as Role] < ROLE_HIERARCHY[requiredRole]) {
    throw Object.assign(new Error(`Requires ${requiredRole} role or higher`), { statusCode: 403 });
  }

  return membership;
}

export async function requireProjectAccess(
  userId: string,
  projectId: string,
  requiredRole?: Role,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw Object.assign(new Error("Project not found"), { statusCode: 404 });
  }

  const membership = await requireTeamAccess(userId, project.teamId, requiredRole);
  return { project, membership };
}

export async function requireVideoAccess(
  userId: string,
  videoId: string,
  requiredRole?: Role,
) {
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  if (!video) {
    throw Object.assign(new Error("Video not found"), { statusCode: 404 });
  }

  const { project, membership } = await requireProjectAccess(userId, video.projectId, requiredRole);
  return { video, project, membership };
}
