import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useProjectData(params: {
  teamId: string;
  projectId: string;
}) {
  const context = useQuery({
    queryKey: ["workspace", params.teamId, params.projectId],
    queryFn: () =>
      api.workspace.resolveContext({
        teamId: params.teamId,
        projectId: params.projectId,
      }),
  });

  const resolvedProjectId = context.data?.project?.id;
  const resolvedTeamId = context.data?.team?.id ?? params.teamId;

  const project = useQuery({
    queryKey: ["project", resolvedProjectId],
    queryFn: () => api.projects.get(resolvedProjectId!),
    enabled: !!resolvedProjectId,
  });

  const videos = useQuery({
    queryKey: ["videos", resolvedProjectId],
    queryFn: () => api.videos.list(resolvedProjectId!),
    enabled: !!resolvedProjectId,
  });

  const billing = useQuery({
    queryKey: ["billing", resolvedTeamId],
    queryFn: () => api.billing.getTeamBilling(resolvedTeamId),
    enabled: !!resolvedTeamId,
  });

  return {
    context: context.data === undefined ? undefined : context.data ?? null,
    resolvedProjectId,
    resolvedTeamId,
    project: project.data,
    videos: videos.data,
    billing: billing.data,
  };
}

export function prewarmProject(params: {
  teamId: string;
  projectId: string;
}) {
  prewarmSpecs([
    makePrefetchSpec(
      ["workspace", params.teamId, params.projectId],
      () =>
        api.workspace.resolveContext({
          teamId: params.teamId,
          projectId: params.projectId,
        }),
    ),
    makePrefetchSpec(
      ["project", params.projectId],
      () => api.projects.get(params.projectId),
    ),
    makePrefetchSpec(
      ["videos", params.projectId],
      () => api.videos.list(params.projectId),
    ),
  ]);
}
