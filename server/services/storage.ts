import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

export function getExtensionFromKey(key: string, fallback = "mp4"): string {
  let source = key;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    try {
      source = new URL(key).pathname;
    } catch {
      source = key;
    }
  }

  const ext = source.split(".").pop();
  if (!ext || ext.length > 8 || /[^a-zA-Z0-9]/.test(ext)) return fallback;
  return ext.toLowerCase();
}

export function sanitizeFilename(input: string): string {
  const trimmed = input.trim();
  const base = trimmed.length > 0 ? trimmed : "video";
  return base
    .replace(/["']/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

export function buildDownloadFilename(title: string | undefined, key: string): string {
  const ext = getExtensionFromKey(key);
  const safeTitle = sanitizeFilename(title ?? "video");
  return safeTitle.endsWith(`.${ext}`) ? safeTitle : `${safeTitle}.${ext}`;
}

export async function generatePresignedPutUrl(
  s3: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function generatePresignedGetUrl(
  s3: S3Client,
  bucket: string,
  key: string,
  options?: { expiresIn?: number; filename?: string; contentType?: string },
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: options?.filename
      ? `attachment; filename="${options.filename}"`
      : undefined,
    ResponseContentType: options?.contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: options?.expiresIn ?? 600 });
}

export async function headObject(
  s3: S3Client,
  bucket: string,
  key: string,
) {
  const result = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    contentLength: result.ContentLength,
    contentType: result.ContentType,
  };
}

export async function deleteObject(s3: S3Client, bucket: string, key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deletePrefix(s3: S3Client, bucket: string, prefix: string) {
  let continuationToken: string | undefined;
  do {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));
    const objects = list.Contents;
    if (objects && objects.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
      }));
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
}

const ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/matroska",
  "video/x-msvideo",
  "video/avi",
]);

const GIBIBYTE = 1024 ** 3;
const MAX_FILE_SIZE = 5 * GIBIBYTE;

export function normalizeContentType(contentType: string | null | undefined): string {
  if (!contentType) return "";
  return contentType.split(";")[0].trim().toLowerCase();
}

export function validateUploadRequest(args: { fileSize: number; contentType: string }): string {
  if (!Number.isFinite(args.fileSize) || args.fileSize <= 0) {
    throw Object.assign(new Error("Video file size must be greater than zero."), { statusCode: 400 });
  }
  if (args.fileSize > MAX_FILE_SIZE) {
    throw Object.assign(new Error("Video file is too large for direct upload."), { statusCode: 400 });
  }
  const normalized = normalizeContentType(args.contentType);
  if (!ALLOWED_UPLOAD_CONTENT_TYPES.has(normalized)) {
    throw Object.assign(new Error("Unsupported video format. Allowed: mp4, mov, webm, mkv, avi."), { statusCode: 400 });
  }
  return normalized;
}

// ── Multipart Upload ──

export async function createMultipartUpload(
  s3: S3Client,
  bucket: string,
  key: string,
  contentType: string,
): Promise<string> {
  const result = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
  );
  if (!result.UploadId) throw new Error("Failed to initiate multipart upload");
  return result.UploadId;
}

export async function generatePresignedPartUrls(
  s3: S3Client,
  bucket: string,
  key: string,
  uploadId: string,
  partNumbers: number[],
  expiresIn = 3600,
): Promise<Record<number, string>> {
  const urls: Record<number, string> = {};
  await Promise.all(
    partNumbers.map(async (partNumber) => {
      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      urls[partNumber] = await getSignedUrl(s3, command, { expiresIn });
    }),
  );
  return urls;
}

export async function completeMultipartUpload(
  s3: S3Client,
  bucket: string,
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
): Promise<void> {
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sorted.map((p) => ({
          PartNumber: p.partNumber,
          ETag: p.etag,
        })),
      },
    }),
  );
}

export async function abortMultipartUpload(
  s3: S3Client,
  bucket: string,
  key: string,
  uploadId: string,
): Promise<void> {
  await s3.send(
    new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    }),
  );
}

export function buildHlsUrl(publicUrl: string, videoId: string): string {
  return `${publicUrl}/hls/${videoId}/master.m3u8`;
}

export function buildThumbnailUrl(publicUrl: string, videoId: string): string {
  return `${publicUrl}/thumb/${videoId}/thumb.jpg`;
}
