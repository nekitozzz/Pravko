import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import CompareWipster from "./-compare-wipster";

export const Route = createFileRoute("/compare/wipster")({
  head: () =>
    seoHead({
      title: `${PRODUCT_NAME} vs Wipster — ${t({ message: "simpler video review, flat pricing", comment: "SEO: Wipster comparison page title suffix" })}`,
      description: `${t({ message: "Compare", comment: "SEO: comparison page meta description verb" })} ${PRODUCT_NAME} ${t({ message: "and Wipster. Flat $5/month vs per-user pricing. Self-hostable, instant playback, unlimited seats. The simpler alternative.", comment: "SEO: Wipster comparison page meta description" })}`,
      path: "/compare/wipster",
      ogImage: "/og/compare-wipster.png",
    }),
  component: CompareWipster,
});
