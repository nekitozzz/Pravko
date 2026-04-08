import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useShareData(params: {
  token: string;
  grantToken?: string | null;
}) {
  const shareInfo = useQuery({
    queryKey: ["share", params.token],
    queryFn: () => api.shareLinks.getByToken(params.token),
  });

  const video = useQuery({
    queryKey: ["share-video", params.token, params.grantToken],
    queryFn: () =>
      api.shareLinks.getSharedVideo(params.token, params.grantToken!),
    enabled: !!params.grantToken,
  });

  const comments = useQuery({
    queryKey: ["share-comments", params.token, params.grantToken],
    queryFn: () =>
      api.shareLinks.getSharedComments(params.token, params.grantToken!),
    enabled: !!params.grantToken,
  });

  return {
    shareInfo: shareInfo.data,
    video: video.data,
    comments: comments.data,
  };
}

export function useInvalidateShareComments(token: string, grantToken: string | null) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["share-comments", token, grantToken] });
  }, [queryClient, token, grantToken]);
}

export function prewarmShare(params: { token: string }) {
  prewarmSpecs([
    makePrefetchSpec(
      ["share", params.token],
      () => api.shareLinks.getByToken(params.token),
    ),
  ]);
}
