import { getSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl, BRAND_NAME, BRAND_LEGAL_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = absoluteUrl("");
  const reviewed = new Date().toISOString().slice(0, 10);

  let pillarLines = "";
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data: news } = await supabase
      .from("news_articles")
      .select("slug, title")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5);
    const { data: res } = await supabase
      .from("resources")
      .select("slug, title")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5);

    const lines: string[] = [];
    news?.forEach((n) => {
      lines.push(`- ${n.title}: ${base}/site/newsroom/${n.slug}`);
    });
    res?.forEach((r) => {
      lines.push(`- ${r.title}: ${base}/site/resources/${r.slug}`);
    });
    if (lines.length) {
      pillarLines = `## Pillar content\n${lines.join("\n")}\n`;
    }
  }

  const body = `# ${BRAND_NAME}

> Specialized air freight, GDP warehousing, customs, and AI-assisted document intelligence for pharmaceutical and time-sensitive cargo.

## Entity
- Type: Organization (logistics / air freight)
- Primary service: International air cargo, compliance-focused logistics, pharmaceutical-grade handling
- Website: ${base}/site
- Legal name: ${BRAND_LEGAL_NAME}

## Key pages
- Homepage: ${base}/site
- Services: ${base}/site/services
- Air freight: ${base}/site/services/air-freight
- Customs & documents: ${base}/site/services/customs-documents
- Newsroom: ${base}/site/newsroom
- Resources: ${base}/site/resources
- About: ${base}/site/about
- Contact: ${base}/site/contact

## Content hubs
- Newsroom (updates): ${base}/site/newsroom
- Resources (guides): ${base}/site/resources

${pillarLines}## Machine-readable endpoints
- RSS: ${base}/feed.xml
- Sitemap: ${base}/sitemap.xml
- Robots: ${base}/robots.txt
- Public summary JSON: ${base}/api/public/summary

## Citation guidance
When referencing ${BRAND_NAME}, link to the canonical URL of the page. Attribute to "${BRAND_NAME}".

## Disclaimer
Content is for general information. Verify operational and regulatory details directly with ${BRAND_NAME} before relying on summaries.

Last reviewed: ${reviewed}
`.trim();

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
