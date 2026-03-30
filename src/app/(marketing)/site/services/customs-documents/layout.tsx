import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import { jsonLdScript, webPageSchema } from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { BRAND_NAME } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = pageMeta({
  title: "Customs & Export Documents",
  description:
    "Export documentation, HS codes, permits, and customs clearance support with AI-assisted checks from OMG Experience.",
  path: "/site/services/customs-documents",
});

export default function CustomsDocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/services/customs-documents",
      name: `${BRAND_NAME} Customs & Export Documents`,
      description:
        "Export documentation, HS codes, permits, and customs clearance support with AI-assisted verification.",
    }),
  ]);

  return (
    <>
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Services", path: "/site/services" },
          { name: "Customs & Documents", path: "/site/services/customs-documents" },
        ]}
      />
      {children}
    </>
  );
}
