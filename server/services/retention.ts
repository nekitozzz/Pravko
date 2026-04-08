import { S3Client } from "@aws-sdk/client-s3";
import { eq, and, isNull, lte, not, inArray, or, gt, sql } from "drizzle-orm";
import type { Db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { deletePrefix } from "./storage.js";
import { sendMail } from "./email.js";
import { buildRetentionWarningEmail, buildVideosCleanedEmail } from "./emailTemplates.js";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/**
 * Send warning emails to teams whose videos will be cleaned within 3 days.
 * Only sends once — teams with cleanupAfter in (now, now+3d] that still have uncleaned videos.
 */
export async function sendRetentionWarnings(db: Db): Promise<number> {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Teams approaching cleanup: cleanupAfter is in the future but within 3 days
  const warningTeams = await db
    .select({
      id: schema.teams.id,
      name: schema.teams.name,
      ownerId: schema.teams.ownerId,
      cleanupAfter: schema.teams.cleanupAfter,
    })
    .from(schema.teams)
    .where(
      and(
        gt(schema.teams.cleanupAfter, now),
        lte(schema.teams.cleanupAfter, threeDaysFromNow),
        or(
          isNull(schema.teams.billingStatus),
          not(inArray(schema.teams.billingStatus, ACTIVE_STATUSES)),
        ),
      ),
    );

  let sentCount = 0;

  for (const team of warningTeams) {
    // Count uncleaned videos for this team
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.videos)
      .innerJoin(schema.projects, eq(schema.videos.projectId, schema.projects.id))
      .where(
        and(
          eq(schema.projects.teamId, team.id),
          isNull(schema.videos.cleanedAt),
        ),
      );

    const videoCount = result?.count ?? 0;
    if (videoCount === 0) continue;

    const [owner] = await db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, team.ownerId))
      .limit(1);

    if (owner?.email && team.cleanupAfter) {
      const sent = await sendMail(buildRetentionWarningEmail({
        to: owner.email,
        teamName: team.name,
        cleanupAfter: team.cleanupAfter,
        videoCount,
      }));
      if (sent) sentCount++;
    }
  }

  return sentCount;
}

/**
 * Clean up videos for teams whose cleanupAfter has passed.
 * Deletes S3 objects, soft-deletes comments, marks videos as tombstones.
 * Sends a notification email to the team owner after cleanup.
 */
export async function cleanExpiredTeamVideos(
  db: Db,
  s3: S3Client,
  bucket: string,
): Promise<number> {
  const now = new Date();

  // Find teams where cleanupAfter <= now AND billingStatus NOT in active statuses
  const expiredTeams = await db
    .select({
      id: schema.teams.id,
      name: schema.teams.name,
      ownerId: schema.teams.ownerId,
    })
    .from(schema.teams)
    .where(
      and(
        lte(schema.teams.cleanupAfter, now),
        or(
          isNull(schema.teams.billingStatus),
          not(inArray(schema.teams.billingStatus, ACTIVE_STATUSES)),
        ),
      ),
    );

  let cleanedCount = 0;

  for (const team of expiredTeams) {
    let teamCleanedCount = 0;

    const teamProjects = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.teamId, team.id));

    for (const project of teamProjects) {
      const teamVideos = await db
        .select({ id: schema.videos.id })
        .from(schema.videos)
        .where(
          and(
            eq(schema.videos.projectId, project.id),
            isNull(schema.videos.cleanedAt),
          ),
        );

      for (const video of teamVideos) {
        // Soft-delete all comments for this video
        await db
          .update(schema.comments)
          .set({ deletedAt: now })
          .where(
            and(
              eq(schema.comments.videoId, video.id),
              isNull(schema.comments.deletedAt),
            ),
          );

        // Delete S3 objects
        await Promise.all([
          deletePrefix(s3, bucket, `raw/${video.id}/`),
          deletePrefix(s3, bucket, `hls/${video.id}/`),
          deletePrefix(s3, bucket, `thumb/${video.id}/`),
        ]);

        // Mark video as cleaned (tombstone)
        await db
          .update(schema.videos)
          .set({
            cleanedAt: now,
            s3Key: null,
            s3HlsPrefix: null,
            status: "failed",
          })
          .where(eq(schema.videos.id, video.id));

        teamCleanedCount++;
        cleanedCount++;
      }
    }

    // Notify team owner that videos were cleaned
    if (teamCleanedCount > 0) {
      const [owner] = await db
        .select({ email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, team.ownerId))
        .limit(1);

      if (owner?.email) {
        void sendMail(buildVideosCleanedEmail({
          to: owner.email,
          teamName: team.name,
          videoCount: teamCleanedCount,
        }));
      }
    }
  }

  return cleanedCount;
}
