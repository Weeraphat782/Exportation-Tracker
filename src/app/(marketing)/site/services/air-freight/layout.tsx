import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import { jsonLdScript, webPageSchema } from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { BRAND_NAME } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = pageMeta({
  title: "Air Freight Services",
  description:
    "Dedicated and consolidation air freight, dimensional weight, ULD planning, and carrier selection from OMG Experience.",
  path: "/site/services/air-freight",
});

export default function AirFreightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/services/air-freight",
      name: `${BRAND_NAME} Air Freight Services`,
      description:
        "Dedicated and consolidation air freight with dimensional weight, ULD planning, and carrier selection.",
    }),
  ]);

  return (
    <>
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Services", path: "/site/services" },
          { name: "Air Freight", path: "/site/services/air-freight" },
        ]}
      />
      {children}
    </>
  );
}
