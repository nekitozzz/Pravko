import { useLogto } from "@logto/react";
import api from "@/lib/api";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { PRODUCT_NAME } from "@/lib/product";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/video-player/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDuration, formatTimestamp, formatRelativeTime } from "@/lib/utils";
import { AlertCircle, MessageSquare, Clock, X } from "lucide-react";
import { useWatchData } from "./-watch.data";

export default function WatchPage() {
  const params = useParams({ strict: false });
  const publicId = params.publicId as string;
  const { isAuthenticated, getIdTokenClaims } = useLogto();
  const claims = getIdTokenClaims();
  const isSignedIn = isAuthenticated && !!claims;

  const { video, comments } = useWatchData({ publicId });
  const [playbackSession, setPlaybackSession] = useState<{
    url: string;
    posterUrl?: string;
  } | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  const playerRef = useRef<VideoPlayerHandle | null>(null);

  useEffect(() => {
    if (!video?.s3HlsPrefix) {
      setPlaybackSession(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPlayback(true);
    setPlaybackError(null);

    void api.videos
      .getPublicPlaybackSession(publicId)
      .then((session) => {
        if (cancelled) return;
        setPlaybackSession(session);
      })
      .catch(() => {
        if (cancelled) return;
        setPlaybackError(t({message: "Unable to load playback session.", comment: "Error when video playback fails to load"}));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingPlayback(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicId, video?.s3HlsPrefix]);

  const flattenedComments = useMemo(() => {
    if (!comments) return [] as Array<{ id: string; timestampSeconds: number; resolved: boolean }>;

    const markers: Array<{ id: string; timestampSeconds: number; resolved: boolean }> = [];
    for (const comment of comments) {
      markers.push({
        id: comment.id,
        timestampSeconds: comment.timestampSeconds,
        resolved: comment.resolved,
      });
      for (const reply of comment.replies) {
        markers.push({
          id: reply.id,
          timestampSeconds: reply.timestampSeconds,
          resolved: reply.resolved,
        });
      }
    }
    return markers;
  }, [comments]);

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      await api.comments.createForPublic(publicId, {
        text: commentText.trim(),
        timestampSeconds: currentTime,
      });
      setCommentText("");
    } catch {
      setCommentError(t({message: "Failed to post comment.", comment: "Error when comment submission fails"}));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (video === undefined) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center">
        <div className="text-[#888]"><Trans comment="Loading state while watch page initializes">Loading...</Trans></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#dc2626]/10 flex items-center justify-center mb-4 border-2 border-[#dc2626]">
              <AlertCircle className="h-6 w-6 text-[#dc2626]" />
            </div>
            <CardTitle><Trans comment="Title when video is not accessible">Video unavailable</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when video is not accessible">This video is private, invalid, or no longer available.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" preload="intent" className="block">
              <Button variant="outline" className="w-full"><Trans comment="Button to navigate to product homepage. {PRODUCT_NAME} is the product name, keep untranslated">Go to {PRODUCT_NAME}</Trans></Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#f0f0e8]">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#f0f0e8] border-b-2 border-[#1a1a1a] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            preload="intent"
            to="/"
            className="text-[#888] hover:text-[#1a1a1a] text-sm flex items-center gap-2 font-bold"
          >
            {PRODUCT_NAME}
          </Link>
          <div className="h-4 w-[2px] bg-[#1a1a1a]/20" />
          <h1 className="text-base font-black truncate max-w-[150px] sm:max-w-[300px]">{video.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#888]">
          {video.duration && (
            <>
              <span className="hidden sm:inline text-[#ccc]">·</span>
              <span className="hidden sm:inline font-mono">{formatDuration(video.duration)}</span>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden h-8"
            onClick={() => setMobileCommentsOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            {comments && comments.length > 0 && (
              <span className="ml-1.5 text-xs">{comments.length}</span>
            )}
          </Button>
        </div>
      </header>

      {/* Main content - horizontal split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video player area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
          {playbackSession?.url ? (
            <VideoPlayer
              ref={playerRef}
              src={playbackSession.url}
              poster={playbackSession.posterUrl}
              comments={flattenedComments}
              onTimeUpdate={setCurrentTime}
              allowDownload={false}
              controlsBelow
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white">
                 <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                 <p className="text-sm font-medium text-white/85">
                   {playbackError ?? (isLoadingPlayback ? <Trans comment="Loading state while video stream is being fetched">Loading stream...</Trans> : <Trans comment="Loading state while video stream is being prepared">Preparing stream...</Trans>)}
                 </p>
              </div>
            </div>
          )}
        </div>

        {/* Comments sidebar — desktop */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-l-2 border-[#1a1a1a] flex-col bg-[#f0f0e8]">
          <div className="flex-shrink-0 px-5 py-4 border-b border-[#1a1a1a]/10 flex items-center justify-between">
            <h2 className="font-semibold text-sm tracking-tight flex items-center gap-2 text-[#1a1a1a]">
              <Trans comment="Heading for discussion/comments section">Discussion</Trans>
            </h2>
            {comments && comments.length > 0 && (
              <span className="text-[11px] font-medium text-[#888] bg-[#1a1a1a]/5 px-2 py-0.5 rounded-full">
                <Plural value={comments.length} one="# comment" other="# comments" comment="Number of comments in discussion sidebar" />
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments === undefined ? (
              <p className="text-sm text-[#888]"><Trans comment="Loading state for comments section">Loading comments...</Trans></p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-[#888]"><Trans comment="Empty state when no comments exist">No comments yet.</Trans></p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <article key={comment.id} className="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-[#1a1a1a]">{comment.userName}</div>
                      <button
                        type="button"
                        className="font-mono text-xs text-[#2d5a2d] hover:text-[#1a1a1a]"
                        onClick={() => playerRef.current?.seekTo(comment.timestampSeconds, { play: true })}
                      >
                        {formatTimestamp(comment.timestampSeconds)}
                      </button>
                    </div>
                    <p className="text-sm text-[#1a1a1a] mt-1 whitespace-pre-wrap">{comment.text}</p>
                    <p className="text-[11px] text-[#888] mt-1">{formatRelativeTime(new Date(comment.createdAt).getTime())}</p>

                    {comment.replies.length > 0 ? (
                      <div className="mt-3 ml-4 border-l-2 border-[#1a1a1a] pl-3 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#1a1a1a]">{reply.userName}</span>
                              <button
                                type="button"
                                className="font-mono text-xs text-[#2d5a2d] hover:text-[#1a1a1a]"
                                onClick={() => playerRef.current?.seekTo(reply.timestampSeconds, { play: true })}
                              >
                                {formatTimestamp(reply.timestampSeconds)}
                              </button>
                            </div>
                            <p className="text-[#1a1a1a] whitespace-pre-wrap">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4">
            {isSignedIn ? (
              <form onSubmit={handleSubmitComment} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#666]">
                  <Clock className="h-3.5 w-3.5" />
                  <Trans comment="Label showing the video timestamp where comment will be placed">Comment at {formatTimestamp(currentTime)}</Trans>
                </div>
                <Textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder={t({message: "Leave a comment...", comment: "Placeholder for comment input"})}
                  className="min-h-[90px] text-sm"
                />
                {commentError ? <p className="text-xs text-[#dc2626]">{commentError}</p> : null}
                <Button type="submit" size="sm" disabled={!commentText.trim() || isSubmittingComment} className="w-full">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  {isSubmittingComment ? <Trans comment="Button state while comment is being posted">Posting...</Trans> : <Trans comment="Button to post a comment">Post comment</Trans>}
                </Button>
              </form>
            ) : (
              <a
                href={`/sign-in?redirect_url=${encodeURIComponent(`/watch/${publicId}`)}`}
                className="block"
              >
                <Button className="w-full">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  <Trans comment="Button prompting user to sign in to leave a comment">Sign in to comment</Trans>
                </Button>
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* Comments overlay — mobile */}
      {mobileCommentsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-[#f0f0e8]">
          <div className="flex-shrink-0 px-5 py-4 border-b-2 border-[#1a1a1a] flex items-center justify-between">
            <h2 className="font-semibold text-sm tracking-tight flex items-center gap-2 text-[#1a1a1a]">
              <Trans comment="Heading for discussion/comments section">Discussion</Trans>
              {comments && comments.length > 0 && (
                <span className="text-[11px] font-medium text-[#888] bg-[#1a1a1a]/5 px-2 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileCommentsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments === undefined ? (
              <p className="text-sm text-[#888]"><Trans comment="Loading state for comments section">Loading comments...</Trans></p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-[#888]"><Trans comment="Empty state when no comments exist">No comments yet.</Trans></p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <article key={comment.id} className="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-[#1a1a1a]">{comment.userName}</div>
                      <button
                        type="button"
                        className="font-mono text-xs text-[#2d5a2d] hover:text-[#1a1a1a]"
                        onClick={() => {
                          playerRef.current?.seekTo(comment.timestampSeconds, { play: true });
                          setMobileCommentsOpen(false);
                        }}
                      >
                        {formatTimestamp(comment.timestampSeconds)}
                      </button>
                    </div>
                    <p className="text-sm text-[#1a1a1a] mt-1 whitespace-pre-wrap">{comment.text}</p>
                    <p className="text-[11px] text-[#888] mt-1">{formatRelativeTime(new Date(comment.createdAt).getTime())}</p>

                    {comment.replies.length > 0 ? (
                      <div className="mt-3 ml-4 border-l-2 border-[#1a1a1a] pl-3 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#1a1a1a]">{reply.userName}</span>
                              <button
                                type="button"
                                className="font-mono text-xs text-[#2d5a2d] hover:text-[#1a1a1a]"
                                onClick={() => {
                                  playerRef.current?.seekTo(reply.timestampSeconds, { play: true });
                                  setMobileCommentsOpen(false);
                                }}
                              >
                                {formatTimestamp(reply.timestampSeconds)}
                              </button>
                            </div>
                            <p className="text-[#1a1a1a] whitespace-pre-wrap">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t-2 border-[#1a1a1a] bg-[#f0f0e8] p-4 pb-safe">
            {isSignedIn ? (
              <form onSubmit={handleSubmitComment} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#666]">
                  <Clock className="h-3.5 w-3.5" />
                  <Trans comment="Label showing the video timestamp where comment will be placed">Comment at {formatTimestamp(currentTime)}</Trans>
                </div>
                <Textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder={t({message: "Leave a comment...", comment: "Placeholder for comment input"})}
                  className="min-h-[90px] text-sm"
                />
                {commentError ? <p className="text-xs text-[#dc2626]">{commentError}</p> : null}
                <Button type="submit" size="sm" disabled={!commentText.trim() || isSubmittingComment} className="w-full">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  {isSubmittingComment ? <Trans comment="Button state while comment is being posted">Posting...</Trans> : <Trans comment="Button to post a comment">Post comment</Trans>}
                </Button>
              </form>
            ) : (
              <a
                href={`/sign-in?redirect_url=${encodeURIComponent(`/watch/${publicId}`)}`}
                className="block"
              >
                <Button className="w-full">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  <Trans comment="Button prompting user to sign in to leave a comment">Sign in to comment</Trans>
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
