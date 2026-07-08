import type { MetadataRoute } from "next";
import { getSupabasePublicSiteClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const CONTENT_REVISED = new Date("2026-03-30T00:00:00.000Z");

function safeLastModified(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function buildStaticMarketing(base: string): MetadataRoute.Sitemap {
  return [
    { url: `${base}/site`, lastModified: CONTENT_REVISED, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/site/about`, lastModified: CONTENT_REVISED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/site/contact`, lastModified: CONTENT_REVISED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/site/services`, lastModified: CONTENT_REVISED, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${base}/site/services/air-freight`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${base}/site/services/customs-documents`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    { url: `${base}/site/newsroom`, lastModified: CONTENT_REVISED, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/site/resources`, lastModified: CONTENT_REVISED, changeFrequency: "weekly", priority: 0.9 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let base = "https://cargo.omgexp.com";
  try {
    base = absoluteUrl("");
  } catch (err) {
    console.error("[sitemap] absoluteUrl failed, using fallback base:", err);
  }

  const staticMarketing = buildStaticMarketing(base);

  try {
    const supabase = getSupabasePublicSiteClient();
    if (!supabase) {
      return staticMarketing;
    }

    const [{ data: news, error: newsError }, { data: resources, error: resourcesError }] =
      await Promise.all([
        supabase
          .from("news_articles")
          .select("slug, updated_at, published_at")
          .eq("is_published", true),
        supabase
          .from("resources")
          .select("slug, updated_at, published_at")
          .eq("is_published", true),
      ]);

    if (newsError) {
      console.error("[sitemap] news_articles query failed:", newsError.message);
    }
    if (resourcesError) {
      console.error("[sitemap] resources query failed:", resourcesError.message);
    }

    const newsRoutes: MetadataRoute.Sitemap =
      news
        ?.filter((n) => typeof n.slug === "string" && n.slug.length > 0)
        .map((n) => ({
          url: `${base}/site/newsroom/${n.slug}`,
          lastModified: safeLastModified(n.updated_at ?? n.published_at, CONTENT_REVISED),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        })) ?? [];

    const resourceRoutes: MetadataRoute.Sitemap =
      resources
        ?.filter((r) => typeof r.slug === "string" && r.slug.length > 0)
        .map((r) => ({
          url: `${base}/site/resources/${r.slug}`,
          lastModified: safeLastModified(r.updated_at ?? r.published_at, CONTENT_REVISED),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        })) ?? [];

    return [...staticMarketing, ...newsRoutes, ...resourceRoutes];
  } catch (err) {
    console.error("[sitemap] failed, serving static fallback:", err);
    return staticMarketing;
  }
}
