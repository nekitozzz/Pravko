import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { t } from "@lingui/core/macro";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@/lib/i18n";
import { PRODUCT_NAME } from "@/lib/product";
import { AppProviders } from "@/lib/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeToggle";
import { NotFound } from "@/components/ui/NotFound";
import "../app.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${PRODUCT_NAME} — ${t({ message: "video review for creative teams", comment: "SEO: root page title tagline" })}` },
      {
        name: "description",
        content: t({ message: "Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, $5/month flat. The simpler Frame.io alternative.", comment: "SEO: root page meta description. Frame.io is a competitor product name" }),
      },
      { property: "og:site_name", content: PRODUCT_NAME },
      { name: "twitter:site", content: "@theo" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/grass-logo.svg?v=4" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=4" },
      { rel: "shortcut icon", href: "/favicon.ico?v=4" },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error }) => {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <h1>{t({ message: "Error", comment: "Error boundary heading" })}</h1>
        <p>{error instanceof Error ? error.message : t({ message: "An unexpected error occurred.", comment: "Generic error boundary fallback message" })}</p>
        {import.meta.env.DEV && error instanceof Error && error.stack ? (
          <pre className="w-full p-4 overflow-x-auto">
            <code>{error.stack}</code>
          </pre>
        ) : null}
      </main>
    );
  },
  notFoundComponent: () => <NotFound />,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const themeInitScript = `
    (() => {
      try {
        const stored = localStorage.getItem("pravko-theme");
        if (stored === "light" || stored === "dark") {
          document.documentElement.setAttribute("data-theme", stored);
          return;
        }
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        document.documentElement.setAttribute("data-theme", prefersLight ? "light" : "dark");
      } catch {}
    })();
  `;

  return (
    <html lang="ru" className="h-full" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="h-full antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <I18nProvider i18n={i18n}>
          <AppProviders>
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ThemeProvider>
          </AppProviders>
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}
