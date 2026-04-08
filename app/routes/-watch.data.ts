import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { makePrefetchSpec, prewarmSpecs } from "@/lib/convexRouteData";

export function useWatchData(params: { publicId: string }) {
  const video = useQuery({
    queryKey: ["video-public", params.publicId],
    queryFn: () => api.videos.getByPublicId(params.publicId),
  });

  const comments = useQuery({
    queryKey: ["comments-public", params.publicId],
    queryFn: () => api.comments.getThreadedForPublic(params.publicId),
  });

  return { video: video.data, comments: comments.data };
}

export function prewarmWatch(params: { publicId: string }) {
  prewarmSpecs([
    makePrefetchSpec(
      ["video-public", params.publicId],
      () => api.videos.getByPublicId(params.publicId),
    ),
    makePrefetchSpec(
      ["comments-public", params.publicId],
      () => api.comments.getThreadedForPublic(params.publicId),
    ),
  ]);
}
