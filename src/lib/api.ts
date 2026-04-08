const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

let getAccessToken: (() => Promise<string | undefined>) | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAccessTokenGetter(getter: () => Promise<string | undefined>) {
  getAccessToken = getter;
}

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

export function notifyAuthFailure() {
  onAuthFailure?.();
}

async function authHeaders(): Promise<Record<string, string>> {
  if (!getAccessToken) return {};
  const token = await getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  _retried?: boolean,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(await authHeaders()),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Retry once on 401 — the token may have expired during a long upload
  if (res.status === 401 && !_retried && getAccessToken) {
    return request<T>(method, path, body, true);
  }

  // Persistent 401 after retry — session is dead, trigger sign-out
  if (res.status === 401 && _retried && onAuthFailure) {
    onAuthFailure();
  }

  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      parsed = await res.text().catch(() => null);
    }
    throw new ApiError(res.status, parsed);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

function del<T = void>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

// ── Teams ──

export type Team = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
};

export type TeamWithProjects = Team & {
  projects: { id: string; name: string; videoCount: number }[];
};

export type TeamMember = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  role: string;
};

export type TeamInvite = {
  id: string;
  email: string;
  role: string;
  invitedByName?: string;
  expiresAt: string;
};

export const teams = {
  list: () => get<TeamWithProjects[]>("/teams"),
  get: (id: string) => get<Team>(`/teams/${id}`),
  create: (body: { name: string }) => post<{ teamId: string }>("/teams", body),
  update: (id: string, body: { name?: string }) => patch<Team>(`/teams/${id}`, body),
  delete: (id: string) => del(`/teams/${id}`),
  getMembers: (id: string) => get<TeamMember[]>(`/teams/${id}/members`),
  getInvites: (id: string) => get<TeamInvite[]>(`/teams/${id}/invites`),
  inviteMember: (id: string, body: { email: string; role: string }) =>
    post<{ token: string }>(`/teams/${id}/invites`, body),
  removeMember: (id: string, userId: string) =>
    del(`/teams/${id}/members/${userId}`),
  updateMemberRole: (id: string, userId: string, body: { role: string }) =>
    patch(`/teams/${id}/members/${userId}/role`, body),
  revokeInvite: (teamId: string, inviteId: string) =>
    del(`/teams/${teamId}/invites/${inviteId}`),
  acceptInvite: (token: string) =>
    post<{ id: string }>(`/teams/invites/${token}/accept`),
  getInviteByToken: (token: string) =>
    get<{
      id: string;
      teamName: string;
      email: string;
      role: string;
      invitedByName?: string;
      expiresAt: string;
    }>(`/teams/invites/${token}`),
  leave: (id: string) => post(`/teams/${id}/leave`),
};

// ── Projects ──

export type Project = {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  role?: string;
};

export const projects = {
  list: (teamId: string) => get<Project[]>(`/teams/${teamId}/projects`),
  get: (id: string) => get<Project>(`/projects/${id}`),
  create: (teamId: string, body: { name: string }) =>
    post<{ id: string }>(`/teams/${teamId}/projects`, body),
  update: (id: string, body: { name?: string; description?: string }) =>
    patch<Project>(`/projects/${id}`, body),
  remove: (id: string) => del(`/projects/${id}`),
  listUploadTargets: (teamId?: string) =>
    get<{ projectId: string; projectName: string; teamName: string }[]>(
      `/projects/upload-targets${teamId ? `?teamId=${teamId}` : ""}`,
    ),
};

// ── Videos ──

export type Video = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  visibility: "public" | "private";
  publicId: string;
  status: "uploading" | "processing" | "ready" | "failed";
  workflowStatus: "review" | "rework" | "done";
  s3Key?: string;
  s3HlsPrefix?: string;
  fileSize?: number;
  contentType?: string;
  duration?: number;
  thumbnailUrl?: string;
  uploaderName?: string;
  uploadError?: string;
  commentCount?: number;
  role?: string;
  createdAt: string;
};

