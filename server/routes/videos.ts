import { FastifyInstance } from "fastify";
import { eq, sql, desc } from "drizzle-orm";
import { Queue } from "bullmq";
import { videos, comments, shareLinks, shareAccessGrants, transcodeJobs, projects } from "../db/schema.js";
import { requireUser, ensureDbUser, requireProjectAccess, requireVideoAccess } from "../lib/auth.js";
import { notifyVideoList, notifyVideo } from "../lib/realtime.js";
import { generateOpaqueToken } from "../services/security.js";
import {
  validateUploadRequest,
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  headObject,
  deleteObject,
  deletePrefix,
  getExtensionFromKey,
  buildDownloadFilename,
  buildHlsUrl,
  buildThumbnailUrl,
  normalizeContentType,
  createMultipartUpload,
  generatePresignedPartUrls,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../services/storage.js";
import { assertTeamCanStoreBytes, assertActiveSubscription } from "../services/billing.js";

let transcodeQueue: Queue | null = null;
function getTranscodeQueue(fastify: FastifyInstance): Queue {
  if (!transcodeQueue) {
    const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:4380");
    transcodeQueue = new Queue("transcode", {
      connection: {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port || "4380"),
      },
    });
  }
  return transcodeQueue;
}

export default async function videoRoutes(fastify: FastifyInstance) {
  // POST /api/projects/:projectId/videos — create video
  fastify.post<{ Params: { projectId: string } }>("/api/projects/:projectId/videos", async (request, reply) => {
    const user = requireUser(request, reply);
    const dbUser = await ensureDbUser(user);
    const { project } = await requireProjectAccess(user.id, request.params.projectId, "member");

    const { title, description, fileSize, contentType } = request.body as {
      title: string;
      description?: string;
      fileSize?: number;
      contentType?: string;
    };

    if (fileSize) {
      await assertTeamCanStoreBytes(project.teamId, fileSize);
    }

    const publicId = generateOpaqueToken(32);

    const [video] = await fastify.db
      .insert(videos)
      .values({
        projectId: request.params.projectId,
        uploadedById: dbUser.id,
        uploaderName: dbUser.name,
        title,
        description,
        fileSize: fileSize ?? null,
        contentType: contentType ?? null,
        status: "uploading",
        workflowStatus: "review",
        visibility: "public",
        publicId,
      })
      .returning();

    notifyVideoList(fastify, request.params.projectId);
    return video;
  });

  // GET /api/projects/:projectId/videos — list videos
  fastify.get<{ Params: { projectId: string } }>("/api/projects/:projectId/videos", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireProjectAccess(user.id, request.params.projectId);

    const videoList = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.projectId, request.params.projectId))
      .orderBy(desc(videos.createdAt));

    const result = await Promise.all(
      videoList.map(async (v) => {
        const [{ count }] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(comments)
          .where(eq(comments.videoId, v.id));
        return { ...v, commentCount: count };
      }),
    );

    return result;
  });

  // GET /api/videos/:id — get video
  fastify.get<{ Params: { id: string } }>("/api/videos/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    const { video, membership } = await requireVideoAccess(user.id, request.params.id);
    return { ...video, role: membership.role };
  });

  // GET /api/videos/public/:publicId — get public video
  fastify.get<{ Params: { publicId: string } }>("/api/videos/public/:publicId", async (request) => {
    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.publicId, request.params.publicId))
      .limit(1);

    if (!video || video.visibility !== "public" || video.status !== "ready") {
      return null;
    }

    return {
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        thumbnailUrl: video.thumbnailUrl,
        contentType: video.contentType,
        s3Key: video.s3Key,
      },
    };
  });

  // PATCH /api/videos/:id — update video
  fastify.patch<{ Params: { id: string } }>("/api/videos/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    const { video } = await requireVideoAccess(user.id, request.params.id, "member");

    const { title, description } = request.body as { title?: string; description?: string };
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length > 0) {
      await fastify.db.update(videos).set(updates).where(eq(videos.id, request.params.id));
    }

    notifyVideo(fastify, request.params.id);
    return { ok: true };
  });

  // DELETE /api/videos/:id — delete video
  fastify.delete<{ Params: { id: string } }>("/api/videos/:id", async (request, reply) => {
    const user = requireUser(request, reply);
    const { video } = await requireVideoAccess(user.id, request.params.id, "admin");

    await fastify.db.delete(comments).where(eq(comments.videoId, video.id));
    const links = await fastify.db.select({ id: shareLinks.id }).from(shareLinks).where(eq(shareLinks.videoId, video.id));
    for (const l of links) {
      await fastify.db.delete(shareAccessGrants).where(eq(shareAccessGrants.shareLinkId, l.id));
    }
    await fastify.db.delete(shareLinks).where(eq(shareLinks.videoId, video.id));
    await fastify.db.delete(transcodeJobs).where(eq(transcodeJobs.videoId, video.id));
    await fastify.db.delete(videos).where(eq(videos.id, video.id));

    // Clean up S3 objects (raw upload, HLS segments, thumbnail)
    const { s3, s3Bucket } = fastify;
    await Promise.all([
      deletePrefix(s3, s3Bucket, `raw/${video.id}/`),
      deletePrefix(s3, s3Bucket, `hls/${video.id}/`),
      deletePrefix(s3, s3Bucket, `thumb/${video.id}/`),
    ]);

    notifyVideoList(fastify, video.projectId);
    return { ok: true };
  });

  // PATCH /api/videos/:id/visibility
  fastify.patch<{ Params: { id: string } }>("/api/videos/:id/visibility", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { visibility } = request.body as { visibility: string };
    await fastify.db.update(videos).set({ visibility }).where(eq(videos.id, request.params.id));

    notifyVideo(fastify, request.params.id);
    return { ok: true };
  });

  // PATCH /api/videos/:id/workflow
  fastify.patch<{ Params: { id: string } }>("/api/videos/:id/workflow", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { workflowStatus } = request.body as { workflowStatus: string };
    await fastify.db.update(videos).set({ workflowStatus }).where(eq(videos.id, request.params.id));

    notifyVideo(fastify, request.params.id);
    notifyVideoList(fastify, (await fastify.db.select({ projectId: videos.projectId }).from(videos).where(eq(videos.id, request.params.id)).limit(1))[0].projectId);
    return { ok: true };
  });

  // POST /api/videos/:id/upload-url — get presigned upload URL
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/upload-url", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { filename, fileSize, contentType } = request.body as {
      filename: string;
      fileSize: number;
      contentType: string;
    };

    const normalizedContentType = validateUploadRequest({ fileSize, contentType });
    const ext = getExtensionFromKey(filename);
    const key = `raw/${request.params.id}/${Date.now()}.${ext}`;

    const url = await generatePresignedPutUrl(
      fastify.s3,
      fastify.s3Bucket,
      key,
      normalizedContentType,
    );

    // Update video record with upload info
    await fastify.db.update(videos).set({
      s3Key: key,
      fileSize,
      contentType: normalizedContentType,
      status: "uploading",
      uploadError: null,
      thumbnailUrl: null,
      duration: null,
    }).where(eq(videos.id, request.params.id));

    notifyVideo(fastify, request.params.id);
    return { url, uploadId: key };
  });

  // POST /api/videos/:id/upload-complete — mark upload as complete, start transcode
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/upload-complete", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, request.params.id))
      .limit(1);

    if (!video?.s3Key) {
      return reply.code(400).send({ error: "No upload file found for this video" });
    }

    try {
      // Verify file exists in S3
      const head = await headObject(fastify.s3, fastify.s3Bucket, video.s3Key);
      if (!head.contentLength || head.contentLength <= 0) {
        throw new Error("Uploaded video file not found or empty.");
      }

      const normalized = normalizeContentType(head.contentType ?? video.contentType);
      validateUploadRequest({ fileSize: head.contentLength, contentType: normalized || "video/mp4" });

      // Reconcile file size
      const [project] = await fastify.db.select().from(projects).where(eq(projects.id, video.projectId)).limit(1);
      if (project) {
        const declaredSize = typeof video.fileSize === "number" ? Math.max(0, video.fileSize) : 0;
        const actualSize = Math.max(0, head.contentLength);
        const delta = actualSize - declaredSize;
        if (delta > 0) {
          await assertTeamCanStoreBytes(project.teamId, delta);
        }
      }

      // Update video status to processing
      await fastify.db.update(videos).set({
        status: "processing",
        fileSize: head.contentLength,
        contentType: normalized || video.contentType,
        uploadError: null,
      }).where(eq(videos.id, request.params.id));

      // Create transcode job
      const [job] = await fastify.db
        .insert(transcodeJobs)
        .values({ videoId: request.params.id, status: "pending" })
        .returning();

      // Enqueue BullMQ job
      const queue = getTranscodeQueue(fastify);
      await queue.add("transcode", {
        videoId: request.params.id,
        projectId: video.projectId,
        s3Key: video.s3Key,
        jobId: job.id,
      });

      notifyVideo(fastify, request.params.id);
      notifyVideoList(fastify, video.projectId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload processing failed";

      // Clean up S3 object on validation errors
      if (message.includes("Unsupported video format") || message.includes("too large") || message.includes("Storage limit")) {
        try { await deleteObject(fastify.s3, fastify.s3Bucket, video.s3Key); } catch {}
      }

      await fastify.db.update(videos).set({
        status: "failed",
        uploadError: message,
      }).where(eq(videos.id, request.params.id));

      notifyVideo(fastify, request.params.id);
      return reply.code(400).send({ error: message });
    }
  });

  // POST /api/videos/:id/upload-failed — mark upload as failed
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/upload-failed", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    await fastify.db.update(videos).set({
      status: "failed",
      uploadError: "Upload failed before processing could begin.",
    }).where(eq(videos.id, request.params.id));

    notifyVideo(fastify, request.params.id);
    return { success: true };
  });

  // GET /api/videos/:id/playback — get playback session (HLS URL)
  fastify.get<{ Params: { id: string } }>("/api/videos/:id/playback", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "viewer");

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, request.params.id))
      .limit(1);

    if (!video || video.status !== "ready") {
      return reply.code(404).send({ error: "Video not found or not ready" });
    }

    return {
      url: buildHlsUrl(fastify.s3PublicUrl, video.id),
      posterUrl: video.thumbnailUrl || buildThumbnailUrl(fastify.s3PublicUrl, video.id),
    };
  });

  // GET /api/videos/:id/download — get download URL
  fastify.get<{ Params: { id: string } }>("/api/videos/:id/download", async (request, reply) => {
    const user = requireUser(request, reply);
    const { project } = await requireVideoAccess(user.id, request.params.id, "viewer");
    await assertActiveSubscription(project.teamId);

    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.id, request.params.id))
      .limit(1);

    if (!video || video.status !== "ready" || !video.s3Key) {
      return reply.code(404).send({ error: "Video not found or not ready" });
    }

    const filename = buildDownloadFilename(video.title, video.s3Key);
    const url = await generatePresignedGetUrl(fastify.s3, fastify.s3Bucket, video.s3Key, {
      expiresIn: 600,
      filename,
      contentType: video.contentType || "video/mp4",
    });

    return { url, filename };
  });

  // GET /api/videos/public/:publicId/playback — public playback session
  fastify.get<{ Params: { publicId: string } }>("/api/videos/public/:publicId/playback", async (request) => {
    const [video] = await fastify.db
      .select()
      .from(videos)
      .where(eq(videos.publicId, request.params.publicId))
      .limit(1);

    if (!video || video.visibility !== "public" || video.status !== "ready") {
      return { error: "Video not found or not ready" };
    }

    return {
      url: buildHlsUrl(fastify.s3PublicUrl, video.id),
      posterUrl: video.thumbnailUrl || buildThumbnailUrl(fastify.s3PublicUrl, video.id),
    };
  });

  // ── Multipart Upload ──

  const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MiB

  // POST /api/videos/:id/multipart/initiate — start multipart upload
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/multipart/initiate", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { filename, fileSize, contentType } = request.body as {
      filename: string;
      fileSize: number;
      contentType: string;
    };

    const normalizedContentType = validateUploadRequest({ fileSize, contentType });
    const ext = getExtensionFromKey(filename);
    const key = `raw/${request.params.id}/${Date.now()}.${ext}`;

    const uploadId = await createMultipartUpload(
      fastify.s3,
      fastify.s3Bucket,
      key,
      normalizedContentType,
    );

    const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
    const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);
    const presignedUrls = await generatePresignedPartUrls(
      fastify.s3,
      fastify.s3Bucket,
      key,
      uploadId,
      partNumbers,
    );

    await fastify.db.update(videos).set({
      s3Key: key,
      fileSize,
      contentType: normalizedContentType,
      status: "uploading",
      uploadError: null,
      thumbnailUrl: null,
      duration: null,
    }).where(eq(videos.id, request.params.id));

    notifyVideo(fastify, request.params.id);

    return {
      uploadId,
      key,
      presignedUrls,
      chunkSize: CHUNK_SIZE,
      totalParts,
    };
  });

  // POST /api/videos/:id/multipart/presign-parts — refresh presigned URLs
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/multipart/presign-parts", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { uploadId, key, partNumbers } = request.body as {
      uploadId: string;
      key: string;
      partNumbers: number[];
    };

    if (!Array.isArray(partNumbers) || partNumbers.length === 0 || partNumbers.length > 200) {
      return reply.code(400).send({ error: "partNumbers must be an array of 1–200 part numbers" });
    }

    const presignedUrls = await generatePresignedPartUrls(
      fastify.s3,
      fastify.s3Bucket,
      key,
      uploadId,
      partNumbers,
    );

    return { presignedUrls };
  });

  // POST /api/videos/:id/multipart/complete — assemble multipart upload
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/multipart/complete", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { uploadId, key, parts } = request.body as {
      uploadId: string;
      key: string;
      parts: { partNumber: number; etag: string }[];
    };

    await completeMultipartUpload(fastify.s3, fastify.s3Bucket, key, uploadId, parts);

    return { ok: true };
  });

  // POST /api/videos/:id/multipart/abort — abort multipart upload
  fastify.post<{ Params: { id: string } }>("/api/videos/:id/multipart/abort", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { uploadId, key } = request.body as {
      uploadId: string;
      key: string;
    };

    try {
      await abortMultipartUpload(fastify.s3, fastify.s3Bucket, key, uploadId);
    } catch {
      // Best-effort abort — ignore errors
    }

    return { ok: true };
  });

  // PATCH /api/videos/:id/duration — update duration
  fastify.patch<{ Params: { id: string } }>("/api/videos/:id/duration", async (request, reply) => {
    const user = requireUser(request, reply);
    await requireVideoAccess(user.id, request.params.id, "member");

    const { duration } = request.body as { duration: number };
    await fastify.db.update(videos).set({ duration }).where(eq(videos.id, request.params.id));

    return { ok: true };
  });
}
