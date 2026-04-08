import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Trash2, Check, Pencil, ArrowUpRight } from "lucide-react";
import { MemberInvite, getRoleLabel } from "@/components/teams/MemberInvite";
import { dashboardHomePath, teamHomePath } from "@/lib/routes";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { useSettingsData } from "./-settings.data";
import { prewarmTeam } from "./-team.data";
import { DashboardHeader } from "@/components/DashboardHeader";
import api from "@/lib/api";
import { UpgradeRequestDialog } from "@/components/UpgradeRequestDialog";

type BillingPlan = "basic" | "pro";

const GIBIBYTE = 1024 ** 3;
const TEBIBYTE = 1024 ** 4;
const TEAM_TRIAL_DAYS = 7;

const BILLING_PLANS: Record<
  BillingPlan,
  {
    label: string;
    monthlyPriceRub: number;
    storageLimitBytes: number;
    seats: string;
  }
> = {
  basic: {
    label: "Basic",
    monthlyPriceRub: 800,
    storageLimitBytes: 100 * GIBIBYTE,
    seats: "Unlimited",
  },
  pro: {
    label: "Pro",
    monthlyPriceRub: 3700,
    storageLimitBytes: TEBIBYTE,
    seats: "Unlimited",
  },
};

function normalizeTeamPlan(plan: string): BillingPlan {
  return plan === "pro" || plan === "team" ? "pro" : "basic";
}

function formatBytes(bytes: number): string {
  if (bytes >= TEBIBYTE) return `${(bytes / TEBIBYTE).toFixed(1)} TB`;
  return `${(bytes / GIBIBYTE).toFixed(1)} GB`;
}

function formatUtcDateFromUnixSeconds(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function getPlanLabel(planId: BillingPlan): string {
  switch (planId) {
    case "basic":
      return t({message: "Basic", comment: "Basic billing plan label"});
    case "pro":
      return t({message: "Pro", comment: "Pro billing plan label"});
  }
}

function getPlanSeats(planId: BillingPlan): string {
  return BILLING_PLANS[planId].seats === "Unlimited"
    ? t({message: "Unlimited", comment: "Unlimited seats label"})
    : BILLING_PLANS[planId].seats;
}

function getSubscriptionStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return t({message: "Active", comment: "Subscription status: active"});
    case "trialing":
      return t({message: "Trialing", comment: "Subscription status: trialing"});
    case "past_due":
      return t({message: "Past due", comment: "Subscription status: payment overdue"});
    case "canceled":
      return t({message: "Canceled", comment: "Subscription status: canceled"});
    case "refunded":
      return t({message: "Refunded", comment: "Subscription status: refunded"});
    case "not_subscribed":
      return t({message: "Not subscribed", comment: "Subscription status: no subscription"});
    default:
      return status;
  }
}

