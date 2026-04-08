import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useInviteData(params: { token: string }) {
  const invite = useQuery({
    queryKey: ["invite", params.token],
    queryFn: () => api.teams.getInviteByToken(params.token),
  });

  return { invite: invite.data };
}

export function prewarmInvite(params: { token: string }) {
  prewarmSpecs([
    makePrefetchSpec(
      ["invite", params.token],
      () => api.teams.getInviteByToken(params.token),
    ),
  ]);
}
