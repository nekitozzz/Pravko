"use client";

import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, formatRelativeTime, getInitials, cn } from "@/lib/utils";
import { Check, MoreVertical, Trash2, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { CommentInput } from "./CommentInput";

interface Comment {
  id: string;
  videoId: string;
  text: string;
  timestampSeconds: number;
  parentId?: string;
  resolved: boolean;
  userName: string;
  userAvatarUrl?: string;
  createdAt: string;
}

interface CommentItemProps {
  comment: Comment;
  onTimestampClick: (seconds: number) => void;
  isHighlighted?: boolean;
  isReply?: boolean;
  canResolve?: boolean;
  subscriptionActive?: boolean;
  onSubscriptionRequired?: () => void;
}

export function CommentItem({
  comment,
  onTimestampClick,
  isHighlighted = false,
  isReply = false,
  canResolve = false,
  subscriptionActive = true,
  onSubscriptionRequired,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const queryClient = useQueryClient();

  const handleToggleResolved = async () => {
    try {
      await api.comments.toggleResolved(comment.id);
      queryClient.invalidateQueries({ queryKey: ["comments", comment.videoId] });
    } catch (error) {
      console.error("Failed to toggle resolved:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t({message: "Are you sure you want to delete this comment?", comment: "Confirmation dialog when deleting a comment"}))) return;
    try {
      await api.comments.remove(comment.id);
      queryClient.invalidateQueries({ queryKey: ["comments", comment.videoId] });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div
      className={cn(
        "transition-all relative group",
        isReply ? "py-2" : "p-4",
        isHighlighted
          ? "bg-[#2d5a2d]/10"
          : "hover:bg-[#1a1a1a]/5",
        comment.resolved && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shadow-sm">
          <AvatarImage src={comment.userAvatarUrl} />
          <AvatarFallback className="text-[10px]">
            {getInitials(comment.userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm text-[#1a1a1a] truncate">
                {comment.userName}
              </span>
              <button
                onClick={() => onTimestampClick(comment.timestampSeconds)}
                className="text-xs text-[#2d5a2d] hover:text-[#1a1a1a] font-mono font-bold shrink-0"
                title={t({message: "Jump to timestamp", comment: "Tooltip for comment timestamp button"})}
                aria-label={t({message: "Jump to timestamp", comment: "Aria label for comment timestamp button"})}
              >
                {formatTimestamp(comment.timestampSeconds)}
              </button>
              {comment.resolved && (
                <Badge variant="success" className="text-[10px] shrink-0">
                  <Trans comment="Badge indicating comment is resolved">Resolved</Trans>
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  title={t({message: "Comment actions", comment: "Tooltip for comment actions menu"})}
                  aria-label={t({message: "Comment actions", comment: "Aria label for comment actions menu"})}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isReply && (
                  <DropdownMenuItem onClick={() => {
                    if (!subscriptionActive) { onSubscriptionRequired?.(); return; }
                    setIsReplying(true);
                  }}>
                    <Reply className="mr-2 h-4 w-4" />
                    <Trans comment="Menu action to reply to a comment">Reply</Trans>
                  </DropdownMenuItem>
                )}
                {canResolve && !isReply && (
                  <DropdownMenuItem onClick={() => {
                    if (!subscriptionActive) { onSubscriptionRequired?.(); return; }
                    void handleToggleResolved();
                  }}>
                    <Check className="mr-2 h-4 w-4" />
                    {comment.resolved ? <Trans comment="Menu action to unresolve a comment">Unresolve</Trans> : <Trans comment="Menu action to resolve a comment">Resolve</Trans>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-[#dc2626] focus:text-[#dc2626]"
                  onClick={() => {
                    if (!subscriptionActive) { onSubscriptionRequired?.(); return; }
                    void handleDelete();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <Trans comment="Menu action to delete a comment">Delete</Trans>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-[#1a1a1a] mt-1 whitespace-pre-wrap break-words">
            {comment.text}
          </p>
          <p className="text-[11px] text-[#888] mt-1">
            {formatRelativeTime(new Date(comment.createdAt).getTime())}
          </p>
        </div>
      </div>

      {isReplying && (
        <div className="mt-3 ml-10">
          <CommentInput
            videoId={comment.videoId}
            timestampSeconds={comment.timestampSeconds}
            parentId={comment.id}
            onSubmit={() => setIsReplying(false)}
            onCancel={() => setIsReplying(false)}
            autoFocus
            placeholder={t({message: "Write a reply...", comment: "Placeholder for reply input"})}
          />
        </div>
      )}
    </div>
  );
}
