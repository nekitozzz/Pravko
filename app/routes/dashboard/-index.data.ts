import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useDashboardIndexData() {
  const teams = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.teams.list(),
  });
  const pendingInvites = useQuery({
    queryKey: ["myInvites"],
    queryFn: () => api.users.getMyInvites(),
  });
  return { teams: teams.data, pendingInvites: pendingInvites.data };
}

export function prewarmDashboardIndex() {
  prewarmSpecs([
    makePrefetchSpec(["teams"], () => api.teams.list()),
    makePrefetchSpec(["myInvites"], () => api.users.getMyInvites()),
  ]);
}
