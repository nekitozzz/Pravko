import { spawn } from "node:child_process";
import { mkdtemp, rm, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export type TranscodeStage = "downloading" | "transcoding" | "uploading" | "generating_thumbnail" | "complete";
export type OnProgress = (stage: TranscodeStage, percent: number) => void;

interface TranscodeResult {
  hlsPrefix: string;
  duration: number;
  thumbnailKey: string;
}

function runFfmpeg(
  args: string[],
  onProgress?: (timeSeconds: number) => void,
): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (onProgress) {
        const match = text.match(/time=(\d+):(\d+):(\d+)\.(\d+)/);
        if (match) {
          const [, h, m, s, cs] = match;
          const t = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(cs) / 100;
          onProgress(t);
        }
      }
    });
    proc.on("close", (code) => resolve({ exitCode: code ?? 1, stderr }));
    proc.on("error", reject);
  });
}

function probeDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      inputPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    proc.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    proc.on("close", () => resolve(parseFloat(stdout.trim()) || 0));
    proc.on("error", reject);
  });
}

function parseDuration(stderr: string): number {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
  if (!match) return 0;
  const [, h, m, s, ms] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 100;
}

async function uploadDirectory(
  s3: S3Client,
  bucket: string,
  localDir: string,
  s3Prefix: string,
  onFileProgress?: (uploaded: number, total: number) => void,
) {
  const entries = await readdir(localDir, { withFileTypes: true, recursive: true });
  const files = entries.filter((e) => e.isFile());
  let uploaded = 0;
  for (const entry of files) {
    const fullPath = join(entry.parentPath || localDir, entry.name);
    const relativePath = fullPath.slice(localDir.length + 1);
    const key = `${s3Prefix}/${relativePath}`;
    const body = await readFile(fullPath);

    let contentType = "application/octet-stream";
    if (key.endsWith(".m3u8")) contentType = "application/vnd.apple.mpegurl";
    else if (key.endsWith(".ts")) contentType = "video/MP2T";

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: key.endsWith(".m3u8") ? "no-cache" : "public, max-age=31536000, immutable",
    }));
    uploaded++;
    onFileProgress?.(uploaded, files.length);
  }
}

export async function transcodeToHls(
  s3: S3Client,
  bucket: string,
  inputKey: string,
  videoId: string,
  publicUrl: string,
  onProgress?: OnProgress,
): Promise<TranscodeResult> {
  const workDir = await mkdtemp(join(tmpdir(), "transcode-"));

  try {
    // Download input from S3
    onProgress?.("downloading", 0);
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: inputKey }));
    const { writeFile } = await import("node:fs/promises");
    const inputPath = join(workDir, "input");
    const chunks: Buffer[] = [];
    const stream = response.Body as NodeJS.ReadableStream;
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    await writeFile(inputPath, Buffer.concat(chunks));
    onProgress?.("downloading", 5);

    // Probe total duration for progress calculation
    const totalDuration = await probeDuration(inputPath);

    // Create output directories
    const { mkdir } = await import("node:fs/promises");
    const hlsDir = join(workDir, "hls");
    await mkdir(join(hlsDir, "360p"), { recursive: true });
    await mkdir(join(hlsDir, "720p"), { recursive: true });
    await mkdir(join(hlsDir, "1080p"), { recursive: true });

    // Transcode to HLS with adaptive bitrate
    onProgress?.("transcoding", 5);
    const ffmpegResult = await runFfmpeg([
      "-i", inputPath,
      "-filter_complex",
      "[0:v]split=3[v1][v2][v3];[v1]scale=640:360[v360];[v2]scale=1280:720[v720];[v3]scale=1920:1080[v1080]",
      "-map", "[v360]", "-map", "0:a?",
      "-c:v", "libx264", "-b:v", "800k", "-c:a", "aac", "-b:a", "96k",
      "-hls_time", "6", "-hls_list_size", "0", "-f", "hls",
      join(hlsDir, "360p", "index.m3u8"),
      "-map", "[v720]", "-map", "0:a?",
      "-c:v", "libx264", "-b:v", "2500k", "-c:a", "aac", "-b:a", "128k",
      "-hls_time", "6", "-hls_list_size", "0", "-f", "hls",
      join(hlsDir, "720p", "index.m3u8"),
      "-map", "[v1080]", "-map", "0:a?",
      "-c:v", "libx264", "-b:v", "5000k", "-c:a", "aac", "-b:a", "192k",
      "-hls_time", "6", "-hls_list_size", "0", "-f", "hls",
      join(hlsDir, "1080p", "index.m3u8"),
    ], totalDuration > 0 ? (timeSec) => {
      const pct = Math.min(75, 5 + Math.round((timeSec / totalDuration) * 70));
      onProgress?.("transcoding", pct);
    } : undefined);

    if (ffmpegResult.exitCode !== 0) {
      throw new Error(`FFmpeg transcode failed: ${ffmpegResult.stderr.slice(-500)}`);
    }

    const duration = parseDuration(ffmpegResult.stderr);
    onProgress?.("transcoding", 75);

    // Generate master playlist
    const masterPlaylist = [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "",
      "#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360",
      "360p/index.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720",
      "720p/index.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080",
      "1080p/index.m3u8",
    ].join("\n");

    await writeFile(join(hlsDir, "master.m3u8"), masterPlaylist);

    // Upload HLS segments to S3
    onProgress?.("uploading", 75);
    const hlsPrefix = `hls/${videoId}`;
    await uploadDirectory(s3, bucket, hlsDir, hlsPrefix, (uploaded, total) => {
      const pct = 75 + Math.round((uploaded / total) * 20);
      onProgress?.("uploading", Math.min(95, pct));
    });

    // Generate thumbnail
    onProgress?.("generating_thumbnail", 95);
    const thumbDir = join(workDir, "thumb");
    await mkdir(thumbDir, { recursive: true });
    const thumbPath = join(thumbDir, "thumb.jpg");
    await runFfmpeg([
      "-i", inputPath,
      "-ss", "00:00:01",
      "-vframes", "1",
      "-q:v", "2",
      thumbPath,
    ]);

    // Upload thumbnail to S3
    const thumbnailKey = `thumb/${videoId}/thumb.jpg`;
    const thumbData = await readFile(thumbPath);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: thumbnailKey,
      Body: thumbData,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=86400",
    }));

    onProgress?.("complete", 100);
    return {
      hlsPrefix,
      duration,
      thumbnailKey,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
