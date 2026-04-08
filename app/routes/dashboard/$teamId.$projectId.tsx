import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$teamId/$projectId")({
  component: ProjectRouteLayout,
});

function ProjectRouteLayout() {
  return <Outlet />;
}
