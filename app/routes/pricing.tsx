import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import PricingPage from "./-pricing";

export const Route = createFileRoute("/pricing")({
  head: () =>
    seoHead({
      title: t({ message: "Pricing — $5/month, unlimited seats", comment: "SEO: pricing page title" }),
      description: `${PRODUCT_NAME} — ${t({ message: "pricing is simple. $5/month for unlimited seats, projects, and clients. $25/month if you need more storage. No per-user fees.", comment: "SEO: pricing page meta description" })}`,
      path: "/pricing",
      ogImage: "/og/pricing.png",
    }),
  component: PricingPage,
});
