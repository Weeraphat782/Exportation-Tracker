import type { Metadata } from "next";
import MarketingHomePageClient from "./MarketingHomePageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdScript, webPageSchema } from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { BRAND_NAME } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: `${BRAND_NAME} — Specialized Air Freight & Global Logistics`,
  description:
    "End-to-end air freight, GDP warehousing, customs clearance, and AI-assisted document intelligence for pharmaceutical and time-sensitive cargo.",
  path: "/site",
});

export const dynamic = "force-static";

export default function MarketingHomePage() {
  const ld = jsonLdScript([
    webPageSchema({
      path: "/site",
      name: `${BRAND_NAME} — Home`,
      description:
        "Specialized air freight, GDP warehousing, customs, and cold-chain logistics with AI document verification.",
    }),
  ]);

  return (
    <>
      <JsonLd data={ld} />
      <MarketingHomePageClient />
    </>
  );
}