export const videos = {
  list: (projectId: string) =>
    get<Video[]>(`/projects/${projectId}/videos`),
  get: (id: string) => get<Video>(`/videos/${id}`),
  getByPublicId: (publicId: string) =>
    get<Video>(`/videos/public/${publicId}`),
  create: (
    projectId: string,
    body: { title: string; fileSize: number; contentType: string },
  ) => post<{ id: string }>(`/projects/${projectId}/videos`, body),
  update: (id: string, body: { title?: string; description?: string }) =>
    patch<Video>(`/videos/${id}`, body),
  remove: (id: string) => del(`/videos/${id}`),
  setVisibility: (id: string, body: { visibility: "public" | "private" }) =>
    patch(`/videos/${id}/visibility`, body),
  updateWorkflowStatus: (
    id: string,
    body: { workflowStatus: "review" | "rework" | "done" },
  ) => patch(`/videos/${id}/workflow`, body),
  getUploadUrl: (
    id: string,
    body: { filename: string; fileSize: number; contentType: string },
  ) => post<{ url: string }>(`/videos/${id}/upload-url`, body),
  markUploadComplete: (id: string) =>
    post(`/videos/${id}/upload-complete`),
  markUploadFailed: (id: string) =>
    post(`/videos/${id}/upload-failed`),
  getPlaybackSession: (id: string) =>
    get<{ url: string; posterUrl?: string }>(`/videos/${id}/playback`),
  getDownloadUrl: (id: string) =>
    get<{ url: string; filename: string }>(`/videos/${id}/download`),
  getPublicPlaybackSession: (publicId: string) =>
    get<{ url: string; posterUrl?: string }>(
      `/videos/public/${publicId}/playback`,
    ),
  getPublicDownloadUrl: (publicId: string) =>
    get<{ url: string; filename: string }>(
      `/videos/public/${publicId}/download`,
    ),
  getPublicIdByVideoId: (videoId: string) =>
    get<{ publicId: string | null }>(`/videos/${videoId}/public-id`),
  initiateMultipartUpload: (
    id: string,
    body: { filename: string; fileSize: number; contentType: string },
  ) =>
    post<{
      uploadId: string;
      key: string;
      presignedUrls: Record<number, string>;
      chunkSize: number;
      totalParts: number;
    }>(`/videos/${id}/multipart/initiate`, body),
  presignParts: (
    id: string,
    body: { uploadId: string; key: string; partNumbers: number[] },
  ) => post<{ presignedUrls: Record<number, string> }>(`/videos/${id}/multipart/presign-parts`, body),
  completeMultipartUpload: (
    id: string,
    body: { uploadId: string; key: string; parts: { partNumber: number; etag: string }[] },
  ) => post<{ ok: boolean }>(`/videos/${id}/multipart/complete`, body),
  abortMultipartUpload: (
    id: string,
    body: { uploadId: string; key: string },
  ) => post<{ ok: boolean }>(`/videos/${id}/multipart/abort`, body),
};

// ── Comments ──

export type Comment = {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  text: string;
  timestampSeconds: number;
  parentId?: string;
  resolved: boolean;
  createdAt: string;
};

export type ThreadedComment = Comment & {
  replies: Comment[];
};

export const comments = {
  list: (videoId: string) =>
    get<Comment[]>(`/videos/${videoId}/comments`),
  getThreaded: (videoId: string) =>
    get<ThreadedComment[]>(`/videos/${videoId}/comments?threaded=true`),
  getThreadedForPublic: (publicId: string) =>
    get<ThreadedComment[]>(
      `/videos/public/${publicId}/comments?threaded=true`,
    ),
  create: (
    videoId: string,
    body: { text: string; timestampSeconds: number; parentId?: string },
  ) => post<Comment>(`/videos/${videoId}/comments`, body),
  createForPublic: (
    publicId: string,
    body: { text: string; timestampSeconds: number; parentId?: string },
  ) => post<Comment>(`/videos/public/${publicId}/comments`, body),
  update: (id: string, body: { text: string }) =>
    patch<Comment>(`/comments/${id}`, body),
  remove: (id: string) => del(`/comments/${id}`),
  toggleResolved: (id: string) =>
    post<Comment>(`/comments/${id}/resolve`),
};

// ── Share Links ──

export type ShareLink = {
  id: string;
  videoId: string;
  token: string;
  createdByName?: string;
  expiresAt?: string;
  isExpired?: boolean;
  hasPassword: boolean;
  restrictedEmail?: string | null;
  allowDownload: boolean;
  viewCount: number;
  createdAt: string;
};

export type ShareInfo = {
  status: "ok" | "requiresPassword" | "requiresEmail" | "expired" | "missing";
};

