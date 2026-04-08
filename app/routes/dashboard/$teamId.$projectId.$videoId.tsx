import { createFileRoute } from "@tanstack/react-router";
import VideoPage from "./-video";

export const Route = createFileRoute("/dashboard/$teamId/$projectId/$videoId")({
  component: VideoPage,
});
