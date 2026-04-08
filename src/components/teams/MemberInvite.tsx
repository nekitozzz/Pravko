"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, Check, UserPlus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

interface MemberInviteProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Role = "admin" | "member" | "viewer";

export function getRoleLabel(role: Role | string): string {
  const labels: Record<string, string> = {
    owner: t({message: "Owner", comment: "Team role: team owner"}),
    admin: t({message: "Admin", comment: "Team role: administrator"}),
    member: t({message: "Member", comment: "Team role: regular member"}),
    viewer: t({message: "Viewer", comment: "Team role: read-only viewer"}),
  };
  return labels[role] ?? role;
}

export function MemberInvite({ teamId, open, onOpenChange }: MemberInviteProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => api.teams.getMembers(teamId),
    enabled: open,
  });

  const { data: invites } = useQuery({
    queryKey: ["team-invites", teamId],
    queryFn: () => api.teams.getInvites(teamId),
    enabled: open,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const result = await api.teams.inviteMember(teamId, {
        email: email.trim(),
        role,
      });
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      setInviteLink(`${baseUrl}/invite/${result.token}`);
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["team-invites", teamId] });
    } catch (error) {
      console.error("Failed to invite member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await api.teams.revokeInvite(teamId, inviteId);
      queryClient.invalidateQueries({ queryKey: ["team-invites", teamId] });
    } catch (error) {
      console.error("Failed to revoke invite:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.teams.removeMember(teamId, userId);
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    try {
      await api.teams.updateMemberRole(teamId, userId, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle><Trans comment="Dialog title for team member management">Team members</Trans></DialogTitle>
          <DialogDescription>
            <Trans comment="Description in team members dialog">Invite new members or manage existing ones.</Trans>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t({message: "Email address", comment: "Placeholder for email input in team invite"})}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-auto min-w-28">
                  {getRoleLabel(role)}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRole("admin")}>
                  <Trans comment="Admin role option in dropdown">Admin</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRole("member")}>
                  <Trans comment="Member role option in dropdown">Member</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRole("viewer")}>
                  <Trans comment="Viewer role option in dropdown">Viewer</Trans>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button type="submit" disabled={!email.trim() || isLoading} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            {isLoading ? <Trans comment="Loading state for send invite button">Sending...</Trans> : <Trans comment="Submit button to send team invite">Send invite</Trans>}
          </Button>
        </form>

        {inviteLink && (
          <div className="border-2 border-[#1a1a1a] bg-[#e8e8e0] p-3">
            <p className="text-sm text-[#888] mb-2">
              <Trans comment="Instruction to share invite link">Share this link with the invitee:</Trans>
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                aria-label={t({message: "Copy invite link", comment: "Aria label for copy invite link button"})}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-bold text-[#1a1a1a]"><Trans comment="Heading for current team members list">Current members</Trans></h4>
          <div className="space-y-2">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 border-2 border-[#1a1a1a]"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.userAvatarUrl} />
                    <AvatarFallback>
                      {getInitials(member.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1a]">{member.userName}</p>
                    <p className="text-xs text-[#888]">{member.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "owner" ? (
                    <Badge variant="secondary"><Trans comment="Badge for team owner role">Owner</Trans></Badge>
                  ) : (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {getRoleLabel(member.role)}
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member.userId, "admin")}
                          >
                            <Trans comment="Admin role option in member role dropdown">Admin</Trans>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member.userId, "member")}
                          >
                            <Trans comment="Member role option in member role dropdown">Member</Trans>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member.userId, "viewer")}
                          >
                            <Trans comment="Viewer role option in member role dropdown">Viewer</Trans>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#dc2626] hover:text-[#dc2626] hover:bg-[#dc2626]/10"
                        onClick={() => handleRemoveMember(member.userId)}
                        aria-label={t({message: "Remove member", comment: "Aria label for remove team member button"})}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {invites && invites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#1a1a1a]"><Trans comment="Heading for pending team invites list">Pending invites</Trans></h4>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-2 border-2 border-[#1a1a1a] bg-[#e8e8e0]"
                >
                  <div>
                    <p className="text-sm text-[#1a1a1a]">{invite.email}</p>
                    <p className="text-xs text-[#888]">
                      <Trans comment="Shows what role was assigned in invite">Invited as {getRoleLabel(invite.role)}</Trans>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline"><Trans comment="Badge showing invite is pending">Pending</Trans></Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#dc2626] hover:text-[#dc2626] hover:bg-[#dc2626]/10"
                      onClick={() => handleRevokeInvite(invite.id)}
                      aria-label={t({message: "Revoke invite", comment: "Aria label for revoke team invite button"})}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
