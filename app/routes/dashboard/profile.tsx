import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Check, Loader2, Lock } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { DashboardHeader } from "@/components/DashboardHeader";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function processAvatarImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - size) / 2;
      const sy = (img.naturalHeight - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/webp",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => api.users.getProfile(),
  });

  const [name, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCacheBust, setAvatarCacheBust] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const currentName = name ?? profile?.name ?? "";

  const handleSaveName = async () => {
    if (!currentName.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.users.syncProfile({ name: currentName.trim() });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setSaved(true);
      setName(null);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return;

    setAvatarUploading(true);
    try {
      const processed = await processAvatarImage(file);

      const { uploadUrl, avatarUrl } = await api.users.getAvatarUploadUrl({
        contentType: "image/webp",
      });

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: processed,
      });

      await api.users.syncProfile({ avatarUrl });
      setAvatarCacheBust(`?v=${Date.now()}`);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 8) {
      setPasswordError(t({message: "Password must be at least 8 characters", comment: "Password validation error"}));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t({message: "Passwords do not match", comment: "Password mismatch error"}));
      return;
    }

    setPasswordSaving(true);
    try {
      await api.users.changePassword({ password: newPassword });
      setPasswordSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : t({message: "Failed to change password", comment: "Generic password change error"})
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <DashboardHeader paths={[{ label: t({message: "profile", comment: "Profile breadcrumb label"}) }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#888] font-mono"><Trans comment="Loading profile state">Loading...</Trans></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <DashboardHeader paths={[{ label: t({message: "profile", comment: "Profile breadcrumb label"}) }]} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg space-y-8">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle><Trans comment="Profile avatar section title">Avatar</Trans></CardTitle>
              <CardDescription>
                <Trans comment="Profile avatar section description">Click to upload a new profile picture.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <button
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                <Avatar className="h-24 w-24 rounded-none border-2 border-[#1a1a1a]">
                  <AvatarImage src={profile?.avatarUrl ? `${profile.avatarUrl}${avatarCacheBust}` : undefined} />
                  <AvatarFallback className="rounded-none text-2xl font-black">
                    {getInitials(currentName || profile?.email || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Name */}
          <Card>
            <CardHeader>
              <CardTitle><Trans comment="Profile name section title">Display name</Trans></CardTitle>
              <CardDescription>
                <Trans comment="Profile name section description">This is how others will see you in teams.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={currentName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t({message: "Your name", comment: "Name input placeholder"})}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={saving || !currentName.trim() || currentName.trim() === profile?.name}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <><Check className="mr-1.5 h-4 w-4" /><Trans comment="Saved confirmation">Saved</Trans></>
                  ) : (
                    <Trans comment="Save button label">Save</Trans>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle><Trans comment="Profile email section title">Email</Trans></CardTitle>
              <CardDescription>
                <Trans comment="Profile email section description">Your email is managed by the authentication provider.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={profile?.email ?? ""}
                disabled
                className="bg-[#e8e8e0]"
              />
            </CardContent>
          </Card>

          {/* Password */}
          {profile?.canChangePassword && (
            <Card>
              <CardHeader>
                <CardTitle><Trans comment="Password section title">Password</Trans></CardTitle>
                <CardDescription>
                  <Trans comment="Password section description">Change your account password.</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t({message: "New password", comment: "New password input placeholder"})}
                    autoComplete="new-password"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t({message: "Confirm password", comment: "Confirm password input placeholder"})}
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p className="text-sm text-[#dc2626]">{passwordError}</p>
                  )}
                  <Button type="submit" disabled={passwordSaving || !newPassword}>
                    {passwordSaving ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : passwordSaved ? (
                      <><Check className="mr-1.5 h-4 w-4" /><Trans comment="Password saved confirmation">Updated</Trans></>
                    ) : (
                      <><Lock className="mr-1.5 h-4 w-4" /><Trans comment="Change password button">Change password</Trans></>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
