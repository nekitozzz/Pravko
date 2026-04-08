import { createFileRoute } from "@tanstack/react-router";
import { t } from "@lingui/core/macro";
import { seoHead } from "@/lib/seo";
import { PRODUCT_NAME } from "@/lib/product";
import { AuthShell } from "./auth/-layout";
import SignInPage from "./auth/-sign-in";

export const Route = createFileRoute("/sign-in")({
  head: () =>
    seoHead({
      title: t({ message: "Sign in", comment: "SEO: sign-in page title" }),
      description: `${t({ message: "Sign in to your", comment: "SEO: sign-in page meta description prefix" })} ${PRODUCT_NAME} ${t({ message: "account.", comment: "SEO: sign-in page meta description suffix" })}`,
      path: "/sign-in",
      noIndex: true,
    }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  }),
  component: SignInRoute,
});

function SignInRoute() {
  return (
    <AuthShell>
      <SignInPage />
    </AuthShell>
  );
}
