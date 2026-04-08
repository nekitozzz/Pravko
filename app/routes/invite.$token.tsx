import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import InvitePage from "./-invite";

export const Route = createFileRoute("/invite/$token")({
  head: () =>
    seoHead({
      title: t({ message: "Join team", comment: "SEO: team invite page title" }),
      description: `${t({ message: "Accept your team invitation on", comment: "SEO: team invite page meta description prefix" })} ${PRODUCT_NAME}`,
      path: "/invite",
      noIndex: true,
    }),
  component: InvitePage,
});
