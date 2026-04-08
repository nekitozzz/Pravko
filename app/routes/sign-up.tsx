import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import { AuthShell } from "./auth/-layout";
import SignUpPage from "./auth/-sign-up";

export const Route = createFileRoute("/sign-up")({
  head: () =>
    seoHead({
      title: t({ message: "Start your free trial", comment: "SEO: sign-up page title" }),
      description: `${t({ message: "Sign up for", comment: "SEO: sign-up page meta description prefix" })} ${PRODUCT_NAME} — ${t({ message: "video review for creative teams. $5/month flat, unlimited seats.", comment: "SEO: sign-up page meta description suffix" })}`,
      path: "/sign-up",
    }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  component: SignUpRoute,
});

function SignUpRoute() {
  return (
    <AuthShell>
      <SignUpPage />
    </AuthShell>
  );
}
