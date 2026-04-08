
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef, Component, type ReactNode } from "react";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/video-player/VideoPlayer";
import { CommentList } from "@/components/comments/CommentList";
import { CommentInput } from "@/components/comments/CommentInput";
import { ShareDialog } from "@/components/ShareDialog";
import { SubscriptionRequiredDialog } from "@/components/SubscriptionRequiredDialog";
import {
  VideoWorkflowStatusControl,
  type VideoWorkflowStatus,
} from "@/components/videos/VideoWorkflowStatusControl";
import { formatDuration } from "@/lib/utils";
import { useVideoPresence } from "@/lib/useVideoPresence";
import { VideoWatchers } from "@/components/presence/VideoWatchers";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  Edit2,
  Check,
  X,
  Link as LinkIcon,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api, { ApiError } from "@/lib/api";
import { projectPath, teamHomePath } from "@/lib/routes";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { prewarmProject } from "./-project.data";
import { prewarmTeam } from "./-team.data";
import { useVideoData } from "./-video.data";
import { useSubscription, useTranscodeProgress, type TranscodeProgress } from "@/lib/useSubscription";

class CommentsBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-sm text-[#888]"><Trans comment="Error in comments section">Comments unavailable</Trans></p>
            <button
              className="mt-2 text-xs text-[#2d5a2d] hover:underline"
              onClick={() => this.setState({ error: null })}
            ><Trans comment="Retry button in comment error boundary">Retry</Trans></button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatEtaVideo(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
}

export default function VideoPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate({});
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();
  const teamId = typeof params.teamId === "string" ? params.teamId : "";
  const projectId = params.projectId as string;
  const videoId = params.videoId as string;

  const {
    context,
    resolvedTeamId,
    resolvedProjectId,
    resolvedVideoId,
    video,
    comments,
    commentsThreaded,
    billing,
  } = useVideoData({
    teamId,
    projectId,
    videoId,
  });

  // Real-time subscriptions
  useSubscription(
    resolvedVideoId ? `video:${resolvedVideoId}` : null,
    resolvedVideoId ? [["video", resolvedVideoId]] : undefined,
  );
  useSubscription(
    resolvedVideoId ? `comments:${resolvedVideoId}` : null,
    resolvedVideoId
      ? [["comments", resolvedVideoId], ["comments-threaded", resolvedVideoId]]
      : undefined,
  );

  const updateVideoMutation = useMutation({
    mutationFn: (body: { title?: string; description?: string }) =>
      api.videos.update(resolvedVideoId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", resolvedVideoId] });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: (workflowStatus: VideoWorkflowStatus) =>
      api.videos.updateWorkflowStatus(resolvedVideoId!, { workflowStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", resolvedVideoId] });
    },
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | undefined>();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const hasActiveSubscription = billing?.hasActiveSubscription !== false;
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  const [playbackSession, setPlaybackSession] = useState<{
    url: string;
    posterUrl?: string;
  } | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const playerRef = useRef<VideoPlayerHandle | null>(null);

  const transcodeProgress = useTranscodeProgress(resolvedVideoId ?? "");
  const isPlayable = video?.status === "ready" && Boolean(video?.s3HlsPrefix);
  const activePlaybackUrl = playbackSession?.url ?? null;

  const shouldCanonicalize =
    !!context && !context.isCanonical && pathname !== context.canonicalPath;
  const prewarmTeamIntentHandlers = useRoutePrewarmIntent(() =>
    prewarmTeam({ teamId: resolvedTeamId }),
  );
  const prewarmProjectIntentHandlers = useRoutePrewarmIntent(() => {
    if (!resolvedProjectId) return;
    return prewarmProject({
      teamId: resolvedTeamId,
      projectId: resolvedProjectId,
    });
  });
  const { watchers } = useVideoPresence({
    videoId: resolvedVideoId,
    enabled: Boolean(resolvedVideoId),
  });

  useEffect(() => {
    if (shouldCanonicalize && context) {
      navigate({ to: context.canonicalPath, replace: true });
    }
  }, [shouldCanonicalize, context, navigate]);

  useEffect(() => {
    if (!resolvedVideoId || !isPlayable) {
      setPlaybackSession(null);
      setIsLoadingPlayback(false);
      return;
    }

    let cancelled = false;
    setIsLoadingPlayback(true);

    void api.videos
      .getPlaybackSession(resolvedVideoId)
      .then((session) => {
        if (cancelled) return;
        setPlaybackSession(session);
      })
      .catch(() => {
        if (cancelled) return;
        setPlaybackSession(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingPlayback(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPlayable, resolvedVideoId, video?.s3HlsPrefix]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleMarkerClick = useCallback((comment: { id: string }) => {
    const id = comment.id;
    setHighlightedCommentId(id);
    setTimeout(() => setHighlightedCommentId(undefined), 3000);
  }, []);

  const requestDownload = useCallback(async () => {
    if (!video || video.status !== "ready" || !resolvedVideoId) return null;
    try {
      return await api.videos.getDownloadUrl(resolvedVideoId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        setSubscriptionDialogOpen(true);
      } else {
        console.error("Failed to prepare download:", error);
      }
      return null;
    }
  }, [video, resolvedVideoId]);

  const handleTimestampClick = useCallback(
    (time: number) => {
      playerRef.current?.seekTo(time);
      setHighlightedCommentId(undefined);
    },
    [playerRef, setHighlightedCommentId]
  );

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || !video || !resolvedVideoId) return;
    try {
      await updateVideoMutation.mutateAsync({ title: editedTitle.trim() });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  const handleUpdateWorkflowStatus = useCallback(
    async (workflowStatus: VideoWorkflowStatus) => {
      if (!resolvedVideoId) return;
      try {
        await updateWorkflowMutation.mutateAsync(workflowStatus);
      } catch (error) {
        console.error("Failed to update review status:", error);
      }
    },
    [resolvedVideoId, updateWorkflowMutation],
  );

  const startEditingTitle = () => {
    if (video) {
      setEditedTitle(video.title);
      setIsEditingTitle(true);
    }
  };

  if (context === undefined || video === undefined || shouldCanonicalize) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#888]"><Trans comment="Loading state for video page">Loading...</Trans></div>
      </div>
    );
  }

  if (context === null || video === null || !resolvedProjectId || !resolvedVideoId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#888]"><Trans comment="Video not found error">Video not found</Trans></div>
      </div>
    );
  }

  const canEdit = video.role !== "viewer";
  const canComment = true;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <DashboardHeader paths={[
        {
          label: context?.team?.name ?? "team",
          href: teamHomePath(resolvedTeamId),
          prewarmIntentHandlers: prewarmTeamIntentHandlers,
        },
        {
          label: context?.project?.name ?? "project",
          href: projectPath(resolvedTeamId, resolvedProjectId),
          prewarmIntentHandlers: prewarmProjectIntentHandlers,
        },
        {
          label: isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-40 sm:w-64 h-8 text-base font-black tracking-tighter uppercase font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleSaveTitle}
                title={t({message: "Save title", comment: "Tooltip for save title button"})}
                aria-label={t({message: "Save title", comment: "Aria label for save title button"})}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsEditingTitle(false)}
                title={t({message: "Cancel editing", comment: "Tooltip for cancel edit button"})}
                aria-label={t({message: "Cancel editing", comment: "Aria label for cancel edit button"})}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[150px] sm:max-w-[300px]">{video.title}</span>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={startEditingTitle}
                  title={t({message: "Edit title", comment: "Tooltip for edit video title button"})}
                  aria-label={t({message: "Edit title", comment: "Aria label for edit video title button"})}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
              {video.status !== "ready" && (
                <Badge
                  variant={video.status === "failed" ? "destructive" : "secondary"}
                >
                  {video.status === "uploading" && <Trans comment="Video uploading status badge">Uploading</Trans>}
                  {video.status === "processing" && <Trans comment="Video processing status badge">Processing</Trans>}
                  {video.status === "failed" && <Trans comment="Video failed status badge">Failed</Trans>}
                </Badge>
              )}
            </div>
          )
        }
      ]}>
        {/* Desktop: inline actions */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-[#888]">
          <span className="truncate max-w-[100px]">{video.uploaderName}</span>
          {video.duration && (
            <>
              <span className="text-[#ccc]">·</span>
              <span className="font-mono">{formatDuration(video.duration)}</span>
            </>
          )}
          <VideoWatchers watchers={watchers} />
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0 border-l-2 border-[#1a1a1a]/20 pl-3 ml-1">
          <VideoWorkflowStatusControl
            status={video.workflowStatus}
            size="lg"
            disabled={!canEdit}
            onChange={(workflowStatus) => {
              void handleUpdateWorkflowStatus(workflowStatus);
            }}
          />
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <LinkIcon className="mr-1.5 h-4 w-4" />
            <Trans comment="Share video button">Share</Trans>
          </Button>
          <Button
            variant="outline"
            className="lg:hidden"
            onClick={() => setMobileCommentsOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            {comments && comments.length > 0 && (
              <span className="ml-1 text-xs">{comments.length}</span>
            )}
          </Button>
        </div>

        {/* Mobile: workflow status + menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <VideoWorkflowStatusControl
            status={video.workflowStatus}
            size="lg"
            disabled={!canEdit}
            onChange={(workflowStatus) => {
              void handleUpdateWorkflowStatus(workflowStatus);
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title={t({message: "More actions", comment: "Tooltip for video actions menu"})}
                aria-label={t({message: "More actions", comment: "Aria label for video actions menu"})}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setShareDialogOpen(true)}>
              <LinkIcon className="mr-2 h-4 w-4" />
              <Trans comment="Share video menu item">Share</Trans>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setMobileCommentsOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <Trans comment="Comments menu item with optional count">Comments{comments && comments.length > 0 ? ` (${comments.length})` : ""}</Trans>
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DashboardHeader>

      {/* Subscription expiry banner */}
      {billing?.canceledAt && billing?.currentPeriodEnd && (
        <div className="bg-[#fbbf24]/15 border-b-2 border-[#fbbf24]/30 px-5 py-2 text-xs text-[#92400e]">
          <Trans comment="Banner showing subscription expiry date">
            Subscription expires {new Date(billing.currentPeriodEnd * 1000).toLocaleDateString()}
          </Trans>
        </div>
      )}

      {/* Main content - horizontal split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video player area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
          {activePlaybackUrl ? (
            <VideoPlayer
              ref={playerRef}
              src={activePlaybackUrl}
              poster={playbackSession?.posterUrl}
              comments={comments || []}
              onTimeUpdate={handleTimeUpdate}
              onMarkerClick={handleMarkerClick}
              allowDownload={video.status === "ready"}
              downloadFilename={`${video.title}.mp4`}
              onRequestDownload={requestDownload}
              controlsBelow
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {video.status === "ready" && !activePlaybackUrl ? (
                <div className="flex flex-col items-center gap-3 text-white">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                  <p className="text-sm font-medium text-white/85">
                    {isLoadingPlayback ? <Trans comment="Loading video stream">Loading stream...</Trans> : <Trans comment="Preparing video stream">Preparing stream...</Trans>}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  {video.status === "uploading" && (
                    <p className="text-white/60"><Trans comment="Video upload in progress">Uploading...</Trans></p>
                  )}
                  {video.status === "processing" && (
                    <div className="text-white/60">
                      {transcodeProgress ? (
                        <>
                          <p className="text-sm font-bold">
                            {transcodeProgress.stage === "downloading" && <><Trans comment="Transcode stage: downloading from storage">Downloading</Trans>{transcodeProgress.etaSeconds != null && <span className="text-white/40"> · {formatEtaVideo(transcodeProgress.etaSeconds)}</span>}<span className="inline-flex w-[1.5em]"><span className="animate-[dotPulse_1.4s_ease-in-out_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]">.</span></span></>}
                            {transcodeProgress.stage === "transcoding" && <><Trans comment="Transcode stage: encoding video with percent">Transcoding {transcodeProgress.percent}%</Trans>{transcodeProgress.etaSeconds != null && <span className="text-white/40"> · {formatEtaVideo(transcodeProgress.etaSeconds)}</span>}<span className="inline-flex w-[1.5em]"><span className="animate-[dotPulse_1.4s_ease-in-out_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]">.</span></span></>}
                            {transcodeProgress.stage === "uploading" && <><Trans comment="Transcode stage: uploading segments">Saving</Trans>{transcodeProgress.etaSeconds != null && <span className="text-white/40"> · {formatEtaVideo(transcodeProgress.etaSeconds)}</span>}<span className="inline-flex w-[1.5em]"><span className="animate-[dotPulse_1.4s_ease-in-out_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]">.</span></span></>}
                            {transcodeProgress.stage === "generating_thumbnail" && <><Trans comment="Transcode stage: generating thumbnail">Generating thumbnail</Trans><span className="inline-flex w-[1.5em]"><span className="animate-[dotPulse_1.4s_ease-in-out_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]">.</span><span className="animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]">.</span></span></>}
                          </p>
                          {transcodeProgress.stage === "transcoding" && (
                            <div className="mt-3 w-48 mx-auto h-1 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#7cb87c] transition-all duration-500 ease-out"
                                style={{ width: `${transcodeProgress.percent}%` }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <p><Trans comment="Video is being processed">Processing video...</Trans></p>
                      )}
                    </div>
                  )}
                  {video.status === "failed" && (
                    <p className="text-[#dc2626]"><Trans comment="Video processing failure">Processing failed</Trans></p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments sidebar — desktop */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-l-2 border-[#1a1a1a] flex-col bg-[#f0f0e8]">
          <CommentsBoundary>
            <div className="flex-shrink-0 px-5 py-4 border-b border-[#1a1a1a]/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-sm tracking-tight flex items-center gap-2 text-[#1a1a1a] dark:text-[#f0f0e8]">
                <Trans comment="Heading for video comment sidebar">Discussion</Trans>
              </h2>
              {comments && comments.length > 0 && (
                <span className="text-[11px] font-medium text-[#888] bg-[#1a1a1a]/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  <Plural value={comments.length} one="# comment" other="# comments" comment="Comment count label" />
                </span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <CommentList
                videoId={resolvedVideoId}
                comments={commentsThreaded}
                onTimestampClick={handleTimestampClick}
                highlightedCommentId={highlightedCommentId}
                canResolve={canEdit}
                subscriptionActive={hasActiveSubscription}
                onSubscriptionRequired={() => setSubscriptionDialogOpen(true)}
              />
            </div>
            {canComment && (
              <div className="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8]">
                <CommentInput
                  videoId={resolvedVideoId}
                  timestampSeconds={currentTime}
                  showTimestamp
                  variant="seamless"
                  disabled={!hasActiveSubscription}
                  onDisabledClick={() => setSubscriptionDialogOpen(true)}
                />
              </div>
            )}
          </CommentsBoundary>
        </aside>
      </div>

      {/* Comments overlay — mobile */}
      {mobileCommentsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-[#f0f0e8]">
          <div className="flex-shrink-0 px-5 py-4 border-b-2 border-[#1a1a1a] flex items-center justify-between">
            <h2 className="font-semibold text-sm tracking-tight flex items-center gap-2 text-[#1a1a1a]">
              <Trans comment="Heading for video comment sidebar">Discussion</Trans>
              {comments && comments.length > 0 && (
                <span className="text-[11px] font-medium text-[#888] bg-[#1a1a1a]/5 px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileCommentsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CommentsBoundary>
            <div className="flex-1 overflow-hidden">
              <CommentList
                videoId={resolvedVideoId}
                comments={commentsThreaded}
                onTimestampClick={(time) => {
                  handleTimestampClick(time);
                  setMobileCommentsOpen(false);
                }}
                highlightedCommentId={highlightedCommentId}
                canResolve={canEdit}
                subscriptionActive={hasActiveSubscription}
                onSubscriptionRequired={() => setSubscriptionDialogOpen(true)}
              />
            </div>
            {canComment && (
              <div className="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8]">
                <CommentInput
                  videoId={resolvedVideoId}
                  timestampSeconds={currentTime}
                  showTimestamp
                  variant="seamless"
                  disabled={!hasActiveSubscription}
                  onDisabledClick={() => setSubscriptionDialogOpen(true)}
                />
              </div>
            )}
          </CommentsBoundary>
        </div>
      )}

      <ShareDialog
        videoId={resolvedVideoId}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />

      <SubscriptionRequiredDialog
        teamId={resolvedTeamId}
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        currentPeriodEnd={billing?.currentPeriodEnd}
      />
    </div>
  );
}
