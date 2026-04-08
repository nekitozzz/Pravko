import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["en", "ru"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "src/locales/{locale}/messages",
      include: ["app/**/*", "src/**/*"],
      exclude: ["**/node_modules/**", "convex/**"],
    },
  ],
  format: "po",
  compileNamespace: "es",
};

export default config;
