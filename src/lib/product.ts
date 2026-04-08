/**
 * Central product name, branding, and pricing constants.
 *
 * This is the SINGLE SOURCE OF TRUTH for all pricing shown on the frontend.
 * The backend defaults (server/services/billing.ts) must match these values.
 *
 * After changing, run `bun run i18n:extract && bun run i18n:compile` to
 * update translation catalogs.
 */

export const PRODUCT_NAME = "Правко.";

/** Product domain (used in SEO, sitemaps, JSON-LD). Set via VITE_SITE_URL env var. */
export const PRODUCT_URL = import.meta.env.VITE_SITE_URL ?? "https://pravko.ru";

/**
 * Pricing plans. Prices are in RUB (Russian Rubles) — matches YooKassa billing.
 * Backend defaults in server/services/billing.ts must stay in sync.
 */
export const PRICING = {
  currency: "RUB",
  currencySymbol: "\u20BD", // ₽
  basic: {
    name: "Basic",
    price: 800,
    storageGB: 100,
    storageLabel: "100GB",
  },
  pro: {
    name: "Pro",
    price: 3700,
    storageGB: 1024,
    storageLabel: "1TB",
  },
} as const;

/** Format a price in RUB: e.g. 800 → "800 ₽", 3700 → "3 700 ₽" */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("ru-RU")}\u00A0\u20BD`;
}
