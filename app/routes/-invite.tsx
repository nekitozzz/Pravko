
import { useLogto } from "@logto/react";
import api from "@/lib/api";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { PRODUCT_NAME } from "@/lib/product";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, Mail, Check } from "lucide-react";
import { teamHomePath } from "@/lib/routes";
import { useInviteData } from "./-invite.data";

export default function InvitePage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate({});
  const token = params.token as string;
  const { isAuthenticated, isLoading, getIdTokenClaims } = useLogto();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  useEffect(() => {
    if (!isAuthenticated) return;
    getIdTokenClaims().then((c) => setUserEmail(c?.email as string | undefined)).catch(() => {});
  }, [isAuthenticated, getIdTokenClaims]);
  const isUserLoaded = !isLoading;

  const { invite } = useInviteData({ token });

  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      const result = await api.teams.acceptInvite(token);
      if (result?.id) {
        navigate({ to: teamHomePath(result.id) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t({message: "Failed to accept invite", comment: "Fallback error when accepting invite fails"}));
    } finally {
      setIsAccepting(false);
    }
  };

  if (invite === undefined || !isUserLoaded) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center">
        <div className="text-[#888]"><Trans comment="Loading state for invite page">Loading...</Trans></div>
      </div>
    );
  }

  if (invite === null) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#dc2626]/10 flex items-center justify-center mb-4 border-2 border-[#dc2626]">
              <AlertCircle className="h-6 w-6 text-[#dc2626]" />
            </div>
            <CardTitle><Trans comment="Title when invite link is invalid or expired">Invalid or expired invite</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when invite link is invalid">This invite link is no longer valid. Please ask for a new invitation.</Trans>
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

  // User not signed in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-4 border-2 border-[#1a1a1a]">
              <Users className="h-6 w-6 text-[#888]" />
            </div>
            <CardTitle><Trans comment="Invite page title">You&apos;re invited to {invite.teamName}</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Invite description with inviter name and role">{invite.invitedByName} has invited you to join as a {invite.role}.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-[#e8e8e0] border-2 border-[#1a1a1a] flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#888]" />
              <div>
                <p className="text-sm text-[#888]"><Trans comment="Label for invited email address">Invited email</Trans></p>
                <p className="font-bold text-[#1a1a1a]">{invite.email}</p>
              </div>
            </div>
            <p className="text-sm text-[#888] text-center">
              <Trans comment="Instruction to sign in with invited email">Sign in with the email address above to accept this invite.</Trans>
            </p>
            <a href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`} className="block">
              <Button className="w-full"><Trans comment="Button to sign in and accept invite">Sign in to accept</Trans></Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User signed in but with different email
  if (userEmail && invite.email && userEmail !== invite.email) {
    return (
      <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#ca8a04]/10 flex items-center justify-center mb-4 border-2 border-[#ca8a04]">
              <AlertCircle className="h-6 w-6 text-[#ca8a04]" />
            </div>
            <CardTitle><Trans comment="Title when signed-in email differs from invite email">Different email address</Trans></CardTitle>
            <CardDescription>
              <Trans comment="Description when signed-in email differs from invite email">This invite was sent to {invite.email}, but you&apos;re signed in as {userEmail}.</Trans>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#888] text-center">
              <Trans comment="Instruction to sign in with correct email">Please sign in with the correct email address to accept this invite.</Trans>
            </p>
            <a href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`} className="block">
              <Button className="w-full" variant="outline">
                <Trans comment="Button to sign in with a different account">Sign in with different account</Trans>
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User signed in with correct email
  return (
    <div className="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-4 border-2 border-[#1a1a1a]">
            <Users className="h-6 w-6 text-[#888]" />
          </div>
          <CardTitle><Trans comment="Join team title">Join {invite.teamName}</Trans></CardTitle>
          <CardDescription>
            <Trans comment="Invite description with inviter name and role badge">{invite.invitedByName} has invited you to join as a <Badge variant="secondary">{invite.role}</Badge></Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-[#dc2626]/10 text-[#dc2626] border-2 border-[#dc2626] text-sm">
              {error}
            </div>
          )}
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Trans comment="Button text while accepting invite">Joining...</Trans>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                <Trans comment="Button to accept team invitation">Accept invitation</Trans>
              </>
            )}
          </Button>
          <Link to="/" preload="intent" className="block">
            <Button variant="ghost" className="w-full">
              <Trans comment="Button to decline team invitation">Decline</Trans>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
