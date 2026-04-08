
import { useLogto } from "@logto/react";
import { useQuery } from "@tanstack/react-query";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { setAccessTokenGetter, setAuthFailureHandler } from "@/lib/api";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "@/components/FeedbackDialog";

import {
  Outlet,
  useLocation,
  useParams,
} from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { useVideoUploadManager } from "./-useVideoUploadManager";
import { DashboardUploadProvider } from "@/lib/dashboardUploadContext";

const VIDEO_FILE_EXTENSIONS = /\.(mp4|mov|m4v|webm|avi|mkv)$/i;

function isVideoFile(file: File) {
  return file.type.startsWith("video/") || VIDEO_FILE_EXTENSIONS.test(file.name);
}

function getVideoFiles(files: FileList | null) {
  if (!files) return [];
  return Array.from(files).filter(isVideoFile);
}

function dragEventHasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, getAccessToken, getIdTokenClaims, signOut } = useLogto();
  // Track only the initial auth check — ignore subsequent isLoading toggles from getAccessToken()
  const [initialAuthResolved, setInitialAuthResolved] = useState(false);
  useEffect(() => {
    if (!isLoading && !initialAuthResolved) {
      setInitialAuthResolved(true);
    }
  }, [isLoading, initialAuthResolved]);
  const authLoading = !initialAuthResolved;
  const location = useLocation();
  const { pathname, searchStr } = location;
  const params = useParams({ strict: false });
  const teamId =
    typeof params.teamId === "string" ? params.teamId : undefined;
  const routeProjectId =
    typeof params.projectId === "string" ? params.projectId : undefined;
  const routeVideoId =
    typeof params.videoId === "string" ? params.videoId : undefined;

  // Wire up the API client's token getter using a ref to avoid re-render loops
  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  useEffect(() => {
    const resource = import.meta.env.VITE_API_URL ?? window.location.origin + "/api";
    let signingOut = false;
    const doSignOut = () => {
      if (signingOut) return;
      signingOut = true;
      console.warn("[auth] Session expired, signing out");
      signOutRef.current(window.location.origin).catch(() => {
        // If signOut itself fails (dead session), redirect manually
        window.location.replace("/sign-in");
      });
    };
    setAccessTokenGetter(async () => {
      try {
        return await getAccessTokenRef.current(resource);
      } catch (err) {
        const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));
        if (serialized.includes("invalid_grant")) {
          doSignOut();
        }
        return undefined;
      }
    });
    setAuthFailureHandler(doSignOut);
  }, []);

  // Sync Logto profile claims → backend DB (once per session)
  const profileSyncedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || profileSyncedRef.current) return;
    profileSyncedRef.current = true;
    getIdTokenClaims().then((claims) => {
      if (!claims) return;
      const { name, email, picture } = claims as { name?: string; email?: string; picture?: string };
      if (name || email || picture) {
        api.users.syncProfile({ name, email, avatarUrl: picture }).catch(() => {});
      }
    }).catch(() => {});
  }, [isAuthenticated, getIdTokenClaims]);

  const publicPlaybackId = useQuery({
    queryKey: ["video-public-id", routeVideoId],
    queryFn: () => api.videos.getPublicIdByVideoId(routeVideoId!),
    enabled: !!routeVideoId && !isAuthenticated && !authLoading,
  });

  const uploadTargets = useQuery({
    queryKey: ["upload-targets", teamId],
    queryFn: () => api.projects.listUploadTargets(teamId),
    enabled: isAuthenticated,
  });

  const {
    uploads,
    uploadFilesToProject,
    cancelUpload,
    dismissUpload,
    retryUpload,
  } = useVideoUploadManager();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isGlobalDragActive, setIsGlobalDragActive] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const dragDepthRef = useRef(0);
  const uploadableProjectIds = useMemo(
    () => new Set((uploadTargets.data ?? []).map((target) => target.projectId)),
    [uploadTargets.data],
  );
  const canUploadToCurrentProject = routeProjectId
    ? uploadableProjectIds.has(routeProjectId)
    : false;

  const requestUpload = useCallback(
    (inputFiles: File[], preferredProjectId?: string) => {
      const files = inputFiles.filter(isVideoFile);
      if (files.length === 0) return;

      if (preferredProjectId) {
        void uploadFilesToProject(preferredProjectId, files);
        return;
      }

      if (
        routeProjectId &&
        (canUploadToCurrentProject || uploadTargets.data === undefined)
      ) {
        void uploadFilesToProject(routeProjectId, files);
        return;
      }

      if (uploadTargets.data && uploadTargets.data.length === 0) {
        window.alert(t({message: "You do not have upload access to any projects.", comment: "Alert when user has no upload permissions"}));
        return;
      }

      setPendingFiles(files);
      setProjectPickerOpen(true);
    },
    [
      canUploadToCurrentProject,
      routeProjectId,
      uploadFilesToProject,
      uploadTargets.data,
    ],
  );

  const handleProjectSelected = useCallback(
    (projectId: string) => {
      const files = pendingFiles;
      if (!files || files.length === 0) return;

      setProjectPickerOpen(false);
      setPendingFiles(null);
      void uploadFilesToProject(projectId, files);
    },
    [pendingFiles, uploadFilesToProject],
  );

  const handleProjectPickerOpenChange = useCallback((open: boolean) => {
    setProjectPickerOpen(open);
    if (!open) {
      setPendingFiles(null);
    }
  }, []);

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      if (!dragEventHasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsGlobalDragActive(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!dragEventHasFiles(event)) return;
      event.preventDefault();
      setIsGlobalDragActive(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!dragEventHasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsGlobalDragActive(false);
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (!dragEventHasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsGlobalDragActive(false);

      const files = getVideoFiles(event.dataTransfer?.files ?? null);
      if (files.length === 0) return;
      requestUpload(files);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [requestUpload]);

  const uploadContext = useMemo(
    () => ({
      requestUpload,
      uploads,
      cancelUpload,
    }),
    [requestUpload, uploads, cancelUpload],
  );

  const isResolvingPublicPlaybackExemption =
    Boolean(!authLoading && !isAuthenticated && routeVideoId) && publicPlaybackId.data === undefined;

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    if (typeof window === "undefined") return;

    if (routeVideoId) {
      if (publicPlaybackId.data === undefined) return;
      if (publicPlaybackId.data?.publicId) {
        window.location.replace(`/watch/${publicPlaybackId.data.publicId}`);
        return;
      }
    }

    const redirectUrl = `${pathname}${searchStr}`;
    window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
  }, [authLoading, isAuthenticated, pathname, searchStr, routeVideoId, publicPlaybackId.data]);

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0e8]">
        <div className="text-[#888]"><Trans comment="Dashboard loading state">Loading...</Trans></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0e8]">
        <div className="text-[#888]">
          {isResolvingPublicPlaybackExemption
            ? <Trans comment="Status while checking if video has public playback">Checking public playback access...</Trans>
            : <Trans comment="Status while redirecting user to sign in">Redirecting to sign in...</Trans>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full flex flex-col bg-[#f0f0e8]")}>
      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <DashboardUploadProvider value={uploadContext}>
          <Outlet />
        </DashboardUploadProvider>
      </main>

      {isGlobalDragActive && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div className="absolute inset-0 bg-[#1a1a1a]/20" />
          <div className="absolute inset-4 border-4 border-dashed border-[#2d5a2d] bg-[#2d5a2d]/10 flex items-center justify-center">
            <p className="border-2 border-[#1a1a1a] bg-[#f0f0e8] px-4 py-2 text-sm font-bold text-[#1a1a1a]">
              <Trans comment="Drag overlay text when dragging files over dashboard">Drop videos to upload</Trans>
            </p>
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="fixed left-4 right-4 top-16 z-50 space-y-2 sm:bottom-4 sm:top-auto sm:right-auto sm:w-full sm:max-w-sm">
          {uploads.map((upload) => (
            <UploadProgress
              key={upload.id}
              fileName={upload.file.name}
              fileSize={upload.file.size}
              progress={upload.progress}
              status={upload.status}
              error={upload.error}
              bytesPerSecond={upload.bytesPerSecond}
              estimatedSecondsRemaining={upload.estimatedSecondsRemaining}
              onCancel={() => cancelUpload(upload.id)}
              onDismiss={() => dismissUpload(upload.id)}
              onRetry={() => retryUpload(upload.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] text-[#1a1a1a] hover:bg-[#2d5a2d] hover:text-white transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_var(--shadow-color)] cursor-pointer"
        title={t({message: "Report an issue", comment: "Feedback button tooltip"})}
        aria-label={t({message: "Report an issue", comment: "Feedback button aria-label"})}
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      <Dialog open={projectPickerOpen} onOpenChange={handleProjectPickerOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><Trans comment="Dialog title for selecting upload target project">Choose a project</Trans></DialogTitle>
            <DialogDescription>
              {pendingFiles?.length ? <Plural value={pendingFiles.length} one="Upload # video to:" other="Upload # videos to:" comment="Upload project picker dialog description" /> : <Trans comment="Default project picker description">Pick a project to start uploading.</Trans>}
            </DialogDescription>
          </DialogHeader>
          {uploadTargets.data === undefined ? (
            <p className="text-sm text-[#888]"><Trans comment="Loading indicator for projects list">Loading projects...</Trans></p>
          ) : uploadTargets.data.length === 0 ? (
            <p className="text-sm text-[#888]">
              <Trans comment="Empty state in project picker when no projects available">No uploadable projects found for your account.</Trans>
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto border-2 border-[#1a1a1a] divide-y-2 divide-[#1a1a1a]">
              {uploadTargets.data.map((target) => (
                <button
                  key={target.projectId}
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-[#e8e8e0] transition-colors"
                  onClick={() => handleProjectSelected(target.projectId)}
                >
                  <p className="font-bold text-[#1a1a1a]">{target.projectName}</p>
                  <p className="text-xs text-[#888]">{target.teamName}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
