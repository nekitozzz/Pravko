import { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { users, teams, teamMembers, teamInvites, projects, videos, comments, shareLinks, shareAccessGrants } from "../db/schema.js";
import { requireUser, ensureDbUser, requireTeamAccess } from "../lib/auth.js";
import { generateOpaqueToken } from "../services/security.js";
import { hasActiveSubscriptionStatus } from "../services/billing.js";
import { sendMail } from "../services/email.js";
import { buildTeamInviteEmail } from "../services/emailTemplates.js";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export default async function teamRoutes(fastify: FastifyInstance) {
  // POST /api/teams — create team
  fastify.post("/api/teams", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);
    const { name } = request.body as { name: string };

    let slug = generateSlug(name);
    let existing = await fastify.db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.slug, slug))
      .limit(1);

    let counter = 1;
    while (existing.length > 0) {
      slug = `${generateSlug(name)}-${counter}`;
      existing = await fastify.db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.slug, slug))
        .limit(1);
      counter++;
    }

    const [team] = await fastify.db
      .insert(teams)
      .values({
        name,
        slug,
        ownerId: dbUser.id,
        plan: "basic",
        billingStatus: "not_subscribed",
      })
      .returning();

    await fastify.db.insert(teamMembers).values({
      teamId: team.id,
      userId: dbUser.id,
      role: "owner",
    });

    return { teamId: team.id, slug: team.slug };
  });

  // GET /api/teams — list user's teams
  fastify.get("/api/teams", async (request, reply) => {
    const user = requireUser(request, reply);

    const memberships = await fastify.db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id));

    const result = await Promise.all(
      memberships.map(async (m) => {
        const [team] = await fastify.db.select().from(teams).where(eq(teams.id, m.teamId)).limit(1);
        if (!team) return null;

        const teamProjects = await fastify.db
          .select()
          .from(projects)
          .where(eq(projects.teamId, team.id));

        const projectsWithCounts = await Promise.all(
          teamProjects.map(async (p) => {
            const [{ count }] = await fastify.db
              .select({ count: sql<number>`count(*)::int` })
              .from(videos)
              .where(eq(videos.projectId, p.id));
            return { id: p.id, name: p.name, videoCount: count };
          }),
        );

        return { ...team, role: m.role, projects: projectsWithCounts };
      }),
    );

    return result.filter(Boolean);
  });

  // GET /api/teams/with-projects — list teams with projects
  fastify.get("/api/teams/with-projects", async (request, reply) => {
    const user = requireUser(request, reply);

    const memberships = await fastify.db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id));

    const result = await Promise.all(
      memberships.map(async (m) => {
        const [team] = await fastify.db.select().from(teams).where(eq(teams.id, m.teamId)).limit(1);
        if (!team) return null;

        const teamProjects = await fastify.db
          .select()
          .from(projects)
          .where(eq(projects.teamId, team.id));

        const projectsWithCounts = await Promise.all(
          teamProjects.map(async (p) => {
            const [{ count }] = await fastify.db
              .select({ count: sql<number>`count(*)::int` })
              .from(videos)
              .where(eq(videos.projectId, p.id));
            return { ...p, videoCount: count };
          }),
        );

        return { ...team, role: m.role, projects: projectsWithCounts };
      }),
    );

    return result.filter(Boolean);
  });

  // GET /api/teams/:id — get team by id
  fastify.get<{ Params: { id: string } }>("/api/teams/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    const { id } = request.params;

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    const membership = await requireTeamAccess(user.id, team.id);
    return { ...team, role: membership.role };
  });

  // PATCH /api/teams/:id — update team
  fastify.patch<{ Params: { id: string } }>("/api/teams/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id, "admin");

    const { name } = request.body as { name?: string };
    if (name) {
      await fastify.db.update(teams).set({ name }).where(eq(teams.id, request.params.id));
    }

    return { ok: true };
  });

  // DELETE /api/teams/:id — delete team
  fastify.delete<{ Params: { id: string } }>("/api/teams/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id, "owner");

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    if (hasActiveSubscriptionStatus(team.billingStatus)) {
      return reply.code(400).send({ error: "Cannot delete a team with an active subscription." });
    }

    // Cascade delete: members, invites, projects → videos → comments, share links
    await fastify.db.delete(teamMembers).where(eq(teamMembers.teamId, team.id));
    await fastify.db.delete(teamInvites).where(eq(teamInvites.teamId, team.id));

    const teamProjects = await fastify.db.select({ id: projects.id }).from(projects).where(eq(projects.teamId, team.id));
    for (const p of teamProjects) {
      const projectVideos = await fastify.db.select({ id: videos.id }).from(videos).where(eq(videos.projectId, p.id));
      for (const v of projectVideos) {
        await fastify.db.delete(comments).where(eq(comments.videoId, v.id));
        const links = await fastify.db.select({ id: shareLinks.id }).from(shareLinks).where(eq(shareLinks.videoId, v.id));
        for (const l of links) {
          await fastify.db.delete(shareAccessGrants).where(eq(shareAccessGrants.shareLinkId, l.id));
        }
        await fastify.db.delete(shareLinks).where(eq(shareLinks.videoId, v.id));
      }
      await fastify.db.delete(videos).where(eq(videos.projectId, p.id));
    }
    await fastify.db.delete(projects).where(eq(projects.teamId, team.id));
    await fastify.db.delete(teams).where(eq(teams.id, team.id));

    return { ok: true };
  });

  // GET /api/teams/:id/members
  fastify.get<{ Params: { id: string } }>("/api/teams/:id/members", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id);

    const members = await fastify.db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        createdAt: teamMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, request.params.id));

    return members;
  });

  // POST /api/teams/:id/invites — invite member
  fastify.post<{ Params: { id: string } }>("/api/teams/:id/invites", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);
    await requireTeamAccess(user.id, request.params.id, "admin");

    const { email, role } = request.body as { email: string; role: string };
    const normalizedEmail = email.trim().toLowerCase();

    // Check if already a member
    const membersWithEmail = await fastify.db
      .select({ id: teamMembers.id, email: users.email })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(and(
        eq(teamMembers.teamId, request.params.id),
        eq(users.email, normalizedEmail),
      ));

    if (membersWithEmail.length > 0) {
      return reply.code(400).send({ error: "User is already a member of this team" });
    }

    // Delete existing invite for same email
    const existingInvites = await fastify.db
      .select()
      .from(teamInvites)
      .where(and(eq(teamInvites.teamId, request.params.id), eq(teamInvites.email, normalizedEmail)));

    for (const inv of existingInvites) {
      await fastify.db.delete(teamInvites).where(eq(teamInvites.id, inv.id));
    }

    const token = generateOpaqueToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await fastify.db.insert(teamInvites).values({
      teamId: request.params.id,
      email: normalizedEmail,
      role,
      invitedById: dbUser.id,
      invitedByName: dbUser.name,
      token,
      expiresAt,
    });

    // Fire-and-forget invite email
    const [team] = await fastify.db.select({ name: teams.name }).from(teams).where(eq(teams.id, request.params.id)).limit(1);
    const publicUrl = process.env.PUBLIC_URL || "http://localhost:5296";
    const inviteUrl = `${publicUrl}/invite/${token}`;

    sendMail(
      buildTeamInviteEmail({
        to: normalizedEmail,
        teamName: team?.name ?? "Unknown",
        invitedByName: dbUser.name ?? "Someone",
        role,
        inviteUrl,
      }),
    ).catch(() => {});

    return { token };
  });

  // GET /api/teams/:id/invites
  fastify.get<{ Params: { id: string } }>("/api/teams/:id/invites", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id, "admin");

    const invites = await fastify.db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.teamId, request.params.id));

    return invites.filter((i) => i.expiresAt > new Date());
  });

  // POST /api/teams/invites/:token/accept
  fastify.post<{ Params: { token: string } }>("/api/teams/invites/:token/accept", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);

    const [invite] = await fastify.db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.token, request.params.token))
      .limit(1);

    if (!invite) return reply.code(404).send({ error: "Invalid invite" });
    if (invite.expiresAt < new Date()) return reply.code(400).send({ error: "Invite has expired" });
    if (invite.email !== dbUser.email?.toLowerCase()) {
      return reply.code(403).send({ error: "Invite is for a different email address" });
    }

    const [existing] = await fastify.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, invite.teamId), eq(teamMembers.userId, dbUser.id)))
      .limit(1);

    if (existing) return reply.code(400).send({ error: "Already a member" });

    await fastify.db.insert(teamMembers).values({
      teamId: invite.teamId,
      userId: dbUser.id,
      role: invite.role,
    });

    await fastify.db.delete(teamInvites).where(eq(teamInvites.id, invite.id));

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, invite.teamId)).limit(1);
    return team;
  });

  // GET /api/teams/invites/:token — get invite info
  fastify.get<{ Params: { token: string } }>("/api/teams/invites/:token", async (request) => {
    const [invite] = await fastify.db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.token, request.params.token))
      .limit(1);

    if (!invite || invite.expiresAt < new Date()) return null;

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, invite.teamId)).limit(1);

    return {
      id: invite.id,
      teamName: team?.name ?? "Unknown",
      email: invite.email,
      role: invite.role,
      invitedByName: invite.invitedByName ?? undefined,
      expiresAt: invite.expiresAt.toISOString(),
    };
  });

  // DELETE /api/teams/:id/invites/:inviteId — revoke pending invite
  fastify.delete<{ Params: { id: string; inviteId: string } }>("/api/teams/:id/invites/:inviteId", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id, "admin");

    const [invite] = await fastify.db
      .select()
      .from(teamInvites)
      .where(and(eq(teamInvites.id, request.params.inviteId), eq(teamInvites.teamId, request.params.id)))
      .limit(1);

    if (!invite) return reply.code(404).send({ error: "Invite not found" });

    await fastify.db.delete(teamInvites).where(eq(teamInvites.id, invite.id));
    return { ok: true };
  });

  // DELETE /api/teams/:id/members/:userId
  fastify.delete<{ Params: { id: string; userId: string } }>("/api/teams/:id/members/:userId", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id, "admin");

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    if (team.ownerId === request.params.userId) {
      return reply.code(400).send({ error: "Cannot remove the team owner" });
    }
    if (request.params.userId === user.id) {
      return reply.code(400).send({ error: "Cannot remove yourself. Use leave instead." });
    }

    await fastify.db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, request.params.id), eq(teamMembers.userId, request.params.userId)));

    return { ok: true };
  });

  // PATCH /api/teams/:id/members/:userId/role
  fastify.patch<{ Params: { id: string; userId: string } }>("/api/teams/:id/members/:userId/role", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id, "admin");

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    if (team.ownerId === request.params.userId) {
      return reply.code(400).send({ error: "Cannot change the team owner's role" });
    }

    const { role } = request.body as { role: string };
    await fastify.db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.teamId, request.params.id), eq(teamMembers.userId, request.params.userId)));

    return { ok: true };
  });

  // POST /api/teams/:id/leave
  fastify.post<{ Params: { id: string } }>("/api/teams/:id/leave", async (request, reply) => {
    const user = requireUser(request, reply);

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    if (team.ownerId === user.id) {
      return reply.code(400).send({ error: "Team owner cannot leave. Transfer ownership first." });
    }

    await fastify.db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, request.params.id), eq(teamMembers.userId, user.id)));

    return { ok: true };
  });
}
