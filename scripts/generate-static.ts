/**
 * Generate robots.txt and sitemap.xml from the VITE_SITE_URL environment variable.
 *
 * Usage: bun run scripts/generate-static.ts
 * Reads VITE_SITE_URL from .env (via Bun's built-in .env loading) and writes
 * public/robots.txt and public/sitemap.xml with the correct domain.
 */

import { writeFileSync } from "fs";
import { join } from "path";

const siteUrl = (process.env.VITE_SITE_URL ?? "https://pravko.ru").replace(/\/+$/, "");
const publicDir = join(process.cwd(), "public");

// --- robots.txt ---
const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /sign-in
Disallow: /watch/
Disallow: /share/
Disallow: /invite/
Disallow: /mono
Disallow: /_shell

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(join(publicDir, "robots.txt"), robotsTxt);
console.log("Generated: public/robots.txt");

// --- sitemap.xml ---
const pages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/compare/frameio", changefreq: "monthly", priority: "0.9" },
  { path: "/compare/wipster", changefreq: "monthly", priority: "0.8" },
  { path: "/for/video-editors", changefreq: "monthly", priority: "0.8" },
  { path: "/for/agencies", changefreq: "monthly", priority: "0.8" },
  { path: "/sign-up", changefreq: "monthly", priority: "0.6" },
];

const urls = pages
  .map(
    (p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join("\n");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(publicDir, "sitemap.xml"), sitemapXml);
console.log("Generated: public/sitemap.xml");
