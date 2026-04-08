import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import CompareFrameio from "./-compare-frameio";

export const Route = createFileRoute("/compare/frameio")({
  head: () =>
    seoHead({
      title: `${PRODUCT_NAME} vs Frame.io — ${t({ message: "the cheaper, faster alternative", comment: "SEO: Frame.io comparison page title suffix" })}`,
      description: `${t({ message: "Compare", comment: "SEO: comparison page meta description verb" })} ${PRODUCT_NAME} ${t({ message: "and Frame.io. Flat $5/month pricing vs per-seat billing. Unlimited seats, instant playback, self-hostable. See why teams are switching.", comment: "SEO: Frame.io comparison page meta description" })}`,
      path: "/compare/frameio",
      ogImage: "/og/compare-frameio.png",
    }),
  component: CompareFrameio,
});
