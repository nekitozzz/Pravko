"use client";

import { useState } from "react";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  Lock,
  ExternalLink,
  Globe,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";

interface ShareDialogProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ videoId, open, onOpenChange }: ShareDialogProps) {
  const queryClient = useQueryClient();

  const { data: video } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => api.videos.get(videoId),
    enabled: open,
  });

  const { data: shareLinks } = useQuery({
    queryKey: ["share-links", videoId],
    queryFn: () => api.shareLinks.list(videoId),
    enabled: open,
  });

  const createShareLinkMutation = useMutation({
    mutationFn: (body: {
      expiresInDays?: number;
      password?: string;
      allowDownload?: boolean;
      email?: string;
    }) => api.shareLinks.create(videoId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-links", videoId] });
    },
  });

  const deleteShareLinkMutation = useMutation({
    mutationFn: (linkId: string) => api.shareLinks.remove(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-links", videoId] });
    },
  });

  const setVisibilityMutation = useMutation({
    mutationFn: (visibility: "public" | "private") =>
      api.videos.setVisibility(videoId, { visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
    },
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkOptions, setNewLinkOptions] = useState({
    expiresInDays: undefined as number | undefined,
    password: undefined as string | undefined,
    email: undefined as string | undefined,
  });

  const handleCreateLink = async () => {
    try {
      await createShareLinkMutation.mutateAsync({
        expiresInDays: newLinkOptions.expiresInDays,
        allowDownload: false,
        password: newLinkOptions.password,
        email: newLinkOptions.email,
      });
      setNewLinkOptions({
        expiresInDays: undefined,
        password: undefined,
        email: undefined,
      });
    } catch (error) {
      console.error("Failed to create share link:", error);
    }
  };

  const handleSetVisibility = async (visibility: "public" | "private") => {
    if (!video || setVisibilityMutation.isPending || video.visibility === visibility) return;
    try {
      await setVisibilityMutation.mutateAsync(visibility);
    } catch (error) {
      console.error("Failed to update visibility:", error);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyPublicLink = () => {
    if (!video?.publicId) return;
    const url = `${window.location.origin}/watch/${video.publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedId("public");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm(t({ message: "Are you sure you want to delete this share link?", comment: "Confirmation dialog when deleting a share link" }))) return;
    try {
      await deleteShareLinkMutation.mutateAsync(linkId);
    } catch (error) {
      console.error("Failed to delete share link:", error);
    }
  };

  const publicWatchPath = video?.publicId ? `/watch/${video.publicId}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle><Trans comment="Dialog title for sharing a video">Share video</Trans></DialogTitle>
          <DialogDescription>
            <Trans comment="Description for the share video dialog">Public videos can be viewed by anyone with the URL. Share link recipients can watch and comment without signing up.</Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-2 border-[#1a1a1a] p-4 bg-[#e8e8e0]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#1a1a1a]"><Trans comment="Label for video visibility setting">Visibility</Trans></h3>
              <p className="text-xs text-[#666]">
                <Trans comment="Description of video visibility behavior">Private disables the public URL. Restricted share links can still be used.</Trans>
              </p>
            </div>
            <Badge variant={video?.visibility === "public" ? "success" : "secondary"}>
              {video?.visibility === "public" ? <Trans comment="Video visibility: public">Public</Trans> : <Trans comment="Video visibility: private">Private</Trans>}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={video?.visibility === "public" ? "default" : "outline"}
              disabled={setVisibilityMutation.isPending || video === undefined}
              onClick={() => void handleSetVisibility("public")}
            >
              <Globe className="mr-2 h-4 w-4" />
              <Trans comment="Video visibility: public">Public</Trans>
            </Button>
            <Button
              variant={video?.visibility === "private" ? "default" : "outline"}
              disabled={setVisibilityMutation.isPending || video === undefined}
              onClick={() => void handleSetVisibility("private")}
            >
              <Lock className="mr-2 h-4 w-4" />
              <Trans comment="Video visibility: private">Private</Trans>
            </Button>
          </div>

          {publicWatchPath ? (
            <div className="p-3 border-2 border-[#1a1a1a] bg-[#f0f0e8] space-y-2">
              <div className="text-xs text-[#666]"><Trans comment="Label for the public video URL">Public URL</Trans></div>
              <code className="block text-sm bg-[#e8e8e0] px-2 py-1 font-mono truncate">
                {publicWatchPath}
              </code>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyPublicLink}
                  disabled={video?.visibility !== "public"}
                >
                  {copiedId === "public" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  <Trans comment="Button to copy URL to clipboard">Copy URL</Trans>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={video?.visibility !== "public"}
                  onClick={() => window.open(publicWatchPath, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <Trans comment="Button to open video in new tab">Open</Trans>
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-2 border-[#1a1a1a] p-4 bg-[#e8e8e0]">
          <h3 className="font-bold text-sm text-[#1a1a1a]"><Trans comment="Heading for creating a restricted share link">Create restricted share link</Trans></h3>

          <div>
            <label htmlFor="share-link-expiration" className="text-sm text-[#888]"><Trans comment="Label for share link expiration setting">Expiration</Trans></label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button id="share-link-expiration" variant="outline" className="w-full justify-between mt-1">
                  {newLinkOptions.expiresInDays
                    ? <Plural value={newLinkOptions.expiresInDays} one="# day" other="# days" comment="Share link expiration duration in days" />
                    : <Trans comment="Share link expiration: never expires">Never</Trans>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    setNewLinkOptions((o) => ({ ...o, expiresInDays: undefined }))
                  }
                >
                  <Trans comment="Share link expiration: never expires">Never</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setNewLinkOptions((o) => ({ ...o, expiresInDays: 1 }))
                  }
                >
                  <Trans comment="Share link expiration: 1 day">1 day</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setNewLinkOptions((o) => ({ ...o, expiresInDays: 7 }))
                  }
                >
                  <Trans comment="Share link expiration: 7 days">7 days</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setNewLinkOptions((o) => ({ ...o, expiresInDays: 30 }))
                  }
                >
                  <Trans comment="Share link expiration: 30 days">30 days</Trans>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label htmlFor="share-link-password" className="text-sm text-[#888]"><Trans comment="Label for optional password field on share link">Password (optional)</Trans></label>
            <Input
              id="share-link-password"
              type="password"
              placeholder={t({ message: "Leave empty for no password", comment: "Placeholder for share link password input" })}
              value={newLinkOptions.password || ""}
              onChange={(e) =>
                setNewLinkOptions((o) => ({
                  ...o,
                  password: e.target.value || undefined,
                }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="share-link-email" className="text-sm text-[#888]"><Trans comment="Label for optional email field to restrict share link access">Restrict to email (optional)</Trans></label>
            <Input
              id="share-link-email"
              type="email"
              placeholder={t({ message: "recipient@example.com", comment: "Placeholder for share link email restriction input" })}
              value={newLinkOptions.email || ""}
              onChange={(e) =>
                setNewLinkOptions((o) => ({
                  ...o,
                  email: e.target.value || undefined,
                }))
              }
              className="mt-1"
            />
          </div>

          <Button onClick={handleCreateLink} disabled={createShareLinkMutation.isPending} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {createShareLinkMutation.isPending ? <Trans comment="Button text while creating a share link">Creating...</Trans> : <Trans comment="Button to create a restricted share link">Create restricted link</Trans>}
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-bold text-sm text-[#1a1a1a]"><Trans comment="Heading for list of restricted share links">Restricted links</Trans></h3>
          {shareLinks === undefined ? (
            <p className="text-sm text-[#888]"><Trans comment="Loading indicator for share links">Loading...</Trans></p>
          ) : shareLinks.length === 0 ? (
            <p className="text-sm text-[#888]"><Trans comment="Empty state when no share links exist">No share links yet</Trans></p>
          ) : (
            <div className="space-y-2">
              {shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border-2 border-[#1a1a1a]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-[#e8e8e0] px-2 py-0.5 font-mono truncate max-w-[200px]">
                        /share/{link.token}
                      </code>
                      {link.isExpired ? (
                        <Badge variant="destructive"><Trans comment="Badge for expired share link">Expired</Trans></Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#888]">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <Plural value={link.viewCount} one="# view" other="# views" comment="Number of views on a share link" />
                      </span>
                      {link.hasPassword ? (
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <Trans comment="Indicator that share link is password-protected">Protected</Trans>
                        </span>
                      ) : null}
                      {link.restrictedEmail ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {link.restrictedEmail}
                        </span>
                      ) : null}
                      {link.expiresAt ? (
                        <span>
                          <Trans comment="Share link expiration time">Expires {formatRelativeTime(new Date(link.expiresAt).getTime())}</Trans>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyLink(link.token)}
                      aria-label={t({message: "Copy link", comment: "Aria label for copy share link button"})}
                    >
                      {copiedId === link.token ? (
                        <Check className="h-4 w-4 text-[#2d5a2d]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`/share/${link.token}`, "_blank")}
                      aria-label={t({message: "Open link", comment: "Aria label for open share link button"})}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#dc2626] hover:text-[#dc2626]"
                      onClick={() => handleDeleteLink(link.id)}
                      aria-label={t({message: "Delete link", comment: "Aria label for delete share link button"})}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
