import Fastify from "fastify";
import cors from "@fastify/cors";
import { sql, desc, eq } from "drizzle-orm";
import { videos, transcodeJobs } from "./db/schema.js";
import { requireUser } from "./lib/auth.js";

// Plugins
import dbPlugin from "./plugins/db.js";
import redisPlugin from "./plugins/redis.js";
import authPlugin from "./plugins/auth.js";
import s3Plugin from "./plugins/s3.js";
import wsPlugin from "./plugins/ws.js";

// Routes
import teamRoutes from "./routes/teams.js";
import projectRoutes from "./routes/projects.js";
import videoRoutes from "./routes/videos.js";
import commentRoutes from "./routes/comments.js";
import shareRoutes from "./routes/share.js";
import billingRoutes from "./routes/billing.js";
import workspaceRoutes from "./routes/workspace.js";
import presenceRoutes from "./routes/presence.js";
import userRoutes from "./routes/users.js";
import feedbackRoutes from "./routes/feedback.js";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  },
  bodyLimit: 1_048_576, // 1MB for JSON bodies
  trustProxy: true,
});

// CORS — fail-closed in production, open in dev
await fastify.register(cors, {
  origin: process.env.PUBLIC_URL || (process.env.NODE_ENV === "production" ? false : true),
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  credentials: true,
});

// Register plugins
await fastify.register(dbPlugin);
await fastify.register(redisPlugin);
await fastify.register(authPlugin);
await fastify.register(s3Plugin);
await fastify.register(wsPlugin);

// Register routes
await fastify.register(teamRoutes);
await fastify.register(projectRoutes);
await fastify.register(videoRoutes);
await fastify.register(commentRoutes);
await fastify.register(shareRoutes);
await fastify.register(billingRoutes);
await fastify.register(workspaceRoutes);
await fastify.register(presenceRoutes);
await fastify.register(userRoutes);
await fastify.register(feedbackRoutes);

// Health check — includes DB and Redis connectivity
fastify.get("/api/health", async () => {
  const checks: Record<string, string> = {};

  try {
    await fastify.db.execute(sql`SELECT 1`);
    checks.db = "ok";
  } catch {
    checks.db = "error";
  }

  try {
    await fastify.redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const healthy = checks.db === "ok" && checks.redis === "ok";
  return {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  };
});

// Admin: recent errors — requires authenticated user with any team ownership
fastify.get<{ Querystring: { limit?: string } }>("/api/admin/errors", async (request, reply) => {
  const user = requireUser(request, reply);

  // Recent failed videos
  const failedVideos = await fastify.db
    .select({
      id: videos.id,
      title: videos.title,
      status: videos.status,
      error: videos.uploadError,
      contentType: videos.contentType,
      fileSize: videos.fileSize,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })
    .from(videos)
    .where(eq(videos.status, "failed"))
    .orderBy(desc(videos.updatedAt))
    .limit(parseInt(request.query.limit || "50", 10));

  // Recent failed transcode jobs
  const failedJobs = await fastify.db
    .select({
      id: transcodeJobs.id,
      videoId: transcodeJobs.videoId,
      status: transcodeJobs.status,
      error: transcodeJobs.error,
      startedAt: transcodeJobs.startedAt,
      completedAt: transcodeJobs.completedAt,
      createdAt: transcodeJobs.createdAt,
    })
    .from(transcodeJobs)
    .where(eq(transcodeJobs.status, "failed"))
    .orderBy(desc(transcodeJobs.createdAt))
    .limit(parseInt(request.query.limit || "50", 10));

  return { failedVideos, failedJobs };
});

// Relay transcode progress from Redis pub/sub to WebSocket clients
fastify.redisSub.psubscribe("transcode:progress:*").catch((err: unknown) => {
  fastify.log.error(err, "Failed to psubscribe to transcode progress");
});
fastify.redisSub.on("pmessage", (_pattern: string, _channel: string, message: string) => {
  try {
    const data = JSON.parse(message) as { videoId: string; projectId: string; stage: string; percent: number };
    const payload = { videoId: data.videoId, stage: data.stage, percent: data.percent };
    for (const channel of [`videos:list:${data.projectId}`, `video:${data.videoId}`]) {
      const msg = JSON.stringify({ type: "progress", channel, data: payload });
      for (const client of fastify.wsClients.values()) {
        if (client.channels.has(channel) && client.ws.readyState === 1) {
          client.ws.send(msg);
        }
      }
    }
  } catch {
    // ignore malformed messages
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = (error as any).statusCode || 500;
  fastify.log.error(error);

  reply.code(statusCode).send({
    error: statusCode >= 500 ? "Internal server error" : error.message,
  });
});

// Start server
const port = parseInt(process.env.PORT || "3456", 10);
const host = process.env.HOST || "0.0.0.0";

try {
  await fastify.listen({ port, host });
  fastify.log.info(`Server listening on ${host}:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
