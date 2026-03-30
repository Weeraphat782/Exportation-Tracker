import type { MetadataRoute } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = absoluteUrl("");

  const CONTENT_REVISED = new Date("2026-03-30");

  const staticMarketing: MetadataRoute.Sitemap = [
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
    { url: `${base}/llms.txt`, lastModified: CONTENT_REVISED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/feed.xml`, lastModified: CONTENT_REVISED, changeFrequency: "daily", priority: 0.5 },
  ];

  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return staticMarketing;
    }

    const { data: news } = await supabase
      .from("news_articles")
      .select("slug, updated_at, published_at")
      .eq("is_published", true);

    const { data: resources } = await supabase
      .from("resources")
      .select("slug, updated_at, published_at")
      .eq("is_published", true);

    const newsRoutes: MetadataRoute.Sitemap =
      news?.map((n) => ({
        url: `${base}/site/newsroom/${n.slug}`,
        lastModified: n.updated_at
          ? new Date(n.updated_at)
          : n.published_at
            ? new Date(n.published_at)
            : CONTENT_REVISED,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })) ?? [];

    const resourceRoutes: MetadataRoute.Sitemap =
      resources?.map((r) => ({
        url: `${base}/site/resources/${r.slug}`,
        lastModified: r.updated_at
          ? new Date(r.updated_at)
          : r.published_at
            ? new Date(r.published_at)
            : CONTENT_REVISED,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })) ?? [];

    return [...staticMarketing, ...newsRoutes, ...resourceRoutes];
  } catch {
    return staticMarketing;
  }
}
