import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import WatchPage from "./-watch";

export const Route = createFileRoute("/watch/$publicId")({
  head: () =>
    seoHead({
      title: t({ message: "Watch video", comment: "SEO: watch video page title" }),
      description: `${t({ message: "Watch and review this video on", comment: "SEO: watch video page meta description prefix" })} ${PRODUCT_NAME}`,
      path: "/watch",
      noIndex: true,
    }),
  component: WatchPage,
});
