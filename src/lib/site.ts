/**
 * Canonical site URL and brand constants for SEO / GEO (entity consistency).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://www.example.com).
 */
export const BRAND_NAME = "OMG Experience";
export const BRAND_SHORT = "OMG Experience";
export const BRAND_LEGAL_NAME = "OMG Experience";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3001";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Default OG / Twitter share image (use brand asset; replace with 1200x630 asset when available). */
export const DEFAULT_OG_IMAGE_PATH = "/logo.png";

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}
