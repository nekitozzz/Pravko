import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import SharePage from "./-share";

export const Route = createFileRoute("/share/$token")({
  head: () =>
    seoHead({
      title: t({ message: "Shared video", comment: "SEO: shared video page title" }),
      description: `${t({ message: "Review this shared video on", comment: "SEO: shared video page meta description prefix" })} ${PRODUCT_NAME}`,
      path: "/share",
      noIndex: true,
    }),
  component: SharePage,
});
