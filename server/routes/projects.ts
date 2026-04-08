import { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { projects, videos, comments, shareLinks, shareAccessGrants, teamMembers } from "../db/schema.js";
import { requireUser, requireTeamAccess, requireProjectAccess } from "../lib/auth.js";
import { hasActiveSubscriptionStatus } from "../services/billing.js";
import { teams } from "../db/schema.js";
import { notifyVideoList } from "../lib/realtime.js";

export default async function projectRoutes(fastify: FastifyInstance) {
  // POST /api/teams/:teamId/projects — create project
  fastify.post<{ Params: { teamId: string } }>("/api/teams/:teamId/projects", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.teamId, "member");

    // Check subscription
    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.teamId)).limit(1);
    if (!team || !hasActiveSubscriptionStatus(team.billingStatus)) {
      return reply.code(402).send({ error: "An active subscription is required." });
    }

    const { name, description } = request.body as { name: string; description?: string };

    const [project] = await fastify.db
      .insert(projects)
      .values({
        teamId: request.params.teamId,
        name,
        description,
      })
      .returning();

    return project;
  });

  // GET /api/teams/:teamId/projects — list projects
  fastify.get<{ Params: { teamId: string } }>("/api/teams/:teamId/projects", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.teamId);

    const teamProjects = await fastify.db
      .select()
      .from(projects)
      .where(eq(projects.teamId, request.params.teamId));

    const projectsWithCounts = await Promise.all(
      teamProjects.map(async (p) => {
        const [{ count }] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(videos)
          .where(eq(videos.projectId, p.id));
        return { ...p, videoCount: count };
      }),
    );

    return projectsWithCounts;
  });

  // GET /api/teams/:teamId/projects/upload-targets — list upload targets
  fastify.get<{ Params: { teamId: string } }>("/api/teams/:teamId/projects/upload-targets", async (request, reply) => {
    const user = requireUser(request, reply);
    const membership = await requireTeamAccess(user.id, request.params.teamId);

    if (membership.role === "viewer") return [];

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.teamId)).limit(1);
    if (!team) return [];

    const teamProjects = await fastify.db
      .select()
      .from(projects)
      .where(eq(projects.teamId, request.params.teamId));

    return teamProjects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      teamId: team.id,
      teamName: team.name,
      teamSlug: team.slug,
      role: membership.role,
    }));
  });

  // GET /api/projects/upload-targets — list upload targets across teams
  fastify.get<{ Querystring: { teamId?: string } }>("/api/projects/upload-targets", async (request, reply) => {
    const user = requireUser(request, reply);
    const { teamId } = request.query;

    const memberships = await fastify.db.select().from(teamMembers).where(eq(teamMembers.userId, user.id));

    const results: { projectId: string; projectName: string; teamName: string }[] = [];

    for (const m of memberships) {
      if (m.role === "viewer") continue;
      const [team] = await fastify.db.select().from(teams).where(eq(teams.id, m.teamId)).limit(1);
      if (!team) continue;
      if (teamId && team.id !== teamId) continue;

      const teamProjects = await fastify.db.select().from(projects).where(eq(projects.teamId, team.id));
      for (const p of teamProjects) {
        results.push({ projectId: p.id, projectName: p.name, teamName: team.name });
      }
    }

    return results;
  });

  // GET /api/projects/:id — get project
  fastify.get<{ Params: { id: string } }>("/api/projects/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    const { project, membership } = await requireProjectAccess(user.id, request.params.id);
    return { ...project, role: membership.role };
  });

  // PATCH /api/projects/:id — update project
  fastify.patch<{ Params: { id: string } }>("/api/projects/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireProjectAccess(user.id, request.params.id, "member");

    const { name, description } = request.body as { name?: string; description?: string };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length > 0) {
      await fastify.db.update(projects).set(updates).where(eq(projects.id, request.params.id));
    }

    return { ok: true };
  });

  // DELETE /api/projects/:id — delete project
  fastify.delete<{ Params: { id: string } }>("/api/projects/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireProjectAccess(user.id, request.params.id, "admin");

    const projectVideos = await fastify.db
      .select({ id: videos.id })
      .from(videos)
      .where(eq(videos.projectId, request.params.id));

    for (const v of projectVideos) {
      await fastify.db.delete(comments).where(eq(comments.videoId, v.id));
      const links = await fastify.db.select({ id: shareLinks.id }).from(shareLinks).where(eq(shareLinks.videoId, v.id));
      for (const l of links) {
        await fastify.db.delete(shareAccessGrants).where(eq(shareAccessGrants.shareLinkId, l.id));
      }
      await fastify.db.delete(shareLinks).where(eq(shareLinks.videoId, v.id));
    }
    await fastify.db.delete(videos).where(eq(videos.projectId, request.params.id));
    await fastify.db.delete(projects).where(eq(projects.id, request.params.id));

    return { ok: true };
  });
}
