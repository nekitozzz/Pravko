import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useVideoData(params: {
  teamId: string;
  projectId: string;
  videoId: string;
}) {
  const context = useQuery({
    queryKey: ["workspace", params.teamId, params.projectId, params.videoId],
    queryFn: () =>
      api.workspace.resolveContext({
        teamId: params.teamId,
        projectId: params.projectId,
        videoId: params.videoId,
      }),
  });

  const resolvedTeamId = context.data?.team?.id ?? params.teamId;
  const resolvedProjectId = context.data?.project?.id;
  const resolvedVideoId = context.data?.video?.id;

  const video = useQuery({
    queryKey: ["video", resolvedVideoId],
    queryFn: () => api.videos.get(resolvedVideoId!),
    enabled: !!resolvedVideoId,
  });

  const comments = useQuery({
    queryKey: ["comments", resolvedVideoId],
    queryFn: () => api.comments.list(resolvedVideoId!),
    enabled: !!resolvedVideoId,
  });

  const commentsThreaded = useQuery({
    queryKey: ["comments-threaded", resolvedVideoId],
    queryFn: () => api.comments.getThreaded(resolvedVideoId!),
    enabled: !!resolvedVideoId,
  });

  const billing = useQuery({
    queryKey: ["billing", resolvedTeamId],
    queryFn: () => api.billing.getTeamBilling(resolvedTeamId),
    enabled: !!resolvedTeamId,
  });

  return {
    context: context.data === undefined ? undefined : context.data ?? null,
    resolvedTeamId,
    resolvedProjectId,
    resolvedVideoId,
    video: video.data,
    comments: comments.data,
    commentsThreaded: commentsThreaded.data,
    billing: billing.data,
  };
}

export function prewarmVideo(params: {
  teamId: string;
  projectId: string;
  videoId: string;
}) {
  prewarmSpecs([
    makePrefetchSpec(
      ["workspace", params.teamId, params.projectId, params.videoId],
      () =>
        api.workspace.resolveContext({
          teamId: params.teamId,
          projectId: params.projectId,
          videoId: params.videoId,
        }),
    ),
    makePrefetchSpec(
      ["video", params.videoId],
      () => api.videos.get(params.videoId),
    ),
    makePrefetchSpec(
      ["comments", params.videoId],
      () => api.comments.list(params.videoId),
    ),
    makePrefetchSpec(
      ["comments-threaded", params.videoId],
      () => api.comments.getThreaded(params.videoId),
    ),
  ]);
}
