import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  bigint,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  teams: many(teams),
}));

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  plan: text("plan").notNull().default("basic"),
  yookassaCustomerId: text("yookassa_customer_id"),
  yookassaSubscriptionId: text("yookassa_subscription_id"),
  billingStatus: text("billing_status"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  cleanupAfter: timestamp("cleanup_after", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_teams_slug").on(table.slug),
  index("idx_teams_owner").on(table.ownerId),
]);

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, { fields: [teams.ownerId], references: [users.id] }),
  members: many(teamMembers),
  invites: many(teamInvites),
  projects: many(projects),
}));

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_team_members_team_user").on(table.teamId, table.userId),
  index("idx_team_members_team").on(table.teamId),
  index("idx_team_members_user").on(table.userId),
]);

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const teamInvites = pgTable("team_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  invitedById: text("invited_by_id").notNull().references(() => users.id),
  invitedByName: text("invited_by_name"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_team_invites_token").on(table.token),
  index("idx_team_invites_team").on(table.teamId),
]);

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
  team: one(teams, { fields: [teamInvites.teamId], references: [teams.id] }),
  invitedBy: one(users, { fields: [teamInvites.invitedById], references: [users.id] }),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_projects_team").on(table.teamId),
]);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, { fields: [projects.teamId], references: [teams.id] }),
  videos: many(videos),
}));

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  uploadedById: text("uploaded_by_id").notNull().references(() => users.id),
  uploaderName: text("uploader_name"),
  title: text("title").notNull(),
  description: text("description"),
  visibility: text("visibility").notNull().default("public"),
  publicId: text("public_id").notNull().unique(),
  s3Key: text("s3_key"),
  s3HlsPrefix: text("s3_hls_prefix"),
  fileSize: bigint("file_size", { mode: "number" }),
  contentType: text("content_type"),
  duration: real("duration"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("uploading"),
  workflowStatus: text("workflow_status").notNull().default("review"),
  uploadError: text("upload_error"),
  transcodeJobId: text("transcode_job_id"),
  cleanedAt: timestamp("cleaned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_videos_project").on(table.projectId),
  uniqueIndex("idx_videos_public_id").on(table.publicId),
]);

export const videosRelations = relations(videos, ({ one, many }) => ({
  project: one(projects, { fields: [videos.projectId], references: [projects.id] }),
  uploadedBy: one(users, { fields: [videos.uploadedById], references: [users.id] }),
  comments: many(comments),
  shareLinks: many(shareLinks),
  transcodeJobs: many(transcodeJobs),
}));

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  guestName: text("guest_name"),
  userName: text("user_name"),
  userAvatarUrl: text("user_avatar_url"),
  text: text("text").notNull(),
  timestampSeconds: real("timestamp_seconds"),
  parentId: uuid("parent_id"),
  resolved: boolean("resolved").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_comments_video").on(table.videoId),
  index("idx_comments_parent").on(table.parentId),
]);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  video: one(videos, { fields: [comments.videoId], references: [videos.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "commentReplies" }),
  replies: many(comments, { relationName: "commentReplies" }),
}));

export const shareLinks = pgTable("share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdByName: text("created_by_name"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  allowDownload: boolean("allow_download").default(false),
  passwordHash: text("password_hash"),
  failedAccessAttempts: integer("failed_access_attempts").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  restrictedEmail: text("restricted_email"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_share_links_token").on(table.token),
  index("idx_share_links_video").on(table.videoId),
]);

export const shareLinksRelations = relations(shareLinks, ({ one, many }) => ({
  video: one(videos, { fields: [shareLinks.videoId], references: [videos.id] }),
  createdBy: one(users, { fields: [shareLinks.createdById], references: [users.id] }),
  accessGrants: many(shareAccessGrants),
}));

export const shareAccessGrants = pgTable("share_access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  shareLinkId: uuid("share_link_id").notNull().references(() => shareLinks.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_share_grants_token").on(table.token),
]);

export const shareAccessGrantsRelations = relations(shareAccessGrants, ({ one }) => ({
  shareLink: one(shareLinks, { fields: [shareAccessGrants.shareLinkId], references: [shareLinks.id] }),
}));

export const transcodeJobs = pgTable("transcode_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_transcode_jobs_status").on(table.status),
  index("idx_transcode_jobs_video").on(table.videoId),
]);

export const transcodeJobsRelations = relations(transcodeJobs, ({ one }) => ({
  video: one(videos, { fields: [transcodeJobs.videoId], references: [videos.id] }),
}));
