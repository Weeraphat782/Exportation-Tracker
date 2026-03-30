import { BRAND_LEGAL_NAME, BRAND_NAME, absoluteUrl, getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = {
    brand: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    type: "Organization",
    url: getSiteUrl(),
    primaryService:
      "International air freight, GDP warehousing, customs clearance, cold-chain logistics, AI-assisted export documentation",
    keyPages: {
      home: absoluteUrl("/site"),
      services: absoluteUrl("/site/services"),
      newsroom: absoluteUrl("/site/newsroom"),
      resources: absoluteUrl("/site/resources"),
      contact: absoluteUrl("/site/contact"),
    },
    endpoints: {
      sitemap: absoluteUrl("/sitemap.xml"),
      rss: absoluteUrl("/feed.xml"),
      llmsTxt: absoluteUrl("/llms.txt"),
    },
    lastReviewed: new Date().toISOString().slice(0, 10),
    disclaimer:
      "Verify pricing, policies, and regulatory requirements directly with OMG Experience before making operational decisions.",
  };

  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
