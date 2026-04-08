"use client";

import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadStatus = "pending" | "uploading" | "processing" | "complete" | "error";

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "—";
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "";
  if (seconds < 60) return t({message: `${seconds}s`, comment: "Time remaining: N seconds"});
  if (seconds < 3600) return t({message: `${Math.ceil(seconds / 60)}m`, comment: "Time remaining: N minutes"});
  return t({message: `${Math.ceil(seconds / 3600)}h`, comment: "Time remaining: N hours"});
}

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  error?: string;
  bytesPerSecond?: number;
  estimatedSecondsRemaining?: number | null;
  onCancel?: () => void;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  error,
  bytesPerSecond = 0,
  estimatedSecondsRemaining = null,
  onCancel,
  onDismiss,
  onRetry,
}: UploadProgressProps) {
  return (
    <div className="border-2 border-[#1a1a1a] p-4 bg-[#f0f0e8]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a1a1a] truncate text-sm">{fileName}</p>
          <p className="text-xs text-[#888] mt-0.5">{formatBytes(fileSize)}</p>
        </div>
        <div className="flex items-center gap-2">
          {status === "complete" && (
            <CheckCircle className="h-5 w-5 text-[#2d5a2d]" />
          )}
          {status === "error" && onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-7 w-7 text-[#888] hover:text-[#1a1a1a]"
              aria-label={t({message: "Dismiss", comment: "Aria label for dismiss upload error button"})}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {status === "processing" && (
            <Loader2 className="h-5 w-5 text-[#2d5a2d] animate-spin" />
          )}
          {(status === "pending" || status === "uploading") && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-7 w-7 text-[#888] hover:text-[#1a1a1a]"
              aria-label={t({message: "Cancel upload", comment: "Aria label for cancel upload button"})}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {status === "uploading" && (
        <div className="mt-3 space-y-1.5">
          <Progress value={progress} />
          <div className="flex justify-between text-xs text-[#888] font-mono">
            <span>{formatSpeed(bytesPerSecond)}</span>
            <span>
              {progress}%
              {estimatedSecondsRemaining !== null && estimatedSecondsRemaining > 0 && (
                <span className="text-[#888]"> · {formatTimeRemaining(estimatedSecondsRemaining)} <Trans comment="Suffix after time remaining">left</Trans></span>
              )}
            </span>
          </div>
        </div>
      )}

      {status === "processing" && (
        <p className="text-xs text-[#888] mt-2"><Trans comment="Upload status: video is being processed">Processing video...</Trans></p>
      )}

      {status === "error" && error && (
        <div className="flex items-center justify-between gap-2 mt-2">
          <p className="text-xs text-[#dc2626]">{error}</p>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs font-bold text-[#1a1a1a] hover:text-[#2d5a2d] shrink-0"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              <Trans comment="Retry failed upload button">Retry</Trans>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
