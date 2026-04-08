import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import ForVideoEditors from "./-for-video-editors";

export const Route = createFileRoute("/for/video-editors")({
  head: () =>
    seoHead({
      title: t({ message: "Video review for editors — frame-accurate feedback", comment: "SEO: video editors landing page title" }),
      description: t({ message: "Video review built for editors. Frame-accurate comments, instant playback, no account required for reviewers. $5/month flat.", comment: "SEO: video editors landing page meta description" }),
      path: "/for/video-editors",
      ogImage: "/og/for-editors.png",
    }),
  component: ForVideoEditors,
});