export const shareLinks = {
  list: (videoId: string) =>
    get<ShareLink[]>(`/videos/${videoId}/share-links`),
  create: (
    videoId: string,
    body: {
      expiresInDays?: number;
      password?: string;
      allowDownload?: boolean;
      email?: string;
    },
  ) => post<ShareLink>(`/videos/${videoId}/share-links`, body),
  remove: (id: string) => del(`/share-links/${id}`),
  update: (id: string, body: { allowDownload?: boolean; email?: string | null }) =>
    patch<ShareLink>(`/share-links/${id}`, body),
  getByToken: (token: string) => get<ShareInfo>(`/share/${token}`),
  issueAccessGrant: (token: string, body?: { password?: string }) =>
    post<{ ok: boolean; grantToken?: string; error?: string }>(
      `/share/${token}/access`,
      body,
    ),
  getSharedPlaybackSession: (token: string, grantToken: string) =>
    get<{ url: string; posterUrl?: string }>(
      `/share/${token}/playback?grant=${grantToken}`,
    ),
  getSharedDownloadUrl: (grantToken: string) =>
    get<{ url: string; filename: string }>(
      `/share/${grantToken}/download`,
    ),
  getSharedVideo: (token: string, grantToken: string) =>
    get<Video>(`/share/${token}/video?grant=${grantToken}`),
  getSharedComments: (token: string, grantToken: string) =>
    get<ThreadedComment[]>(
      `/share/${token}/comments?grant=${grantToken}&threaded=true`,
    ),
  createCommentForShareGrant: (
    shareToken: string,
    body: { grantToken: string; text: string; timestampSeconds: number; guestName?: string; parentId?: string },
  ) => post<Comment>(`/share/${shareToken}/comments`, body),
};

// ── Billing ──

export type TeamBilling = {
  plan: string;
  monthlyPriceRub: number;
  storageLimitBytes: number;
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  storageUsedBytes: number;
  currentPeriodEnd?: number | null;
  canceledAt?: number | null;
  yookassaCustomerId?: string;
  canManageBilling?: boolean;
  role?: string;
};

export const billing = {
  getTeamBilling: (teamId: string) =>
    get<TeamBilling>(`/teams/${teamId}/billing`),
  createSubscriptionCheckout: (
    teamId: string,
    body: { plan: string; successUrl: string; cancelUrl: string },
  ) => post<{ url: string }>(`/teams/${teamId}/billing/checkout`, body),
  cancelSubscription: (teamId: string) =>
    post<{ ok: boolean }>(`/teams/${teamId}/billing/cancel`),
  requestUpgrade: (teamId: string, body: { message: string }) =>
    post<{ ok: boolean }>(`/teams/${teamId}/billing/request-upgrade`, body),
};

// ── Workspace ──

export type WorkspaceContext = {
  team: Team;
  project?: Project;
  video?: Video;
  isCanonical: boolean;
  canonicalPath: string;
};

export const workspace = {
  resolveContext: (params: {
    teamId: string;
    projectId?: string;
    videoId?: string;
  }) => {
    const sp = new URLSearchParams();
    sp.set("teamId", params.teamId);
    if (params.projectId) sp.set("projectId", params.projectId);
    if (params.videoId) sp.set("videoId", params.videoId);
    return get<WorkspaceContext>(`/workspace/resolve?${sp.toString()}`);
  },
};

// ── Presence (REST fallback — primary channel is WebSocket) ──

export const presence = {
  heartbeat: (body: {
    videoId: string;
    sessionId: string;
    clientId: string;
    interval: number;
    shareToken?: string;
  }) => post<{ sessionToken: string; roomToken: string }>("/presence/heartbeat", body),
  disconnect: (body: { sessionToken: string }) =>
    post("/presence/disconnect", body),
};

// ── Users ──

export type PendingInvite = {
  token: string;
  teamName: string;
  invitedByName: string | null;
  role: string;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  canChangePassword: boolean;
};

const usersApi = {
  getProfile() {
    return get<UserProfile>("/users/me");
  },
  syncProfile(body: { name?: string; email?: string; avatarUrl?: string }) {
    return patch<{ ok: boolean }>("/users/me", body);
  },
  getAvatarUploadUrl(body: { contentType: string }) {
    return post<{ uploadUrl: string; avatarUrl: string }>("/users/me/avatar-upload-url", body);
  },
  changePassword(body: { password: string }) {
    return post<{ ok: boolean }>("/users/me/password", body);
  },
  getMyInvites() {
    return get<PendingInvite[]>("/users/me/invites");
  },
};

// ── Feedback ──

export const feedback = {
  submit: (body: { type: string; message: string }) =>
    post<{ ok: boolean }>("/feedback", body),
};

// Convenience re-export
const api = {
  teams,
  projects,
  videos,
  comments,
  shareLinks,
  billing,
  workspace,
  presence,
  users: usersApi,
  feedback,
};

export default api;
