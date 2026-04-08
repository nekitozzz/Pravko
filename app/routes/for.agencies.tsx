import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import ForAgencies from "./-for-agencies";

export const Route = createFileRoute("/for/agencies")({
  head: () =>
    seoHead({
      title: t({ message: "Video review for agencies — stop paying per seat", comment: "SEO: agencies landing page title" }),
      description: t({ message: "Video review built for agencies. Unlimited seats for $5/month. No per-user pricing, no client accounts needed, instant sharing.", comment: "SEO: agencies landing page meta description" }),
      path: "/for/agencies",
      ogImage: "/og/for-agencies.png",
    }),
  component: ForAgencies,
});
