import { BRAND_LEGAL_NAME, BRAND_NAME, getMarketingUrl, marketingUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = {
    brand: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    type: "Organization",
    url: getMarketingUrl(),
    primaryService:
      "Cannabis, hemp, and kratom export air freight; Thai customs (ภ.ท.32); partner GDP warehousing and ISO-certified lab COA",
    keyPages: {
      home: marketingUrl("/"),
      services: marketingUrl("/services"),
      newsroom: marketingUrl("/newsroom"),
      resources: marketingUrl("/resources"),
      contact: marketingUrl("/contact"),
    },
    endpoints: {
      rss: marketingUrl("/feed.xml"),
      llmsTxt: marketingUrl("/llms.txt"),
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
