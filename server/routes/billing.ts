import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { teams, users } from "../db/schema.js";
import { requireUser, requireTeamAccess, ensureDbUser } from "../lib/auth.js";
import {
  normalizeTeamPlan,
  hasActiveSubscriptionStatus,
  TEAM_PLAN_MONTHLY_PRICE_RUB,
  TEAM_PLAN_STORAGE_LIMIT_BYTES,
  getTeamStorageUsedBytes,
  createYookassaPayment,
  isYookassaWebhookIp,
  fetchYookassaPaymentStatus,
  TeamPlan,
} from "../services/billing.js";
import { sendMail } from "../services/email.js";
import { buildUpgradeRequestEmail, buildSubscriptionCanceledEmail } from "../services/emailTemplates.js";

export default async function billingRoutes(fastify: FastifyInstance) {
  // GET /api/teams/:id/billing — get team billing info
  fastify.get<{ Params: { id: string } }>("/api/teams/:id/billing", async (request, reply) => {
    const user = requireUser(request, reply);
    const membership = await requireTeamAccess(user.id, request.params.id);

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    const plan = normalizeTeamPlan(team.plan);
    const storageUsedBytes = await getTeamStorageUsedBytes(team.id);

    return {
      plan,
      monthlyPriceRub: TEAM_PLAN_MONTHLY_PRICE_RUB[plan],
      storageLimitBytes: TEAM_PLAN_STORAGE_LIMIT_BYTES[plan],
      storageUsedBytes,
      hasActiveSubscription: hasActiveSubscriptionStatus(team.billingStatus),
      subscriptionStatus: team.billingStatus,
      currentPeriodEnd: team.currentPeriodEnd ? Math.floor(team.currentPeriodEnd.getTime() / 1000) : null,
      canceledAt: team.canceledAt ? Math.floor(team.canceledAt.getTime() / 1000) : null,
      yookassaCustomerId: team.yookassaCustomerId,
      yookassaSubscriptionId: team.yookassaSubscriptionId,
      role: membership.role,
      canManageBilling: membership.role === "owner",
    };
  });

  // POST /api/teams/:id/billing/checkout — create subscription checkout
  fastify.post<{ Params: { id: string } }>("/api/teams/:id/billing/checkout", async (request, reply) => {
    const user = requireUser(request, reply);
    const membership = await requireTeamAccess(user.id, request.params.id);

    if (membership.role !== "owner") {
      return reply.code(403).send({ error: "Only team owners can manage billing." });
    }

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    const { plan, returnUrl } = request.body as { plan: TeamPlan; returnUrl: string };

    if (hasActiveSubscriptionStatus(team.billingStatus) && normalizeTeamPlan(team.plan) === plan) {
      return reply.code(400).send({ error: "This team is already on this plan." });
    }
    const amount = TEAM_PLAN_MONTHLY_PRICE_RUB[plan];

    const payment = await createYookassaPayment({
      amount,
      description: `Pravko ${plan} subscription for ${team.name}`,
      returnUrl,
      metadata: {
        teamId: team.id,
        plan,
        userId: user.id,
      },
      savePaymentMethod: true,
      idempotencyKey: `${team.id}-${plan}-${Date.now()}`,
    });

    return {
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
    };
  });

  // POST /api/teams/:id/billing/cancel — cancel subscription
  fastify.post<{ Params: { id: string } }>("/api/teams/:id/billing/cancel", async (request, reply) => {
    const user = requireUser(request, reply);
    const membership = await requireTeamAccess(user.id, request.params.id);

    if (membership.role !== "owner") {
      return reply.code(403).send({ error: "Only team owners can manage billing." });
    }

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    if (!hasActiveSubscriptionStatus(team.billingStatus)) {
      return reply.code(400).send({ error: "This team does not have an active subscription." });
    }

    const currentPeriodEnd = team.currentPeriodEnd || new Date();
    const cleanupAfter = team.currentPeriodEnd
      ? new Date(team.currentPeriodEnd.getTime() + 10 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    await fastify.db.update(teams).set({
      canceledAt: new Date(),
      cleanupAfter,
    }).where(eq(teams.id, team.id));

    // Notify team owner about cancellation
    const [owner] = await fastify.db.select({ email: users.email }).from(users).where(eq(users.id, team.ownerId)).limit(1);
    if (owner?.email) {
      void sendMail(buildSubscriptionCanceledEmail({
        to: owner.email,
        teamName: team.name,
        currentPeriodEnd,
        cleanupAfter,
      }));
    }

    return { ok: true };
  });

  // POST /api/teams/:id/billing/request-upgrade — request a plan upgrade
  fastify.post<{ Params: { id: string } }>("/api/teams/:id/billing/request-upgrade", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireTeamAccess(user.id, request.params.id);
    const dbUser = await ensureDbUser(user);

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, request.params.id)).limit(1);
    if (!team) return reply.code(404).send({ error: "Team not found" });

    const { message } = request.body as { message: string };
    if (!message || !message.trim()) {
      return reply.code(400).send({ error: "Message is required" });
    }

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (!supportEmail) {
      fastify.log.warn("[billing] SUPPORT_EMAIL not configured");
      return reply.code(500).send({ error: "Support email not configured" });
    }

    const plan = normalizeTeamPlan(team.plan);

    await sendMail(
      buildUpgradeRequestEmail({
        userName: dbUser.name || "Unknown",
        userEmail: dbUser.email || "",
        teamName: team.name,
        currentPlan: plan,
        message: message.trim(),
        to: supportEmail,
      }),
    );

    return { ok: true };
  });

  // POST /api/yookassa/webhook — handle YooKassa webhooks
  fastify.post("/api/yookassa/webhook", async (request, reply) => {
    // Verify request comes from YooKassa IP range
    const clientIp = request.ip;
    if (!isYookassaWebhookIp(clientIp)) {
      fastify.log.warn(`Rejected webhook from unknown IP: ${clientIp}`);
      return reply.code(403).send({ error: "Forbidden" });
    }

    const body = request.body as {
      type: string;
      event: string;
      object: {
        id: string;
        status: string;
        payment_method?: { id: string; saved: boolean };
        metadata?: Record<string, string>;
        amount?: { value: string; currency: string };
      };
    };

    const { event, object: paymentObject } = body;

    // Confirm payment status via API (don't trust webhook payload alone)
    const verified = await fetchYookassaPaymentStatus(paymentObject.id);
    if (!verified) {
      fastify.log.warn(`Could not verify payment ${paymentObject.id} via API`);
      return reply.code(200).send({ ok: true });
    }

    const metadata = verified.metadata || {};
    const teamId = metadata.teamId;

    if (!teamId) {
      return reply.code(200).send({ ok: true });
    }

    const [team] = await fastify.db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!team) {
      return reply.code(200).send({ ok: true });
    }

    switch (event) {
      case "payment.succeeded": {
        const plan = (metadata.plan as TeamPlan) || "basic";
        const updates: Record<string, unknown> = {
          plan,
          billingStatus: "active",
          yookassaCustomerId: paymentObject.payment_method?.id || team.yookassaCustomerId,
          yookassaSubscriptionId: paymentObject.id,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          canceledAt: null,
          cleanupAfter: null,
        };

        await fastify.db.update(teams).set(updates).where(eq(teams.id, teamId));
        break;
      }

      case "payment.canceled": {
        const currentPeriodEnd = team.currentPeriodEnd || new Date();
        const cleanupAfter = team.currentPeriodEnd
          ? new Date(team.currentPeriodEnd.getTime() + 10 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        await fastify.db.update(teams).set({
          billingStatus: "canceled",
          cleanupAfter,
        }).where(eq(teams.id, teamId));

        // Notify team owner
        const [cancelOwner] = await fastify.db.select({ email: users.email }).from(users).where(eq(users.id, team.ownerId)).limit(1);
        if (cancelOwner?.email) {
          void sendMail(buildSubscriptionCanceledEmail({
            to: cancelOwner.email,
            teamName: team.name,
            currentPeriodEnd,
            cleanupAfter,
          }));
        }
        break;
      }

      case "refund.succeeded": {
        await fastify.db.update(teams).set({
          billingStatus: "refunded",
        }).where(eq(teams.id, teamId));
        break;
      }
    }

    return { ok: true };
  });
}
