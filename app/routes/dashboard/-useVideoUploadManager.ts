import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UploadStatus } from "@/components/upload/UploadProgress";

const EXTENSION_MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
};

function guessContentType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_MAP[ext] ?? "video/mp4";
}

export interface ManagedUploadItem {
  id: string;
  projectId: string;
  file: File;
  videoId?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  bytesPerSecond?: number;
  estimatedSecondsRemaining?: number | null;
  abortController?: AbortController;
}

function createUploadId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

// ── Upload Constants ──

const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MiB
const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MiB
const MAX_CONCURRENT_PARTS = 3;
const MAX_PART_RETRIES = 3;
const MAX_PUT_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

// ── Multipart Upload Helpers ──

function uploadSinglePart(
  url: string,
  blob: Blob,
  partNumber: number,
  signal: AbortSignal,
  onProgress: (partNumber: number, loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(partNumber, event.loaded);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(new Error(`Part ${partNumber}: no ETag in response`));
          return;
        }
        resolve(etag);
        return;
      }
      reject(new Error(`Part ${partNumber} failed: ${xhr.status} ${xhr.statusText}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error(`Part ${partNumber}: network error`));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    signal.addEventListener("abort", () => {
      xhr.abort();
    });

    xhr.open("PUT", url);
    xhr.send(blob);
  });
}

async function uploadPartWithRetry(
  url: string,
  blob: Blob,
  partNumber: number,
  signal: AbortSignal,
  onProgress: (partNumber: number, loaded: number) => void,
  getRefreshedUrl?: () => Promise<string>,
): Promise<string> {
  let lastError: Error | undefined;
  let currentUrl = url;

  for (let attempt = 0; attempt < MAX_PART_RETRIES; attempt++) {
    if (signal.aborted) throw new Error("Upload cancelled");

    try {
      return await uploadSinglePart(currentUrl, blob, partNumber, signal, onProgress);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.message === "Upload cancelled") throw lastError;

      if (attempt < MAX_PART_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        if (getRefreshedUrl) {
          try {
            currentUrl = await getRefreshedUrl();
          } catch {
            // Use the old URL if refresh fails
          }
        }
      }
    }
  }

  throw lastError ?? new Error(`Part ${partNumber} failed after ${MAX_PART_RETRIES} retries`);
}

function simplePutUpload(
  url: string,
  file: File,
  contentType: string,
  signal: AbortSignal,
  onProgress: (percentage: number, bytesPerSecond: number, eta: number | null) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastTime = Date.now();
    let lastLoaded = 0;
    const recentSpeeds: number[] = [];

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;

      const percentage = Math.round((event.loaded / event.total) * 100);
      const now = Date.now();
      const timeDelta = (now - lastTime) / 1000;
      const bytesDelta = event.loaded - lastLoaded;

      if (timeDelta > 0.1) {
        const speed = bytesDelta / timeDelta;
        recentSpeeds.push(speed);
        if (recentSpeeds.length > 5) recentSpeeds.shift();
        lastTime = now;
        lastLoaded = event.loaded;
      }

      const avgSpeed =
        recentSpeeds.length > 0
          ? recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length
          : 0;
      const remaining = event.total - event.loaded;
      const eta = avgSpeed > 0 ? Math.ceil(remaining / avgSpeed) : null;

      onProgress(percentage, avgSpeed, eta);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed: Network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    signal.addEventListener("abort", () => {
      xhr.abort();
    });

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

async function simplePutWithRetry(
  videoId: string,
  file: File,
  signal: AbortSignal,
  onProgress: (percentage: number, bytesPerSecond: number, eta: number | null) => void,
): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_PUT_RETRIES; attempt++) {
    if (signal.aborted) throw new Error("Upload cancelled");

    try {
      const { url } = await api.videos.getUploadUrl(videoId, {
        filename: file.name,
        fileSize: file.size,
        contentType: guessContentType(file),
      });
      await simplePutUpload(url, file, guessContentType(file), signal, onProgress);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message === "Upload cancelled") throw lastError;
      if (attempt < MAX_PUT_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
      }
    }
  }

  throw lastError ?? new Error("Upload failed after retries");
}

async function apiCallWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
      }
    }
  }
  throw lastError ?? new Error("API call failed after retries");
}

async function uploadMultipart(
  videoId: string,
  file: File,
  signal: AbortSignal,
  onProgress: (progress: number, bytesPerSecond: number, eta: number | null) => void,
): Promise<void> {
  const { uploadId, key, presignedUrls, totalParts } = await api.videos.initiateMultipartUpload(
    videoId,
    {
      filename: file.name,
      fileSize: file.size,
      contentType: guessContentType(file),
    },
  );

  if (signal.aborted) {
    api.videos.abortMultipartUpload(videoId, { uploadId, key }).catch(() => {});
    throw new Error("Upload cancelled");
  }

  const urls = { ...presignedUrls };
  const completedParts: { partNumber: number; etag: string }[] = [];
  const partProgress = new Map<number, number>();
  const recentSpeeds: number[] = [];
  let lastProgressTime = Date.now();
  let lastTotalLoaded = 0;

  const reportProgress = () => {
    let totalLoaded = 0;
    for (const loaded of partProgress.values()) {
      totalLoaded += loaded;
    }

    const now = Date.now();
    const timeDelta = (now - lastProgressTime) / 1000;
    if (timeDelta > 0.2) {
      const bytesDelta = totalLoaded - lastTotalLoaded;
      const speed = bytesDelta / timeDelta;
      recentSpeeds.push(speed);
      if (recentSpeeds.length > 5) recentSpeeds.shift();
      lastProgressTime = now;
      lastTotalLoaded = totalLoaded;
    }

    const avgSpeed =
      recentSpeeds.length > 0
        ? recentSpeeds.reduce((s, v) => s + v, 0) / recentSpeeds.length
        : 0;
    const remaining = file.size - totalLoaded;
    const eta = avgSpeed > 0 ? Math.ceil(remaining / avgSpeed) : null;
    const percentage = Math.round((totalLoaded / file.size) * 100);

    onProgress(percentage, avgSpeed, eta);
  };

  const onPartProgress = (partNumber: number, loaded: number) => {
    partProgress.set(partNumber, loaded);
    reportProgress();
  };

  // Build part queue
  const queue: number[] = [];
  for (let i = totalParts; i >= 1; i--) {
    queue.push(i);
  }

  let uploadError: Error | undefined;

  const worker = async () => {
    while (queue.length > 0 && !uploadError && !signal.aborted) {
      const partNumber = queue.pop()!;
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const blob = file.slice(start, end);

      const getRefreshedUrl = async () => {
        const { presignedUrls: refreshed } = await api.videos.presignParts(videoId, {
          uploadId,
          key,
          partNumbers: [partNumber],
        });
        urls[partNumber] = refreshed[partNumber];
        return refreshed[partNumber];
      };

      try {
        const etag = await uploadPartWithRetry(
          urls[partNumber],
          blob,
          partNumber,
          signal,
          onPartProgress,
          getRefreshedUrl,
        );
        completedParts.push({ partNumber, etag });
      } catch (error) {
        uploadError = error instanceof Error ? error : new Error(String(error));
        return;
      }
    }
  };

  // Launch concurrent workers
  const workerCount = Math.min(MAX_CONCURRENT_PARTS, totalParts);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  if (signal.aborted || uploadError) {
    api.videos.abortMultipartUpload(videoId, { uploadId, key }).catch(() => {});
    throw uploadError ?? new Error("Upload cancelled");
  }

  await api.videos.completeMultipartUpload(videoId, {
    uploadId,
    key,
    parts: completedParts,
  });
}

export function useVideoUploadManager() {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<ManagedUploadItem[]>([]);

  const uploadFilesToProject = useCallback(
    async (projectId: string, files: File[]) => {
      for (const file of files) {
        const uploadId = createUploadId();
        const title = file.name.replace(/\.[^/.]+$/, "");
        const abortController = new AbortController();

        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            projectId,
            file,
            progress: 0,
            status: "pending",
            abortController,
          },
        ]);

        let createdVideoId: string | undefined;

        try {
          const { id: videoId } = await api.videos.create(projectId, {
            title,
            fileSize: file.size,
            contentType: guessContentType(file),
          });
          createdVideoId = videoId;

          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId
                ? { ...upload, videoId: createdVideoId, status: "uploading" }
                : upload,
            ),
          );

          if (file.size >= MULTIPART_THRESHOLD) {
            // ── Multipart Upload Path ──
            await uploadMultipart(
              createdVideoId,
              file,
              abortController.signal,
              (progress, bytesPerSecond, eta) => {
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.id === uploadId
                      ? {
                          ...upload,
                          progress,
                          bytesPerSecond,
                          estimatedSecondsRemaining: eta,
                        }
                      : upload,
                  ),
                );
              },
            );
          } else {
            // ── Simple PUT Path (with retry) ──
            await simplePutWithRetry(
              createdVideoId,
              file,
              abortController.signal,
              (progress, bytesPerSecond, eta) => {
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.id === uploadId
                      ? {
                          ...upload,
                          progress,
                          bytesPerSecond,
                          estimatedSecondsRemaining: eta,
                        }
                      : upload,
                  ),
                );
              },
            );
          }

          await apiCallWithRetry(() => api.videos.markUploadComplete(createdVideoId!));

          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId
                ? { ...upload, status: "complete", progress: 100 }
                : upload,
            ),
          );

          // Invalidate video lists so the new video shows up
          queryClient.invalidateQueries({ queryKey: ["videos", projectId] });

          setTimeout(() => {
            setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
          }, 3000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId
                ? { ...upload, status: "error", error: errorMessage }
                : upload,
            ),
          );

          if (createdVideoId) {
            api.videos.markUploadFailed(createdVideoId).catch(console.error);
          }
        }
      }
    },
    [queryClient],
  );

  const cancelUpload = useCallback(
    (uploadId: string) => {
      const upload = uploads.find((item) => item.id === uploadId);
      if (upload?.abortController) {
        upload.abortController.abort();
      }
      if (upload?.videoId) {
        api.videos.markUploadFailed(upload.videoId).catch(console.error);
      }
      setUploads((prev) => prev.filter((item) => item.id !== uploadId));
    },
    [uploads],
  );

  const dismissUpload = useCallback(
    (uploadId: string) => {
      setUploads((prev) => prev.filter((item) => item.id !== uploadId));
    },
    [],
  );

  const retryUpload = useCallback(
    (uploadId: string) => {
      const upload = uploads.find((item) => item.id === uploadId);
      if (!upload) return;
      setUploads((prev) => prev.filter((item) => item.id !== uploadId));
      void uploadFilesToProject(upload.projectId, [upload.file]);
    },
    [uploads, uploadFilesToProject],
  );

  return {
    uploads,
    uploadFilesToProject,
    cancelUpload,
    dismissUpload,
    retryUpload,
  };
}