export default function TeamSettingsPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate({});
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();
  const teamId = typeof params.teamId === "string" ? params.teamId : "";

  const { context, team, members, billing } = useSettingsData({ teamId });

  const updateTeamMutation = useMutation({
    mutationFn: (body: { name: string }) => api.teams.update(team!.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: () => api.teams.delete(team!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [isCheckingOutPlan, setIsCheckingOutPlan] = useState<BillingPlan | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const prewarmTeamIntentHandlers = useRoutePrewarmIntent(() => {
    if (!team?.id) return;
    return prewarmTeam({ teamId: team.id });
  });

  const canonicalSettingsPath = context ? `${context.canonicalPath}/settings` : null;
  const isSettingsPath = pathname.endsWith("/settings");
  const shouldCanonicalize =
    isSettingsPath && !!canonicalSettingsPath && pathname !== canonicalSettingsPath;

  useEffect(() => {
    if (shouldCanonicalize && canonicalSettingsPath) {
      navigate({ to: canonicalSettingsPath, replace: true });
    }
  }, [shouldCanonicalize, canonicalSettingsPath, navigate]);

  if (context === undefined || shouldCanonicalize) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#888]"><Trans comment="Loading state for settings page">Loading...</Trans></div>
      </div>
    );
  }

  if (context === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#888]"><Trans comment="Team not found error">Team not found</Trans></div>
      </div>
    );
  }

  const isOwner = team!.role === "owner";
  const isAdmin = team!.role === "owner" || team!.role === "admin";
  const plan = billing?.plan ? normalizeTeamPlan(billing.plan) : normalizeTeamPlan(team!.plan);
  const planConfig = BILLING_PLANS[plan];
  const hasActiveSubscription = billing?.hasActiveSubscription ?? false;
  const subscriptionStatus = billing?.subscriptionStatus ?? "not_subscribed";
  const isTrialing = subscriptionStatus === "trialing";
  const isCanceled = billing?.canceledAt != null;
  const monthlyPrice = billing?.monthlyPriceRub ?? planConfig.monthlyPriceRub;
  const currentPlanLabel = hasActiveSubscription ? getPlanLabel(plan) : t({message: "Unpaid", comment: "Team has no active subscription"});
  const canDeleteTeam = isOwner && !hasActiveSubscription;

  const storageUsed = billing?.storageUsedBytes ?? 0;
  const storageLimit = planConfig.storageLimitBytes;
  const storagePct =
    storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0;

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    try {
      await updateTeamMutation.mutateAsync({ name: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update team name:", error);
    }
  };

  const handleDeleteTeam = async () => {
    if (hasActiveSubscription) {
      setBillingError(
        t({message: "Cancel the team's active subscription in billing before deleting this team.", comment: "Error when trying to delete team with active subscription"}),
      );
      return;
    }

    if (
      !confirm(
        t({message: "Are you sure you want to delete this team? This action cannot be undone and will delete all projects and videos.", comment: "Confirm dialog for team deletion"}),
      )
    ) {
      return;
    }

    if (!confirm(t({message: "Type the team name to confirm: ", comment: "Confirm dialog asking user to type team name"}) + team!.name)) return;

    try {
      await deleteTeamMutation.mutateAsync();
      navigate({ to: dashboardHomePath() });
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  const handleCancelSubscription = async () => {
    const periodEndStr = typeof billing?.currentPeriodEnd === "number"
      ? formatUtcDateFromUnixSeconds(billing.currentPeriodEnd)
      : "";
    const confirmMsg = periodEndStr
      ? t({message: `Are you sure you want to cancel your subscription? You will keep access until ${periodEndStr}.`, comment: "Confirm dialog for subscription cancellation with period end"})
      : t({message: "Are you sure you want to cancel your subscription?", comment: "Confirm dialog for subscription cancellation"});
    if (!confirm(confirmMsg)) {
      return;
    }

    setBillingError(null);
    setIsCanceling(true);
    try {
      await api.billing.cancelSubscription(team!.id);
      queryClient.invalidateQueries({ queryKey: ["billing", teamId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", teamId] });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t({message: "Unable to cancel subscription.", comment: "Fallback error when subscription cancellation fails"});
      setBillingError(message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleStartCheckout = async (targetPlan: BillingPlan) => {
    if (typeof window === "undefined") return;
    setBillingError(null);
    setIsCheckingOutPlan(targetPlan);

    try {
      const settingsPath = canonicalSettingsPath ?? `/dashboard/${team!.id}/settings`;
      const successUrl = `${window.location.origin}${settingsPath}?billing=success`;
      const cancelUrl = `${window.location.origin}${settingsPath}?billing=cancel`;
      const session = await api.billing.createSubscriptionCheckout(team!.id, {
        plan: targetPlan,
        successUrl,
        cancelUrl,
      });

      if (!session.url) {
        throw new Error("Checkout did not return a redirect URL.");
      }

      window.location.assign(session.url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t({message: "Unable to start checkout.", comment: "Fallback error when billing checkout fails"});
      setBillingError(message);
    } finally {
      setIsCheckingOutPlan(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <DashboardHeader
        paths={[
          {
            label: team!.name,
            href: teamHomePath(team!.id),
            prewarmIntentHandlers: prewarmTeamIntentHandlers,
          },
          { label: t({message: "Settings", comment: "Settings breadcrumb label"}) },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
          <div className="mb-8">
            {isEditingName ? (
              <div className="flex items-center gap-3">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-4xl font-black tracking-tight h-auto py-1 px-2 border-b-2 border-[#1a1a1a] border-t-0 border-l-0 border-r-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                />
                <Button size="sm" onClick={() => void handleSaveName()}>
                  <Trans comment="Save team name button">Save</Trans>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                >
                  <Trans comment="Cancel editing team name">Cancel</Trans>
                </Button>
              </div>
            ) : (
              <div className="flex items-baseline gap-3 group">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[#1a1a1a]">
                  {team!.name}
                </h1>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditedName(team!.name);
                      setIsEditingName(true);
                    }}
                    className="text-[#888] hover:text-[#1a1a1a] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm font-mono text-[#888] mt-1">
              {typeof window !== "undefined"
                ? `${window.location.origin}${teamHomePath(team!.id)}`
                : teamHomePath(team!.id)}
            </p>
          </div>

          <div className="border-t-2 border-b-2 border-[#1a1a1a] py-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">
                <Trans comment="Billing plan label">Plan</Trans>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#1a1a1a]">
                  {currentPlanLabel}
                </span>
                {hasActiveSubscription ? (
                  isCanceled ? (
                    <Badge variant="warning"><Trans comment="Subscription canceled badge">Canceled</Trans></Badge>
                  ) : (
                    <Badge variant={isTrialing ? "warning" : "success"}>
                      {isTrialing ? <Trans comment="Subscription trialing badge">Trialing</Trans> : <Trans comment="Subscription active badge">Active</Trans>}
                    </Badge>
                  )
                ) : (
                  <Badge variant="warning">{getSubscriptionStatusLabel(subscriptionStatus)}</Badge>
                )}
              </div>
              {isCanceled && hasActiveSubscription && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#888] italic">
                    <Trans comment="Sympathy message after subscription cancellation">We're sorry to see you go</Trans>
                  </p>
                  {typeof billing?.currentPeriodEnd === "number" && (
                    <p className="text-xs font-bold text-[#1a1a1a]">
                      <Trans comment="Subscription valid until date after cancellation">Active until {formatUtcDateFromUnixSeconds(billing.currentPeriodEnd)}</Trans>
                    </p>
                  )}
                </div>
              )}
              {!isCanceled && hasActiveSubscription && !isTrialing && typeof billing?.currentPeriodEnd === "number" && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-[#888]">
                    <Trans comment="Next payment date display">Next payment: {formatUtcDateFromUnixSeconds(billing.currentPeriodEnd)}</Trans>
                  </p>
                  <p className="text-xs font-bold text-[#1a1a1a]">
                    {monthlyPrice} ₽
                  </p>
                </div>
              )}
              {!isCanceled && isTrialing && typeof billing?.currentPeriodEnd === "number" && (
                <p className="text-xs text-[#888] mt-2">
                  <Trans comment="Trial days remaining display">{Math.max(0, Math.ceil((billing.currentPeriodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining</Trans>
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">
                <Trans comment="Storage usage label">Storage</Trans>
              </p>
              <p className="text-xl font-black text-[#1a1a1a]">
                {billing ? formatBytes(storageUsed) : "—"}
                <span className="text-sm font-bold text-[#888]">
                  {" "}
                  / {formatBytes(storageLimit)}
                </span>
              </p>
              <div className="h-1.5 bg-[#ddd] mt-2">
                <div
                  className="h-full bg-[#2d5a2d] transition-all duration-500"
                  style={{ width: `${storagePct}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">
                <Trans comment="Team seats label">Seats</Trans>
              </p>
              <p className="text-xl font-black text-[#1a1a1a]">
                {getPlanSeats(plan)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-3">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#888] mb-4">
                <Trans comment="Billing plans section heading">Plans</Trans>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(BILLING_PLANS) as BillingPlan[]).map((planId) => {
                  const config = BILLING_PLANS[planId];
                  const isCurrentPlan = planId === plan && hasActiveSubscription;
                  return (
                    <div
                      key={planId}
                      className={`border-2 p-5 transition-colors ${
                        isCurrentPlan
                          ? "border-[#2d5a2d] bg-[#f0f0e8]"
                          : "border-[#1a1a1a] bg-[#f0f0e8] hover:border-[#2d5a2d]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p
                          className={`text-sm font-bold uppercase tracking-wider ${isCurrentPlan ? "text-[#2d5a2d]" : "text-[#888]"}`}
                        >
                          {getPlanLabel(planId)}
                        </p>
                        {isCurrentPlan && (
                          <Check className="h-4 w-4 text-[#2d5a2d]" />
                        )}
                      </div>
                      <p
                        className="text-3xl font-black text-[#1a1a1a]"
                      >
                        {config.monthlyPriceRub} ₽
                        <span
                          className="text-sm font-bold text-[#888]"
                        >
                          <Trans comment="Monthly price suffix">/mo</Trans>
                        </span>
                      </p>
                      <div
                        className={`text-sm mt-3 space-y-0.5 ${isCurrentPlan ? "text-[#1a1a1a]" : "text-[#888]"}`}
                      >
                        <p><Trans comment="Plan seats count">{getPlanSeats(planId)} seats</Trans></p>
                        <p><Trans comment="Plan storage limit">{formatBytes(config.storageLimitBytes)} storage</Trans></p>
                      </div>
                      {isOwner && !hasActiveSubscription && (
                        <Button
                          variant={planId === "pro" ? "primary" : "default"}
                          className="w-full mt-4 whitespace-normal text-xs"
                          disabled={isCheckingOutPlan !== null}
                          onClick={() => void handleStartCheckout(planId)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {isCheckingOutPlan === planId
                            ? <Trans comment="Redirecting to checkout">Redirecting...</Trans>
                            : <Trans comment="Start billing plan trial button">Start {getPlanLabel(planId)} Trial</Trans>}
                        </Button>
                      )}
                      {isOwner && hasActiveSubscription && !isCurrentPlan && (
                        <Button
                          variant={planId === "pro" ? "primary" : "default"}
                          className="w-full mt-4 whitespace-normal text-xs"
                          disabled={isCheckingOutPlan !== null}
                          onClick={() => void handleStartCheckout(planId)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {isCheckingOutPlan === planId
                            ? <Trans comment="Redirecting to checkout">Redirecting...</Trans>
                            : planId === "pro"
                              ? <Trans comment="Upgrade to Pro plan button">Upgrade to {getPlanLabel(planId)}</Trans>
                              : <Trans comment="Switch to Basic plan button">Switch to {getPlanLabel(planId)}</Trans>}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {billingError && (
                <p className="text-sm font-bold text-[#dc2626] mt-3">
                  {billingError}
                </p>
              )}

              {hasActiveSubscription && !isCanceled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setUpgradeDialogOpen(true)}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  <Trans comment="Request plan upgrade button">Request more</Trans>
                </Button>
              )}

              {!hasActiveSubscription && (
                <p className="text-sm text-[#888] mt-3">
                  <Trans comment="Subscription required info message">An active subscription is required to create projects and upload videos. Eligible teams receive a {TEAM_TRIAL_DAYS}-day trial before billing starts.</Trans>
                </p>
              )}

              {isOwner && hasActiveSubscription && !isCanceled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  disabled={isCanceling}
                  onClick={() => void handleCancelSubscription()}
                >
                  {isCanceling
                    ? <Trans comment="Canceling subscription in progress">Canceling...</Trans>
                    : <Trans comment="Cancel subscription button">Cancel subscription</Trans>}
                </Button>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#888]">
                  <Trans comment="Team members section heading">Members</Trans>
                  <span className="ml-2 text-[#1a1a1a]">
                    {members?.length || 0}
                  </span>
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setMemberDialogOpen(true)}
                    className="text-xs font-bold uppercase tracking-wider text-[#2d5a2d] hover:text-[#3a6a3a] underline underline-offset-2"
                  >
                    <Trans comment="Invite team member button">+ Invite</Trans>
                  </button>
                )}
              </div>

              <div className="border-t-2 border-[#1a1a1a]">
                {members?.slice(0, 8).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 border-b border-[#ccc]"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#1a1a1a] truncate">
                        {member.userName}
                      </p>
                      <p className="text-xs text-[#888] truncate">
                        {member.userEmail}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] shrink-0 ml-3">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                ))}
                {members && members.length > 8 && (
                  <button
                    onClick={() => setMemberDialogOpen(true)}
                    className="text-xs text-[#888] hover:text-[#1a1a1a] py-3 underline"
                  >
                    <Trans comment="Show more team members link">+{members.length - 8} more</Trans>
                  </button>
                )}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="border-t-2 border-[#dc2626]/30 mt-16 pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#1a1a1a]">
                  <Trans comment="Delete team section heading">Delete team</Trans>
                </p>
                <p className="text-xs text-[#888] mt-0.5">
                  {canDeleteTeam
                    ? <Trans comment="Delete team warning when allowed">Permanently remove this team, all projects, and videos.</Trans>
                    : <Trans comment="Delete team warning when subscription active">Cancel the active subscription before deleting this team.</Trans>}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteTeam}
                disabled={!canDeleteTeam}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <Trans comment="Delete team button">Delete</Trans>
              </Button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <MemberInvite
          teamId={team!.id}
          open={memberDialogOpen}
          onOpenChange={setMemberDialogOpen}
        />
      )}

      <UpgradeRequestDialog
        teamId={team!.id}
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  );
}
