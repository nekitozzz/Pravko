
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trans, Plural } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Folder, Plus, MoreVertical, Trash2, Users, ArrowRight, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberInvite } from "@/components/teams/MemberInvite";
import { cn } from "@/lib/utils";
import { projectPath, teamSettingsPath } from "@/lib/routes";
import api from "@/lib/api";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { prewarmProject } from "./-project.data";
import { useTeamData } from "./-team.data";
import { DashboardHeader } from "@/components/DashboardHeader";

type TeamProjectCardProps = {
  teamId: string;
  project: {
    id: string;
    name: string;
    videoCount?: number;
  };
  canCreateProject: boolean;
  onOpen: () => void;
  onDelete: (projectId: string) => void;
};

function TeamProjectCard({
  teamId,
  project,
  canCreateProject,
  onOpen,
  onDelete,
}: TeamProjectCardProps) {
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
            <Plural value={project.videoCount ?? 0} one="# video" other="# videos" comment="Number of videos in a project" />
          </CardDescription>
        </div>
        {canCreateProject && (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-[#dc2626] focus:text-[#dc2626]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <Trans comment="Menu item to delete a project">Delete</Trans>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-[#888] group-hover:text-[#1a1a1a] transition-colors">
          <span><Trans comment="Link text to open a project">Open project</Trans></span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate({});
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();
  const teamId = typeof params.teamId === "string" ? params.teamId : "";

  const { context, team, projects, billing } = useTeamData({ teamId });

  const createProjectMutation = useMutation({
    mutationFn: (body: { name: string }) =>
      api.projects.create(team!.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", team?.id] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => api.projects.remove(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", team?.id] });
    },
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const shouldCanonicalize =
    !!context && !context.isCanonical && pathname !== context.canonicalPath;

  useEffect(() => {
    if (shouldCanonicalize && context) {
      navigate({ to: context.canonicalPath, replace: true });
    }
  }, [shouldCanonicalize, context, navigate]);

  const isLoadingData =
    context === undefined ||
    billing === undefined ||
    projects === undefined ||
    shouldCanonicalize;

  if (context === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#888]"><Trans comment="Error message when team is not found">Team not found</Trans></div>
      </div>
    );
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !team) return;

    try {
      const result = await createProjectMutation.mutateAsync({
        name: newProjectName.trim(),
      });
      setCreateDialogOpen(false);
      setNewProjectName("");
      navigate({ to: projectPath(team.id, result.id) });
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(t({ message: "Are you sure you want to delete this project?", comment: "Confirmation dialog when deleting a project" }))) return;
    try {
      await deleteProjectMutation.mutateAsync(projectId);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const canManageMembers = team?.role === "owner" || team?.role === "admin";
  const hasActiveSubscription = billing?.hasActiveSubscription ?? false;
  const canCreateProject = team?.role !== "viewer" && hasActiveSubscription;
  const canAccessBilling = team?.role === "owner";
  const billingPath = team ? teamSettingsPath(team.id) : null;

  return (
    <div className="h-full flex flex-col">
      <DashboardHeader paths={[{ label: team?.name ?? "team" }]}>
        {canAccessBilling && team && (
          <Button
            variant="outline"
            onClick={() => navigate({ to: billingPath ?? teamSettingsPath(team.id) })}
          >
            <CreditCard className="sm:mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline"><Trans comment="Button to navigate to billing settings">Billing</Trans></span>
          </Button>
        )}
        {canManageMembers && (
          <Button
            variant="outline"
            onClick={() => setMemberDialogOpen(true)}
          >
            <Users className="sm:mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline"><Trans comment="Button to open team members dialog">Members</Trans></span>
          </Button>
        )}
        {canCreateProject && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="sm:mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline"><Trans comment="Button to create a new project">New project</Trans></span>
          </Button>
        )}
      </DashboardHeader>

      <div className="flex-1 overflow-auto p-6">
        {!isLoadingData && !hasActiveSubscription && canAccessBilling && (
          <Card className="mb-6 border-[#1a1a1a]">
            <CardHeader>
              <CardTitle><Trans comment="Card title prompting user to set up billing">Set up billing to create projects</Trans></CardTitle>
              <CardDescription>
                <Trans comment="Description explaining team needs billing setup">This team has no active subscription. Go to Billing to start Basic or Pro before creating projects.</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="primary"
                onClick={() => {
                  if (!billingPath) return;
                  navigate({ to: billingPath });
                }}
              >
                <Trans comment="Button to navigate to billing page">Go to Billing</Trans>
              </Button>
            </CardContent>
          </Card>
        )}
        {!isLoadingData && projects && projects.length === 0 ? (
          <div className="h-full flex items-center justify-center animate-in fade-in duration-300">
            <Card className="max-w-sm text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-[#e8e8e0] flex items-center justify-center mb-2">
                  <Folder className="h-6 w-6 text-[#888]" />
                </div>
                <CardTitle className="text-lg"><Trans comment="Empty state title when team has no projects">No projects yet</Trans></CardTitle>
                <CardDescription>
                  {hasActiveSubscription
                    ? <Trans comment="Empty state description when billing is active">Create your first project to start uploading videos.</Trans>
                    : <Trans comment="Empty state description when billing is not active">Activate billing first, then create your first project.</Trans>}
                </CardDescription>
              </CardHeader>
              {canCreateProject && (
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    <Trans comment="Button to create a new project">Create project</Trans>
                  </Button>
                </CardContent>
              )}
              {!canCreateProject && canAccessBilling && (
                <CardContent>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      if (!billingPath) return;
                      navigate({ to: billingPath });
                    }}
                  >
                    <Trans comment="Button to navigate to billing page">Go to Billing</Trans>
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-300",
            isLoadingData ? "opacity-0" : "opacity-100"
          )}>
            {projects?.map((project) => (
              <TeamProjectCard
                key={project.id}
                teamId={team!.id}
                project={project}
                canCreateProject={canCreateProject}
                onOpen={() =>
                  navigate({ to: projectPath(team!.id, project.id) })
                }
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle><Trans comment="Dialog title for creating a new project">Create project</Trans></DialogTitle>
              <DialogDescription>
                <Trans comment="Dialog description for project creation">Projects help you organize related videos together.</Trans>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder={t({ message: "Project name", comment: "Placeholder for project name input" })}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                <Trans comment="Cancel button in project creation dialog">Cancel</Trans>
              </Button>
              <Button
                type="submit"
                disabled={!newProjectName.trim() || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? <Trans comment="Submit button while project is being created">Creating...</Trans> : <Trans comment="Submit button to create a project">Create</Trans>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canManageMembers && team && (
        <MemberInvite
          teamId={team.id}
          open={memberDialogOpen}
          onOpenChange={setMemberDialogOpen}
        />
      )}
    </div>
  );
}
