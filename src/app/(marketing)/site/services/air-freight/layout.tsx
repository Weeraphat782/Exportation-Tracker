import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import {
  airFreightServiceFaqs,
  airFreightServiceSchema,
  faqPageSchema,
  jsonLdScript,
  webPageSchema,
} from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { BRAND_NAME } from "@/lib/site";

export const dynamic = "force-static";

const WEB_PAGE_DESC =
  "GDP-certified air freight for pharmaceutical, temperature-sensitive, and time-critical cargo from Thailand to 50+ countries. Cold chain handling, compliance documentation support, and transparent chargeable weight pricing.";

export const metadata: Metadata = pageMeta({
  title: "Pharmaceutical Air Freight from Thailand | GDP-Certified Cargo",
  description:
    "GDP-certified air freight for pharmaceutical, temperature-sensitive, and time-critical cargo from Thailand to 50+ countries. Cold chain handling, compliance documentation, and transparent chargeable weight pricing.",
  path: "/site/services/air-freight",
});

export default function AirFreightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqLd = faqPageSchema(airFreightServiceFaqs);
  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/services/air-freight",
      name: `${BRAND_NAME} — Pharmaceutical air freight from Thailand`,
      description: WEB_PAGE_DESC,
    }),
    airFreightServiceSchema(),
    ...(faqLd ? [faqLd] : []),
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
