import { getSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl, BRAND_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

function escapeCdata(s: string): string {
  return s.replace(/]]>/g, "]]]]><![CDATA[>");
}

export async function GET() {
  const base = absoluteUrl("");
  const supabase = getSupabaseServerClient();
  const now = new Date().toUTCString();

  let itemsXml = "";
  if (supabase) {
    const { data: posts } = await supabase
      .from("news_articles")
      .select("slug, title, excerpt, published_at, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(20);

    if (posts?.length) {
      itemsXml = posts
        .map((p) => {
          const link = `${base}/site/newsroom/${p.slug}`;
          const pub = p.published_at
            ? new Date(p.published_at).toUTCString()
            : now;
          return `
<item>
  <title><![CDATA[${escapeCdata(p.title)}]]></title>
  <description><![CDATA[${escapeCdata(p.excerpt || "")}]]></description>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <pubDate>${pub}</pubDate>
  <author>${BRAND_NAME} Editorial</author>
</item>`;
        })
        .join("");
    }
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${BRAND_NAME} — Newsroom</title>
  <description>Latest news and logistics updates from ${BRAND_NAME}.</description>
  <link>${base}/site/newsroom</link>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
  <lastBuildDate>${now}</lastBuildDate>
  <language>en-us</language>
  ${itemsXml}
</channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
