import { createFileRoute } from "@tanstack/react-router";
import ProjectPage from "./-project";

export const Route = createFileRoute("/dashboard/$teamId/$projectId/")({
  component: ProjectIndexRoute,
});

function ProjectIndexRoute() {
  const { teamId, projectId } = Route.useParams();

  return (
    <ProjectPage
      teamId={teamId}
      projectId={projectId}
    />
  );
}
