import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, ArrowRight, Folder, Mail } from "lucide-react";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { teamHomePath, teamSettingsPath, projectPath } from "@/lib/routes";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { prewarmProject } from "./-project.data";
import { useDashboardIndexData } from "./-index.data";
import { DashboardHeader } from "@/components/DashboardHeader";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

type DashboardProjectCardProps = {
  teamId: string;
  project: {
    id: string;
    name: string;
    videoCount: number;
  };
  onOpen: () => void;
};

function formatTeamPlanLabel(
  plan: string,
  hasActiveSubscription?: boolean,
) {
  if (!hasActiveSubscription) {
    return t({message: "Unpaid", comment: "Team billing status label when subscription is unpaid"});
  }
  if (plan === "pro" || plan === "team") return t({message: "Pro", comment: "Team plan label for pro tier"});
  return t({message: "Basic", comment: "Team plan label for basic tier"});
}

function DashboardProjectCard({
  teamId,
  project,
  onOpen,
}: DashboardProjectCardProps) {
  const prewarmIntentHandlers = useRoutePrewarmIntent(() =>
    prewarmProject({
      teamId,
      projectId: project.id,
    }),
  );

  return (
    <Card
      className="group cursor-pointer hover:bg-[#e8e8e0] transition-colors"
      onClick={onOpen}
      {...prewarmIntentHandlers}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{project.name}</CardTitle>
          <CardDescription className="mt-1">
            <Plural value={project.videoCount} one="# video" other="# videos" comment="Video count in project card" />
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-[#888] group-hover:text-[#1a1a1a] transition-colors">
          <span><Trans comment="Project card link text">Open project</Trans></span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { teams, pendingInvites } = useDashboardIndexData();
  const navigate = useNavigate({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isLoading = teams === undefined;

  // Empty state - no teams
  if (teams && teams.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <DashboardHeader paths={[{ label: t({message: "dashboard", comment: "Dashboard breadcrumb label"}) }]} />

        <div className="flex-1 flex items-center justify-center p-8 animate-in fade-in duration-300">
          <Card className="max-w-sm w-full text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-[#888]" />
              </div>
              <CardTitle className="text-lg"><Trans comment="Empty state title when user has no teams">Create your first team</Trans></CardTitle>
              <CardDescription>
                <Trans comment="Empty state description when user has no teams">Teams help you organize projects and collaborate on video reviews.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                <Trans comment="Button to create first team in empty state">Create a team</Trans>
              </Button>
            </CardContent>
          </Card>
        </div>

        <CreateTeamDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <DashboardHeader paths={[{ label: t({message: "dashboard", comment: "Dashboard breadcrumb label"}) }]}>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          <Trans comment="Button to create a new team in dashboard header">New team</Trans>
        </Button>
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6 space-y-12">
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.token}
                className="flex items-center gap-4 p-4 bg-[#2d5a2d]/5 border-2 border-[#2d5a2d] animate-in fade-in duration-300"
              >
                <Mail className="h-5 w-5 text-[#2d5a2d] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a1a1a]">
                    <Trans comment="Pending invite banner text with team name and role">
                      {invite.invitedByName ?? <Trans comment="Fallback for unknown inviter">Someone</Trans>} invited you to <strong>{invite.teamName}</strong> as {invite.role}
                    </Trans>
                  </p>
                </div>
                <Link to={`/invite/${invite.token}`}>
                  <Button size="sm">
                    <Trans comment="Button to view and accept a pending invite">View invite</Trans>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        >
          {teams?.map((team) => {
            if (!team) return null;
            return (
              <div key={team.id} className="mb-12 last:mb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-[#1a1a1a]">{team.name}</h2>
                    <Badge variant="secondary">
                      {formatTeamPlanLabel(team.plan)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      to={teamSettingsPath(team.id)}
                      className="text-[#888] hover:text-[#1a1a1a] text-sm font-bold transition-colors"
                    >
                      <Trans comment="Link to team billing settings">Billing</Trans>
                    </Link>
                    <Link
                      to={teamHomePath(team.id)}
                      className="text-[#888] hover:text-[#1a1a1a] text-sm font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trans comment="Link to team management page">Manage team</Trans> <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {team.projects.length === 0 ? (
                  <Card className="max-w-sm text-center">
                    <CardHeader>
                      <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-2">
                        <Folder className="h-6 w-6 text-[#888]" />
                      </div>
                      <CardTitle className="text-lg"><Trans comment="Empty state title when team has no projects">No projects yet</Trans></CardTitle>
                      <CardDescription>
                        <Trans comment="Empty state description when team has no projects">Head over to the team page to create your first project.</Trans>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate({ to: teamHomePath(team.id) })}
                      >
                        <Trans comment="Button to navigate to team page from empty project state">Open team</Trans>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {team.projects.map((project) => (
                      <DashboardProjectCard
                        key={project.id}
                        teamId={team.id}
                        project={project}
                        onOpen={() => navigate({ to: projectPath(team.id, project.id) })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
