import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useSettingsData(params: { teamId: string }) {
  const context = useQuery({
    queryKey: ["workspace", params.teamId],
    queryFn: () => api.workspace.resolveContext({ teamId: params.teamId }),
  });
  const team = context.data?.team;

  const members = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => api.teams.getMembers(team!.id),
    enabled: !!team,
  });

  const billing = useQuery({
    queryKey: ["billing", team?.id],
    queryFn: () => api.billing.getTeamBilling(team!.id),
    enabled: !!team,
  });

  return {
    context: context.data === undefined ? undefined : context.data ?? null,
    team,
    members: members.data,
    billing: billing.data,
  };
}

export async function prewarmSettings(params: { teamId: string }) {
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
        ["members", context.team.id],
        () => api.teams.getMembers(context.team.id),
      ),
      makePrefetchSpec(
        ["billing", context.team.id],
        () => api.billing.getTeamBilling(context.team.id),
      ),
    ]);
  } catch (error) {
    console.warn("Settings dependent prewarm failed", error);
  }
}
