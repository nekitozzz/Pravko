import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import DashboardLayout from "./-layout";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    seoHead({
      title: t({ message: "Dashboard", comment: "SEO: dashboard page title" }),
      description: `${t({ message: "Manage your video projects on", comment: "SEO: dashboard page meta description prefix" })} ${PRODUCT_NAME}`,
      path: "/dashboard",
      noIndex: true,
    }),
  component: DashboardLayout,
});
