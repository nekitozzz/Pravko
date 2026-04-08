import { Worker, Queue, Job } from "bullmq";
import { S3Client } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import Redis from "ioredis";
import * as schema from "../db/schema.js";
import { transcodeToHls, type TranscodeStage } from "../services/transcode.js";
import { buildHlsUrl, buildThumbnailUrl } from "../services/storage.js";
import { cleanExpiredTeamVideos, sendRetentionWarnings } from "../services/retention.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
const db = drizzle(pool, { schema });

const s3 = new S3Client({
  region: process.env.S3_REGION || "ru-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const bucket = process.env.S3_BUCKET || "pravko-videos";
const publicUrl = process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${bucket}`;

const redisPub = new Redis(process.env.REDIS_URL || "redis://localhost:4380", {
  maxRetriesPerRequest: 3,
});

let lastPublished = { stage: "", percent: 0, time: 0 };
function publishProgress(videoId: string, projectId: string, stage: TranscodeStage, percent: number) {
  const now = Date.now();
  const roundedPercent = Math.round(percent);
  // Throttle: skip if same stage+percent and less than 500ms since last publish
  if (lastPublished.stage === stage && lastPublished.percent === roundedPercent && now - lastPublished.time < 500) {
    return;
  }
  lastPublished = { stage, percent: roundedPercent, time: now };
  const message = JSON.stringify({ videoId, projectId, stage, percent: roundedPercent });
  redisPub.publish(`transcode:progress:${videoId}`, message).catch(() => {});
}

interface TranscodeJobData {
  videoId: string;
  projectId: string;
  s3Key: string;
  jobId: string;
}

const worker = new Worker<TranscodeJobData>(
  "transcode",
  async (job: Job<TranscodeJobData>) => {
    const { videoId, projectId, s3Key, jobId } = job.data;
    console.log(`[transcode] Starting job ${jobId} for video ${videoId}`);

    // Mark job as processing
    await db
      .update(schema.transcodeJobs)
      .set({ status: "processing", startedAt: new Date() })
      .where(eq(schema.transcodeJobs.id, jobId));

    try {
      const result = await transcodeToHls(s3, bucket, s3Key, videoId, publicUrl, (stage, percent) => {
        publishProgress(videoId, projectId, stage, percent);
      });

      // Update video record
      await db
        .update(schema.videos)
        .set({
          status: "ready",
          s3HlsPrefix: result.hlsPrefix,
          duration: result.duration,
          thumbnailUrl: buildThumbnailUrl(publicUrl, videoId),
          uploadError: null,
        })
        .where(eq(schema.videos.id, videoId));

      // Mark job as completed
      await db
        .update(schema.transcodeJobs)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(schema.transcodeJobs.id, jobId));

      console.log(`[transcode] Completed job ${jobId} for video ${videoId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown transcode error";
      console.error(`[transcode] Failed job ${jobId}:`, errorMessage);

      // Mark video as failed
      await db
        .update(schema.videos)
        .set({ status: "failed", uploadError: errorMessage })
        .where(eq(schema.videos.id, videoId));

      // Mark job as failed
      await db
        .update(schema.transcodeJobs)
        .set({ status: "failed", error: errorMessage, completedAt: new Date() })
        .where(eq(schema.transcodeJobs.id, jobId));

      throw error;
    }
  },
  {
    connection: {
      host: new URL(process.env.REDIS_URL || "redis://localhost:4380").hostname,
      port: parseInt(new URL(process.env.REDIS_URL || "redis://localhost:4380").port || "4380"),
    },
    concurrency: 1,
    limiter: { max: 1, duration: 1000 },
  },
);

worker.on("ready", () => console.log("[transcode] Worker ready"));
worker.on("failed", (job, err) => console.error(`[transcode] Job ${job?.id} failed:`, err.message));

// ── Retention Worker ──

const redisConnection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:4380").hostname,
  port: parseInt(new URL(process.env.REDIS_URL || "redis://localhost:4380").port || "4380"),
};

const retentionQueue = new Queue("retention", { connection: redisConnection });
void retentionQueue.add("cleanup", {}, { repeat: { pattern: "0 3 * * *" } });

const retentionWorker = new Worker(
  "retention",
  async () => {
    // Send warning emails first (teams with 3 days left)
    const warned = await sendRetentionWarnings(db);
    if (warned > 0) console.log(`[retention] Sent ${warned} warning emails`);

    // Then clean expired teams
    const count = await cleanExpiredTeamVideos(db, s3, bucket);
    if (count > 0) console.log(`[retention] Cleaned ${count} videos`);
  },
  { connection: redisConnection, concurrency: 1 },
);

retentionWorker.on("ready", () => console.log("[retention] Worker ready"));
retentionWorker.on("failed", (job, err) => console.error(`[retention] Job ${job?.id} failed:`, err.message));

process.on("SIGTERM", async () => {
  console.log("[worker] Shutting down...");
  await worker.close();
  await retentionWorker.close();
  await retentionQueue.close();
  await redisPub.quit();
  await pool.end();
  s3.destroy();
  process.exit(0);
});

console.log("[transcode] Worker started, waiting for jobs...");
