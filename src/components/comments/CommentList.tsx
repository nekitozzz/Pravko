"use client";

import { useQuery } from "@tanstack/react-query";
import api, { type ThreadedComment } from "@/lib/api";
import { CommentItem } from "./CommentItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trans } from "@lingui/react/macro";

interface CommentListProps {
  videoId: string;
  comments?: ThreadedComment[];
  onTimestampClick: (seconds: number) => void;
  highlightedCommentId?: string;
  canResolve?: boolean;
  subscriptionActive?: boolean;
  onSubscriptionRequired?: () => void;
}

export function CommentList({
  videoId,
  comments: providedComments,
  onTimestampClick,
  highlightedCommentId,
  canResolve = false,
  subscriptionActive = true,
  onSubscriptionRequired,
}: CommentListProps) {
  const { data: queriedComments } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: () => api.comments.getThreaded(videoId),
    enabled: !providedComments,
  });
  const comments = providedComments ?? queriedComments;

  if (comments === undefined) {
    return (
      <div className="p-4 text-center text-[#888]"><Trans comment="Loading indicator for comments">Loading...</Trans></div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-[#888] text-sm text-center">
          <Trans comment="Empty state when video has no comments">No comments yet.<br />Click on the timeline to add one.</Trans>
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col divide-y divide-[#1a1a1a]/10 dark:divide-white/10">
        {comments.map((comment) => (
          <div key={comment.id} className="relative">
            <CommentItem
              comment={comment}
              onTimestampClick={onTimestampClick}
              isHighlighted={highlightedCommentId === comment.id}
              canResolve={canResolve}
              subscriptionActive={subscriptionActive}
              onSubscriptionRequired={onSubscriptionRequired}
            />
            {comment.replies.length > 0 && (
              <div className="pl-14 pr-4 pb-4 space-y-4 relative">
                <div className="absolute left-[1.35rem] top-0 bottom-6 w-px bg-[#1a1a1a]/10 dark:bg-white/10" />
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onTimestampClick={onTimestampClick}
                    isHighlighted={highlightedCommentId === reply.id}
                    isReply
                    canResolve={canResolve}
                    subscriptionActive={subscriptionActive}
                    onSubscriptionRequired={onSubscriptionRequired}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
