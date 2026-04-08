import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import Homepage from "./-home";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: `${PRODUCT_NAME} — ${t({ message: "video review for creative teams", comment: "SEO: homepage title tagline" })}`,
      description: t({ message: "Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, $5/month flat. The simpler Frame.io alternative.", comment: "SEO: homepage meta description. Frame.io is a competitor product name" }),
      path: "/",
      ogImage: "/og/home.png",
    }),
  component: Homepage,
});
