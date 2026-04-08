import { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { teams, teamMembers, projects, videos } from "../db/schema.js";
import { requireUser } from "../lib/auth.js";

function buildCanonicalPath(input: { teamId: string; projectId?: string; videoId?: string }) {
  if (input.videoId && input.projectId) {
    return `/dashboard/${input.teamId}/${input.projectId}/${input.videoId}`;
  }
  if (input.projectId) {
    return `/dashboard/${input.teamId}/${input.projectId}`;
  }
  return `/dashboard/${input.teamId}`;
}

export default async function workspaceRoutes(fastify: FastifyInstance) {
  // GET /api/workspace/resolve — resolve workspace context
  fastify.get("/api/workspace/resolve", async (request, reply) => {
    const user = requireUser(request, reply);

    const query = request.query as { teamId?: string; projectId?: string; videoId?: string };

    let team: typeof teams.$inferSelect | null = null;
    let project: typeof projects.$inferSelect | null = null;
    let video: typeof videos.$inferSelect | null = null;

    if (query.videoId) {
      const [v] = await fastify.db.select().from(videos).where(eq(videos.id, query.videoId)).limit(1);
      if (!v) return null;
      video = v;

      const [p] = await fastify.db.select().from(projects).where(eq(projects.id, v.projectId)).limit(1);
      if (!p) return null;
      project = p;

      const [t] = await fastify.db.select().from(teams).where(eq(teams.id, p.teamId)).limit(1);
      if (!t) return null;
      team = t;
    } else if (query.projectId) {
      const [p] = await fastify.db.select().from(projects).where(eq(projects.id, query.projectId)).limit(1);
      if (!p) return null;
      project = p;

      const [t] = await fastify.db.select().from(teams).where(eq(teams.id, p.teamId)).limit(1);
      if (!t) return null;
      team = t;
    } else if (query.teamId) {
      const [t] = await fastify.db.select().from(teams).where(eq(teams.id, query.teamId)).limit(1);
      if (!t) return null;
      team = t;
    } else {
      return null;
    }

    if (!team) return null;

    const [membership] = await fastify.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)))
      .limit(1);

    if (!membership) return null;

    const canonicalPath = buildCanonicalPath({
      teamId: team.id,
      projectId: project?.id,
      videoId: video?.id,
    });

    return {
      team: { ...team, role: membership.role },
      project: project ?? undefined,
      video: video ?? undefined,
      canonicalPath,
      isCanonical: true,
    };
  });
}
