const S3_PUBLIC_URL = import.meta.env.VITE_S3_PUBLIC_URL ?? "";

export function buildHlsUrl(videoId: string): string {
  return `${S3_PUBLIC_URL}/hls/${videoId}/master.m3u8`;
}

export function buildThumbnailUrl(videoId: string): string {
  return `${S3_PUBLIC_URL}/thumb/${videoId}/thumb.jpg`;
}

const prefetchedIds = new Set<string>();
let hlsRuntimePrefetched = false;

export function prefetchHlsManifest(videoId: string) {
  if (typeof window === "undefined") return;
  if (prefetchedIds.has(videoId)) return;
  prefetchedIds.add(videoId);

  const url = buildHlsUrl(videoId);
  fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "force-cache",
  }).catch(() => {});
}

export function prefetchHlsRuntime() {
  if (typeof window === "undefined") return;
  if (hlsRuntimePrefetched) return;
  hlsRuntimePrefetched = true;

  import("hls.js").catch(() => {});
}
