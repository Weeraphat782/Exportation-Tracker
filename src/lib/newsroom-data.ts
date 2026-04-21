import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getSupabasePublicSiteClient } from "@/lib/supabase/server";

/** Keep pre-rendered HTML / ISR payload under Vercel's 19 MB cap (FALLBACK_BODY_TOO_LARGE). */
const MAX_CONTENT_CHARS = 600_000;
/** `unstable_cache` hard limit is ~2 MB per entry. Stay well under to survive overhead. */
const MAX_LIST_BYTES = 1_500_000;
const MAX_TITLE_CHARS = 500;
const MAX_EXCERPT_CHARS = 600;

/** Remove every `data:` URI from a string (base64 images, data:text, etc.). */
function stripDataUris(input: string): string {
  if (!input) return input;
  let out = input;
  out = out.replace(/data:[^\s"')<>]+/gi, "");
  return out;
}

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

  return stripDataUris(out);
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

/** Cap any free-text DB column: strip data: URIs, trim to `maxLen`. */
function sanitizeText(
  value: string | null | undefined,
  maxLen: number,
): string {
  if (value == null) return "";
  const cleaned = stripDataUris(value).trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}

/**
 * `next/image` cannot use `data:` URIs; base64 in `image_url` also blows past the ~2 MB
 * `unstable_cache` entry limit when listing many articles.
 */
function sanitizeImageUrl(
  url: string | null | undefined,
  slug: string,
): string | null {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  if (/^data:/i.test(t)) {
    console.warn(
      `[newsroom] image_url for "${slug}" is a base64 data: URI (${t.length} chars); ignoring. Upload to R2/Supabase Storage and store the URL instead.`,
    );
    return null;
  }
  if (t.length > 2048) {
    console.warn(
      `[newsroom] image_url for "${slug}" is ${t.length} chars; ignoring (suspiciously long).`,
    );
    return null;
  }
  return t;
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

type RawListRow = {
  slug: string;
  title: string | null;
  excerpt: string | null;
  image_url: string | null;
  is_pinned: boolean | null;
  published_at: string | null;
};

function sanitizeListRow(raw: RawListRow): NewsListRow {
  return {
    slug: raw.slug,
    title: sanitizeText(raw.title, MAX_TITLE_CHARS),
    excerpt: sanitizeText(raw.excerpt, MAX_EXCERPT_CHARS),
    image_url: sanitizeImageUrl(raw.image_url, raw.slug),
    is_pinned: Boolean(raw.is_pinned),
    published_at: raw.published_at,
  };
}

/** Cap total payload under the `unstable_cache` 2 MB limit, logging any trimming. */
function capListByByteSize(rows: NewsListRow[]): NewsListRow[] {
  const capped: NewsListRow[] = [];
  let total = 0;
  for (const row of rows) {
    const size = JSON.stringify(row).length;
    if (total + size > MAX_LIST_BYTES) {
      console.warn(
        `[newsroom] list payload would exceed ${MAX_LIST_BYTES} bytes at "${row.slug}" (row=${size}B, accumulated=${total}B); stopping at ${capped.length} entries`,
      );
      break;
    }
    if (size > 16_384) {
      console.warn(
        `[newsroom] row "${row.slug}" is ${size} bytes (title=${row.title.length}, excerpt=${row.excerpt.length}, image_url=${row.image_url?.length ?? 0}); consider auditing the DB record`,
      );
    }
    total += size;
    capped.push(row);
  }
  return capped;
}

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
    const rows = ((data ?? []) as RawListRow[]).map(sanitizeListRow);
    return capListByByteSize(rows);
  },
  ["newsroom:list:v2"],
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
  return {
    ...row,
    title: sanitizeText(row.title, MAX_TITLE_CHARS),
    excerpt: sanitizeText(row.excerpt, MAX_EXCERPT_CHARS),
    content: sanitizeArticleContent(row.content, slug),
    image_url: sanitizeImageUrl(row.image_url, slug),
  };
}

/**
 * One DB read per slug per request (React `cache`) and cross-request ISR via `unstable_cache`.
 * Tags: `news:list`, `news:article:<slug>` — invalidate from publish API.
 */
export const getArticleBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () => fetchArticleBySlugFromDb(slug),
    ["newsroom-article:v2", slug],
    { tags: ["news:list", `news:article:${slug}`], revalidate: 3600 },
  )();
});
