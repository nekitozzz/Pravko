import { FastifyInstance } from "fastify";
import { requireUser, ensureDbUser } from "../lib/auth.js";
import { sendMail } from "../services/email.js";
import { buildFeedbackEmail } from "../services/emailTemplates.js";

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post("/api/feedback", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);

    const { type, message } = request.body as {
      type: string;
      message: string;
    };

    if (!message || !message.trim()) {
      return reply.code(400).send({ error: "Message is required" });
    }

    if (type !== "bug" && type !== "feedback") {
      return reply.code(400).send({ error: "Type must be 'bug' or 'feedback'" });
    }

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (!supportEmail) {
      fastify.log.warn("[feedback] SUPPORT_EMAIL not configured");
      return reply.code(500).send({ error: "Feedback not configured" });
    }

    await sendMail(
      buildFeedbackEmail({
        userName: dbUser.name || "Unknown",
        userEmail: dbUser.email || "",
        type,
        message: message.trim(),
        to: supportEmail,
      }),
    );

    return { ok: true };
  });
}
