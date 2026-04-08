import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useTeamData(params: { teamId: string }) {
  const context = useQuery({
    queryKey: ["workspace", params.teamId],
    queryFn: () => api.workspace.resolveContext({ teamId: params.teamId }),
  });
  const team = context.data?.team;

  const projects = useQuery({
    queryKey: ["projects", team?.id],
    queryFn: () => api.projects.list(team!.id),
    enabled: !!team,
  });

  const billing = useQuery({
    queryKey: ["billing", team?.id],
    queryFn: () => api.billing.getTeamBilling(team!.id),
    enabled: !!team,
  });

  return {
    context: context.isError
      ? null
      : context.data === undefined
        ? undefined
        : context.data ?? null,
    team,
    projects: projects.data,
    billing: billing.data,
  };
}

export async function prewarmTeam(params: { teamId: string }) {
  prewarmSpecs([
    makePrefetchSpec(
      ["workspace", params.teamId],
      () => api.workspace.resolveContext({ teamId: params.teamId }),
    ),
  ]);

  try {
    const context = await api.workspace.resolveContext({
      teamId: params.teamId,
    });
    if (!context?.team?.id) return;

    prewarmSpecs([
      makePrefetchSpec(
        ["projects", context.team.id],
        () => api.projects.list(context.team.id),
      ),
      makePrefetchSpec(
        ["billing", context.team.id],
        () => api.billing.getTeamBilling(context.team.id),
      ),
    ]);
  } catch (error) {
    console.warn("Team dependent prewarm failed", error);
  }
}
