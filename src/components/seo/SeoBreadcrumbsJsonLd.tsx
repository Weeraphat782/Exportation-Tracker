import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbListSchema, jsonLdScript } from "@/lib/json-ld";

export function SeoBreadcrumbsJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return <JsonLd data={jsonLdScript(breadcrumbListSchema(items))} />;
}
