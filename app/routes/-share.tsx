import api from "@/lib/api";
import { Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { PRODUCT_NAME } from "@/lib/product";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/video-player/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDuration, formatTimestamp, formatRelativeTime } from "@/lib/utils";
import { useVideoPresence } from "@/lib/useVideoPresence";
import { VideoWatchers } from "@/components/presence/VideoWatchers";
import { Lock, Video, AlertCircle, MessageSquare, Clock, Mail, User } from "lucide-react";
import { useShareData, useInvalidateShareComments } from "./-share.data";

export default function SharePage() {
  const params = useParams({ strict: false });
  const token = params.token as string;

  const [grantToken, setGrantToken] = useState<string | null>(null);
  const [hasAttemptedAutoGrant, setHasAttemptedAutoGrant] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [isRequestingGrant, setIsRequestingGrant] = useState(false);
  const [playbackSession, setPlaybackSession] = useState<{
    url: string;
    posterUrl?: string;
  } | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState(() => {
    try { return localStorage.getItem("pravko:guestName") ?? ""; } catch { return ""; }
  });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [emailAccessError, setEmailAccessError] = useState<string | null>(null);
  const [hasAttemptedEmailGrant, setHasAttemptedEmailGrant] = useState(false);
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const invalidateComments = useInvalidateShareComments(token, grantToken);

  const { shareInfo, video, comments } = useShareData({ token, grantToken });
  const canTrackPresence = Boolean(playbackSession?.url && video?.id);
  const { watchers } = useVideoPresence({
    videoId: video?.id,
    enabled: canTrackPresence,
    shareToken: token,
  });

  useEffect(() => {
    setGrantToken(null);
    setHasAttemptedAutoGrant(false);
  }, [token]);

  const acquireGrant = useCallback(
    async (password?: string) => {
      if (isRequestingGrant) return;
      setIsRequestingGrant(true);
      setPasswordError(false);
      setVideoUnavailable(false);

      try {
        const result = await api.shareLinks.issueAccessGrant(
          token,
          password ? { password } : undefined,
        );
        if (result.ok && result.grantToken) {
          setGrantToken(result.grantToken);
          return true;
        }

        if (result.error === "video_unavailable") {
          setVideoUnavailable(true);
        } else {
          setPasswordError(Boolean(password));
        }
        return false;
      } catch {
        setPasswordError(Boolean(password));
        return false;
      } finally {
        setIsRequestingGrant(false);
      }
    },
    [isRequestingGrant, token],
  );

  // Auto-acquire grant for non-password-protected, non-email-restricted links
  useEffect(() => {
    if (!shareInfo || grantToken) return;
    if (shareInfo.status !== "ok" || hasAttemptedAutoGrant) return;

    setHasAttemptedAutoGrant(true);
    void acquireGrant();
  }, [acquireGrant, grantToken, hasAttemptedAutoGrant, shareInfo]);

  // Auto-attempt email-restricted grant when user is signed in
  useEffect(() => {
    if (!shareInfo || grantToken || hasAttemptedEmailGrant) return;
    if (shareInfo.status !== "requiresEmail") return;

    setHasAttemptedEmailGrant(true);
    void (async () => {
      try {
        const result = await api.shareLinks.issueAccessGrant(token);
        if (result.ok && result.grantToken) {
          setGrantToken(result.grantToken);
        } else if (result.error === "email_mismatch") {
          setEmailAccessError("email_mismatch");
        }
      } catch {
        // User not signed in or token invalid — show sign-in prompt
      }
    })();
  }, [shareInfo, grantToken, hasAttemptedEmailGrant, token]);

  // Fetch playback session once we have a grant
  useEffect(() => {
    if (!grantToken) {
      setPlaybackSession(null);
      setPlaybackError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPlayback(true);
    setPlaybackError(null);

    void api.shareLinks
      .getSharedPlaybackSession(token, grantToken)
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
  }, [token, grantToken]);

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
    if (!grantToken || !commentText.trim() || !guestName.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const trimmedName = guestName.trim();
      try { localStorage.setItem("pravko:guestName", trimmedName); } catch { /* ignore */ }
      await api.shareLinks.createCommentForShareGrant(token, {
        grantToken,
        text: commentText.trim(),
        timestampSeconds: currentTime,
        guestName: trimmedName,
      });
      setCommentText("");
      invalidateComments();
    } catch {
      setCommentError(t({message: "Failed to post comment.", comment: "Error when comment submission fails"}));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const isBootstrappingShare =
    shareInfo === undefined ||
    (shareInfo?.status === "ok" &&
      ((!grantToken && (!hasAttemptedAutoGrant || isRequestingGrant)) ||
        (Boolean(grantToken) && video === undefined)));

  if (isBootstrappingShare) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center">
        <div className="text-[#888]"><Trans comment="Loading state while shared video page initializes">Opening shared video...</Trans></div>
      </div>
    );
  }

  if (shareInfo!.status === "missing" || shareInfo!.status === "expired") {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#dc2626]/10 flex items-center justify-center mb-4 border-2 border-[#dc2626]">
              <AlertCircle className="h-6 w-6 text-[#dc2626]" />
            </div>
            <CardTitle><Trans comment="Title when share link is expired or not found">Link expired or invalid</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when share link is expired or not found">This share link is no longer valid. Please ask the video owner for a new link.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" preload="intent" className="block">
              <Button variant="outline" className="w-full">
                <Trans comment="Button to navigate to product homepage. {PRODUCT_NAME} is the product name, keep untranslated">Go to {PRODUCT_NAME}</Trans>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (videoUnavailable) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-4 border-2 border-[#1a1a1a]">
              <Video className="h-6 w-6 text-[#888]" />
            </div>
            <CardTitle><Trans comment="Title when shared video is not available">Video not available</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when shared video is not available">This video is not available or is still processing.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" preload="intent" className="block">
              <Button variant="outline" className="w-full">
                <Trans comment="Button to navigate to product homepage. {PRODUCT_NAME} is the product name, keep untranslated">Go to {PRODUCT_NAME}</Trans>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shareInfo!.status === "requiresPassword" && !grantToken) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-4 border-2 border-[#1a1a1a]">
              <Lock className="h-6 w-6 text-[#888]" />
            </div>
            <CardTitle><Trans comment="Title when shared video requires a password">Password required</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when shared video requires a password">This video is password protected. Enter the password to view.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                await acquireGrant(passwordInput);
              }}
              className="space-y-4"
            >
              <Input
                type="password"
                placeholder={t({message: "Enter password", comment: "Placeholder for password input on shared video"})}
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-[#dc2626]"><Trans comment="Error when wrong password entered for shared video">Incorrect password</Trans></p>
              )}
              <Button type="submit" className="w-full" disabled={!passwordInput || isRequestingGrant}>
                {isRequestingGrant ? <Trans comment="Button state while verifying password">Verifying...</Trans> : <Trans comment="Button to view password-protected video">View video</Trans>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shareInfo!.status === "requiresEmail" && !grantToken) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-4 border-2 border-[#1a1a1a]">
              <Mail className="h-6 w-6 text-[#888]" />
            </div>
            <CardTitle><Trans comment="Title when shared video requires email verification">Email verification required</Trans></CardTitle>
            <CardDescription>
              {emailAccessError === "email_mismatch"
                ? <Trans comment="Error when signed-in email doesn't match the restricted email">This video was shared with a different email address.</Trans>
                : <Trans comment="Description when shared video requires email verification">This video is shared with a specific person. Sign in to verify your email.</Trans>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={`/sign-in?redirect_url=${encodeURIComponent(`/share/${token}`)}`}
              className="block"
            >
              <Button className="w-full">
                <Trans comment="Button to sign in for email-restricted video">Sign in</Trans>
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-4 border-2 border-[#1a1a1a]">
              <Video className="h-6 w-6 text-[#888]" />
            </div>
            <CardTitle><Trans comment="Title when shared video is not available">Video not available</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when shared video is not available">This video is not available or is still processing.</Trans>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0e8]">
      <header className="bg-[#f0f0e8] border-b-2 border-[#1a1a1a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            preload="intent"
            to="/"
            className="text-[#888] hover:text-[#1a1a1a] text-sm flex items-center gap-2 font-bold"
          >
            {PRODUCT_NAME}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a]">{video.title}</h1>
          {video.description && (
            <p className="text-[#888] mt-1">{video.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-[#888]">
            {video.duration && <span className="font-mono">{formatDuration(video.duration)}</span>}
            {comments && <span><Plural value={comments.length} one="# thread" other="# threads" comment="Number of comment threads on shared video" /></span>}
            <VideoWatchers watchers={watchers} className="ml-auto" />
          </div>
        </div>

        <div className="border-2 border-[#1a1a1a] overflow-hidden">
          {playbackSession?.url ? (
            <VideoPlayer
              ref={playerRef}
              src={playbackSession.url}
              poster={playbackSession.posterUrl}
              comments={flattenedComments}
              onTimeUpdate={setCurrentTime}
              allowDownload={false}
            />
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800/80 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
              {(playbackSession?.posterUrl || video.thumbnailUrl?.startsWith("http")) ? (
                <img
                  src={playbackSession?.posterUrl ?? video.thumbnailUrl}
                  alt={`${video.title} thumbnail`}
                  className="h-full w-full object-cover blur-[4px]"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                <p className="text-sm font-medium text-white/85">
                  {playbackError ?? (isLoadingPlayback ? <Trans comment="Loading state while video stream is being fetched">Loading stream...</Trans> : <Trans comment="Loading state while video stream is being prepared">Preparing stream...</Trans>)}
                </p>
              </div>
            </div>
          )}
        </div>

        <section className="border-2 border-[#1a1a1a] bg-[#e8e8e0] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#1a1a1a]"><Trans comment="Heading for comments section on shared video">Comments</Trans></h2>
            <span className="text-xs text-[#888] font-mono">{formatTimestamp(currentTime)}</span>
          </div>

          <form onSubmit={handleSubmitComment} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#666]">
              <Clock className="h-3.5 w-3.5" />
              <Trans comment="Label showing the video timestamp where comment will be placed">Comment at {formatTimestamp(currentTime)}</Trans>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#888] shrink-0" />
              <Input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder={t({message: "Your name", comment: "Placeholder for guest name input on shared video"})}
                maxLength={100}
                className="flex-1"
              />
            </div>
            <Textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={t({message: "Leave a comment...", comment: "Placeholder for comment input on shared video"})}
              className="min-h-[90px]"
            />
            {commentError ? <p className="text-xs text-[#dc2626]">{commentError}</p> : null}
            <Button type="submit" disabled={!commentText.trim() || !guestName.trim() || isSubmittingComment}>
              <MessageSquare className="mr-1.5 h-4 w-4" />
              {isSubmittingComment ? <Trans comment="Button state while comment is being posted">Posting...</Trans> : <Trans comment="Button to post a comment">Post comment</Trans>}
            </Button>
          </form>

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
        </section>
      </main>

      <footer className="border-t-2 border-[#1a1a1a] px-6 py-4 mt-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-[#888]">
          <Trans comment="Footer text on shared video page. {PRODUCT_NAME} is the product name, keep untranslated">Shared via{" "}<Link to="/" preload="intent" className="text-[#1a1a1a] hover:text-[#2d5a2d] font-bold">{PRODUCT_NAME}</Link></Trans>
        </div>
      </footer>
    </div>
  );
}
