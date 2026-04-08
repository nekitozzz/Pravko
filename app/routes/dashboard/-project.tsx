
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { DropZone } from "@/components/upload/DropZone";
import { UploadButton } from "@/components/upload/UploadButton";
import { Button } from "@/components/ui/button";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { triggerDownload } from "@/lib/download";
import {
  Play,
  MoreVertical,
  Trash2,
  Link as LinkIcon,
  Grid3X3,
  LayoutList,
  Download,
  MessageSquare,
  Eye,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { teamHomePath, teamSettingsPath, videoPath } from "@/lib/routes";
import { prefetchHlsRuntime, prefetchHlsManifest } from "@/lib/playback";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import {
  VideoWorkflowStatusControl,
  type VideoWorkflowStatus,
} from "@/components/videos/VideoWorkflowStatusControl";
import { useProjectData } from "./-project.data";
import { prewarmTeam } from "./-team.data";
import { prewarmVideo } from "./-video.data";
import { useDashboardUploadContext } from "@/lib/dashboardUploadContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useSubscription, useTranscodeProgress, type TranscodeProgress } from "@/lib/useSubscription";

function AnimatedDots() {
  return (
    <span className="inline-flex w-[1.5em]">
      <span className="animate-[dotPulse_1.4s_ease-in-out_infinite]">.</span>
      <span className="animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]">.</span>
      <span className="animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]">.</span>
    </span>
  );
}

function formatEta(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
}

function EtaLabel({ seconds }: { seconds: number | null }) {
  if (seconds == null) return null;
  return <span className="opacity-60"> · {formatEta(seconds)}</span>;
}

function FormatStageLabel({ progress }: { progress: TranscodeProgress }) {
  switch (progress.stage) {
    case "downloading":
      return <><Trans comment="Transcode stage: downloading from storage">Downloading</Trans><EtaLabel seconds={progress.etaSeconds} /><AnimatedDots /></>;
    case "transcoding":
      return <><Trans comment="Transcode stage: encoding video with percent">Transcoding {progress.percent}%</Trans><EtaLabel seconds={progress.etaSeconds} /><AnimatedDots /></>;
    case "uploading":
      return <><Trans comment="Transcode stage: uploading segments">Saving</Trans><EtaLabel seconds={progress.etaSeconds} /><AnimatedDots /></>;
    case "generating_thumbnail":
      return <><Trans comment="Transcode stage: generating thumbnail">Generating thumbnail</Trans><EtaLabel seconds={progress.etaSeconds} /><AnimatedDots /></>;
    default:
      return <>{progress.stage}<AnimatedDots /></>;
  }
}

function ProcessingOverlay({ videoId, textSize = "xs" }: { videoId: string; textSize?: "xs" | "10" }) {
  const progress = useTranscodeProgress(videoId);
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
      <span className={cn("text-white font-bold uppercase tracking-wider", textSize === "10" ? "text-[10px]" : "text-xs")}>
        {progress ? <FormatStageLabel progress={progress} /> : <Trans comment="Video status overlay while processing">Processing...</Trans>}
      </span>
      {progress && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div
            className="h-full bg-[#7cb87c] transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

type ViewMode = "grid" | "list";
type ShareToastState = {
  tone: "success" | "error";
  message: string;
};

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

type VideoIntentTargetProps = {
  className: string;
  teamId: string;
  projectId: string;
  videoId: string;
  onOpen: () => void;
  children: ReactNode;
};

function VideoIntentTarget({
  className,
  teamId,
  projectId,
  videoId,
  onOpen,
  children,
}: VideoIntentTargetProps) {
  const prewarmIntentHandlers = useRoutePrewarmIntent(() => {
    prewarmVideo({
      teamId,
      projectId,
      videoId,
    });
    prefetchHlsRuntime();
  });

  return (
    <div
      className={className}
      onClick={onOpen}
      {...prewarmIntentHandlers}
    >
      {children}
    </div>
  );
}

export default function ProjectPage({
  teamId,
  projectId,
}: {
  teamId: string;
  projectId: string;
}) {
  const navigate = useNavigate({});
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();

  const { context, resolvedProjectId, resolvedTeamId, project, videos, billing } =
    useProjectData({ teamId, projectId });

  // Real-time: subscribe to video list updates
  useSubscription(
    resolvedProjectId ? `videos:list:${resolvedProjectId}` : null,
    resolvedProjectId ? [["videos", resolvedProjectId]] : undefined,
  );

  const { requestUpload } = useDashboardUploadContext();

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: string) => api.videos.remove(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos", resolvedProjectId] });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: (args: { videoId: string; workflowStatus: VideoWorkflowStatus }) =>
      api.videos.updateWorkflowStatus(args.videoId, { workflowStatus: args.workflowStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos", resolvedProjectId] });
    },
  });

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [shareToast, setShareToast] = useState<ShareToastState | null>(null);
  const shareToastTimeoutRef = useRef<number | null>(null);

  const shouldCanonicalize =
    !!context && !context.isCanonical && pathname !== context.canonicalPath;
  const prewarmTeamIntentHandlers = useRoutePrewarmIntent(() =>
    prewarmTeam({ teamId: resolvedTeamId }),
  );

  useEffect(() => {
    if (shouldCanonicalize && context) {
      navigate({ to: context.canonicalPath, replace: true });
    }
  }, [shouldCanonicalize, context, navigate]);

  useEffect(
    () => () => {
      if (shareToastTimeoutRef.current !== null) {
        window.clearTimeout(shareToastTimeoutRef.current);
      }
    },
    [],
  );

  const isLoadingData =
    context === undefined ||
    project === undefined ||
    videos === undefined ||
    shouldCanonicalize;

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (!resolvedProjectId) return;
      requestUpload(files, resolvedProjectId);
    },
    [requestUpload, resolvedProjectId],
  );

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm(t({ message: "Are you sure you want to delete this video?", comment: "Confirmation dialog when deleting a video" }))) return;
    try {
      await deleteVideoMutation.mutateAsync(videoId);
    } catch (error) {
      console.error("Failed to delete video:", error);
    }
  };

  const handleDownloadVideo = useCallback(
    async (videoId: string, title: string) => {
      try {
        const result = await api.videos.getDownloadUrl(videoId);
        if (result?.url) {
          triggerDownload(result.url, result.filename ?? `${title}.mp4`);
        }
      } catch (error) {
        console.error("Failed to download video:", error);
      }
    },
    [],
  );

  const handleUpdateWorkflowStatus = useCallback(
    async (videoId: string, workflowStatus: VideoWorkflowStatus) => {
      try {
        await updateWorkflowMutation.mutateAsync({ videoId, workflowStatus });
      } catch (error) {
        console.error("Failed to update video workflow status:", error);
      }
    },
    [updateWorkflowMutation],
  );

  const showShareToast = useCallback((tone: ShareToastState["tone"], message: string) => {
    setShareToast({ tone, message });
    if (shareToastTimeoutRef.current !== null) {
      window.clearTimeout(shareToastTimeoutRef.current);
    }
    shareToastTimeoutRef.current = window.setTimeout(() => {
      setShareToast(null);
      shareToastTimeoutRef.current = null;
    }, 2400);
  }, []);

  const handleShareVideo = useCallback(
    async (video: {
      id: string;
      publicId?: string;
      status: string;
      visibility: "public" | "private";
    }) => {
      const canSharePublicly =
        Boolean(video.publicId) &&
        video.status === "ready" &&
        video.visibility === "public";
      const path = canSharePublicly
        ? `/watch/${video.publicId}`
        : videoPath(resolvedTeamId, projectId, video.id);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}${path}`;

      try {
        const copied = await copyTextToClipboard(url);
        if (!copied) {
          showShareToast("error", t({ message: "Could not copy link", comment: "Error toast when clipboard copy fails" }));
          return;
        }
        showShareToast(
          "success",
          canSharePublicly
            ? t({ message: "Share link copied", comment: "Success toast when public share link is copied" })
            : t({ message: "Video link copied (public watch link not available yet)", comment: "Success toast when private video link is copied" }),
        );
      } catch {
        showShareToast("error", t({ message: "Could not copy link", comment: "Error toast when clipboard copy fails" }));
      }
    },
    [projectId, resolvedTeamId, showShareToast],
  );

  if (context === null || project === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#888]"><Trans comment="Error message when project is not found">Project not found</Trans></div>
      </div>
    );
  }

  const hasActiveSubscription = billing?.hasActiveSubscription ?? true;
  const canEdit = project?.role !== "viewer";
  const canUpload = canEdit && hasActiveSubscription;

  return (
    <div className="h-full flex flex-col">
      <DashboardHeader paths={[
        {
          label: context?.team?.name ?? "team",
          href: teamHomePath(resolvedTeamId),
          prewarmIntentHandlers: prewarmTeamIntentHandlers,
        },
        { label: project?.name ?? "\u00A0" }
      ]}>
        <div className={cn(
          "flex items-center gap-2 transition-opacity duration-300 flex-shrink-0",
          isLoadingData ? "opacity-0" : "opacity-100"
        )}>
          <div className="flex items-center border-2 border-[#1a1a1a] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-[#1a1a1a] text-[#f0f0e8]"
                  : "text-[#888] hover:text-[#1a1a1a]",
              )}
              title={t({message: "Grid view", comment: "Tooltip for grid view toggle button"})}
              aria-label={t({message: "Grid view", comment: "Aria label for grid view toggle"})}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-[#1a1a1a] text-[#f0f0e8]"
                  : "text-[#888] hover:text-[#1a1a1a]",
              )}
              title={t({message: "List view", comment: "Tooltip for list view toggle button"})}
              aria-label={t({message: "List view", comment: "Aria label for list view toggle"})}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          {canEdit && (
            canUpload ? (
              <UploadButton onFilesSelected={handleFilesSelected} />
            ) : (
              <Button onClick={() => navigate({ to: teamSettingsPath(resolvedTeamId) })}>
                <Plus className="mr-1.5 h-4 w-4" />
                <Trans comment="Upload button label">Upload</Trans>
              </Button>
            )
          )}
        </div>
      </DashboardHeader>

      {!hasActiveSubscription && (
        <div className="mx-6 mt-4 border-2 border-[#1a1a1a] bg-[#f0f0e8] px-5 py-4 flex items-center justify-between shadow-[4px_4px_0px_0px_var(--shadow-color)]">
          <p className="text-sm font-black text-[#1a1a1a]">
            <Trans comment="Banner when subscription is inactive on project page">An active subscription is required to upload videos.</Trans>
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate({ to: teamSettingsPath(resolvedTeamId) })}
            className="shrink-0 ml-4"
          >
            <Trans comment="Link to billing settings from subscription banner">Manage billing</Trans>
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {!isLoadingData && videos && videos.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 animate-in fade-in duration-300">
            <DropZone
              onFilesSelected={handleFilesSelected}
              disabled={!canUpload}
              className="max-w-xl w-full"
            />
          </div>
        ) : viewMode === "grid" ? (
          <div className={cn(
            "p-6 transition-opacity duration-300",
            isLoadingData ? "opacity-0" : "opacity-100"
          )}>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {videos?.map((video) => {
                const thumbnailSrc = video.thumbnailUrl?.startsWith("http")
                  ? video.thumbnailUrl
                  : undefined;
                const canDownload = Boolean(video.s3Key) && video.status !== "failed" && video.status !== "uploading";

                return (
                  <VideoIntentTarget
                    key={video.id}
                    className="group cursor-pointer flex flex-col"
                    teamId={resolvedTeamId}
                    projectId={project!.id}
                    videoId={video.id}
                    onOpen={() =>
                      navigate({
                        to: videoPath(resolvedTeamId, project!.id, video.id),
                      })
                    }
                  >
                    <div className="relative aspect-video bg-[#e8e8e0] overflow-hidden border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all">
                      {thumbnailSrc ? (
                        <img
                          src={thumbnailSrc}
                          alt={video.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-10 w-10 text-[#888]" />
                        </div>
                      )}
                    {video.status === "ready" && video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-mono px-1.5 py-0.5">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {video.status === "processing" && (
                      <ProcessingOverlay videoId={video.id} />
                    )}
                    {video.status !== "ready" && video.status !== "processing" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">
                          {video.status === "uploading" && <Trans comment="Video status overlay while uploading">Uploading...</Trans>}
                          {video.status === "failed" && <Trans comment="Video status overlay when failed">Failed</Trans>}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center bg-black/60 hover:bg-black/80 text-white"
                            title={t({message: "More actions", comment: "Tooltip for video actions menu"})}
                            aria-label={t({message: "More actions", comment: "Aria label for video actions menu"})}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canDownload && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownloadVideo(video.id, video.title);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <Trans comment="Menu item to download original video file">Download original</Trans>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleShareVideo(video);
                            }}
                          >
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <Trans comment="Menu item to share a video">Share</Trans>
                          </DropdownMenuItem>
                          {canUpload && (
                            <DropdownMenuItem
                              className="text-[#dc2626] focus:text-[#dc2626]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(video.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <Trans comment="Menu item to delete a video">Delete</Trans>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <p className="text-[15px] text-[#1a1a1a] font-black truncate leading-tight">
                      {video.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <VideoWorkflowStatusControl
                        status={video.workflowStatus}
                        stopPropagation
                        disabled={!canUpload}
                        onChange={(workflowStatus) =>
                          void handleUpdateWorkflowStatus(video.id, workflowStatus)
                        }
                      />
                      {(video.commentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#888]">
                          <MessageSquare className="h-3 w-3" />
                          {video.commentCount}
                        </span>
                      )}
                      <span className="text-[11px] text-[#888] ml-auto font-mono">
                        {formatRelativeTime(new Date(video.createdAt).getTime())}
                      </span>
                    </div>
                  </div>
                  </VideoIntentTarget>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={cn(
            "divide-y-2 divide-[#1a1a1a] transition-opacity duration-300",
            isLoadingData ? "opacity-0" : "opacity-100"
          )}>
            {videos?.map((video) => {
              const thumbnailSrc = video.thumbnailUrl?.startsWith("http")
                ? video.thumbnailUrl
                : undefined;
              const canDownload = Boolean(video.s3Key) && video.status !== "failed" && video.status !== "uploading";

              return (
                <VideoIntentTarget
                  key={video.id}
                  className="group flex items-center gap-5 px-6 py-3 hover:bg-[#e8e8e0] cursor-pointer transition-colors"
                  teamId={resolvedTeamId}
                  projectId={project!.id}
                  videoId={video.id}
                  onOpen={() =>
                    navigate({
                      to: videoPath(resolvedTeamId, project!.id, video.id),
                    })
                  }
                >
                  <div className="relative w-44 aspect-video bg-[#e8e8e0] overflow-hidden border-2 border-[#1a1a1a] shrink-0 shadow-[4px_4px_0px_0px_var(--shadow-color)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all">
                    {thumbnailSrc ? (
                      <img
                        src={thumbnailSrc}
                        alt={video.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-6 w-6 text-[#888]" />
                      </div>
                    )}
                    {video.status === "processing" && (
                      <ProcessingOverlay videoId={video.id} textSize="10" />
                    )}
                    {video.status !== "ready" && video.status !== "processing" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                          {video.status === "uploading" && <Trans comment="Video status overlay while uploading">Uploading...</Trans>}
                          {video.status === "failed" && <Trans comment="Video status overlay when failed">Failed</Trans>}
                        </span>
                      </div>
                    )}
                    {video.status === "ready" && video.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-mono px-1 py-0.5">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                  </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#1a1a1a] truncate">
                    {video.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <VideoWorkflowStatusControl
                      status={video.workflowStatus}
                      stopPropagation
                      disabled={!canUpload}
                      onChange={(workflowStatus) =>
                        void handleUpdateWorkflowStatus(video.id, workflowStatus)
                      }
                    />
                    {(video.commentCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#888]">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {video.commentCount}
                      </span>
                    )}
                    <span className="text-xs text-[#888] font-mono">
                      {formatRelativeTime(new Date(video.createdAt).getTime())}
                    </span>
                    {video.uploaderName && (
                      <span className="text-xs text-[#888]">
                        {video.uploaderName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center text-[#888] hover:text-[#1a1a1a]"
                        title={t({message: "More actions", comment: "Tooltip for video actions menu"})}
                        aria-label={t({message: "More actions", comment: "Aria label for video actions menu"})}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canDownload && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDownloadVideo(video.id, video.title);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          <Trans comment="Menu item to download original video file">Download original</Trans>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleShareVideo(video);
                        }}
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        <Trans comment="Menu item to share a video">Share</Trans>
                      </DropdownMenuItem>
                      {canUpload && (
                        <DropdownMenuItem
                          className="text-[#dc2626] focus:text-[#dc2626]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <Trans comment="Menu item to delete a video">Delete</Trans>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                </VideoIntentTarget>
              );
            })}
          </div>
        )}
      </div>

      {shareToast ? (
        <div className="fixed right-4 top-4 z-50" aria-live="polite">
          <div
            className={cn(
              "border-2 px-3 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)]",
              shareToast.tone === "success"
                ? "border-[#1a1a1a] bg-[#f0f0e8] text-[#1a1a1a]"
                : "border-[#dc2626] bg-[#fef2f2] text-[#dc2626]",
            )}
          >
            {shareToast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
