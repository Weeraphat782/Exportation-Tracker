import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getSupabasePublicSiteClient } from "@/lib/supabase/server";

/** Keep pre-rendered HTML / ISR payload under Vercel's 19 MB cap (FALLBACK_BODY_TOO_LARGE). */
const MAX_CONTENT_CHARS = 600_000;

/**
 * Strip `data:` URIs (base64-embedded images) from CMS markdown so they never land in
 * pre-rendered HTML or the RSC fallback payload. Base64 images bloat ISR output by
 * orders of magnitude; hero art belongs in `image_url` (R2/Supabase Storage) instead.
 */
function stripBase64Images(markdown: string): string {
  if (!markdown) return markdown;
  let out = markdown;

  out = out.replace(
    /!\[([^\]]*)\]\(\s*data:[^)\s]+\s*(?:"[^"]*")?\s*\)/gi,
    (_match, alt: string) => (alt ? `*[image omitted: ${alt}]*` : ""),
  );

  out = out.replace(
    /<img\b[^>]*\bsrc\s*=\s*(?:"data:[^"]*"|'data:[^']*')[^>]*>/gi,
    "",
  );

  return out;
}

function sanitizeArticleContent(
  content: string | null | undefined,
  slug: string,
): string | null {
  if (content == null) return null;
  let next = stripBase64Images(content);
  if (next.length > MAX_CONTENT_CHARS) {
    console.warn(
      `[newsroom] content for "${slug}" is ${next.length} chars; truncating to ${MAX_CONTENT_CHARS} to protect ISR payload size`,
    );
    next = `${next.slice(0, MAX_CONTENT_CHARS)}\n\n*[content truncated]*`;
  }
  return next;
}

const ARTICLE_COLUMNS =
  "id, slug, title, excerpt, content, image_url, is_published, is_pinned, published_at, updated_at";

/** Row shape for a published news article (explicit columns only). */
export type NewsArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string | null;
  image_url: string | null;
  is_published: boolean;
  is_pinned: boolean;
  published_at: string | null;
  updated_at: string | null;
};

/** List rows for /site/newsroom (cached; invalidated via tag `news:list`). */
export type NewsListRow = {
  slug: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  is_pinned: boolean;
  published_at: string | null;
};

export const getPublishedArticlesList = unstable_cache(
  async (): Promise<NewsListRow[]> => {
    const supabase = getSupabasePublicSiteClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("news_articles")
      .select("slug, title, excerpt, image_url, is_pinned, published_at")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) return [];
    return (data ?? []) as NewsListRow[];
  },
  ["newsroom:list"],
  { tags: ["news:list"], revalidate: 3600 },
);

async function fetchArticleBySlugFromDb(
  slug: string,
): Promise<NewsArticleRow | null> {
  const supabase = getSupabasePublicSiteClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("news_articles")
    .select(ARTICLE_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (error || !data) return null;
  const row = data as NewsArticleRow;
  return { ...row, content: sanitizeArticleContent(row.content, slug) };
}

/**
 * One DB read per slug per request (React `cache`) and cross-request ISR via `unstable_cache`.
 * Tags: `news:list`, `news:article:<slug>` — invalidate from publish API.
 */
export const getArticleBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () => fetchArticleBySlugFromDb(slug),
    ["newsroom-article", slug],
    { tags: ["news:list", `news:article:${slug}`], revalidate: 3600 },
  )();
});
