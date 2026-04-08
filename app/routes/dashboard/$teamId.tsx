import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$teamId")({
  component: TeamRoute,
});

function TeamRoute() {
  return <Outlet />;
}
