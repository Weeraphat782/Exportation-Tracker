import type { Metadata } from "next";
import Link from "next/link";
import ResourcesList from "@/components/marketing/ResourcesList";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import {
  itemListSchema,
  jsonLdScript,
  webPageSchema,
} from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { absoluteUrl, BRAND_NAME } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = pageMeta({
  title: "Resources",
  description:
    "Export and customs reading instructions: EU compliance, destination requirements, and documentation guides from OMG Experience.",
  path: "/site/resources",
});

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const supabase = getSupabaseServerClient();
  let resources: {
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    imageUrl?: string;
  }[] = [];
  let allTags: string[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("resources")
      .select("slug, title, excerpt, tags, image_url")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    resources = (data || []).map((item) => ({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      tags: item.tags || [],
      imageUrl: item.image_url || undefined,
    }));

    allTags = Array.from(new Set(resources.flatMap((r) => r.tags))).sort();
  }

  const reviewed = new Date().toISOString().slice(0, 10);

  const listItems = resources.map((r) => ({
    name: r.title,
    url: absoluteUrl(`/site/resources/${r.slug}`),
  }));

  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/resources",
      name: `${BRAND_NAME} resource library`,
      description:
        "Guides on export compliance, destination requirements, and documentation.",
    }),
    ...(listItems.length
      ? [itemListSchema(`${BRAND_NAME} resources`, listItems)]
      : []),
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="resources-heading">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Resources", path: "/site/resources" },
        ]}
      />

      <header>
        <p className="text-sm text-neutral-500">Last updated: {reviewed}</p>
        <h1 id="resources-heading" className="mt-2 text-3xl font-bold text-neutral-900">Resources</h1>
        <p className="mt-4 text-neutral-600">
          Reading instructions for export and customs requirements. Filter by category
          to find relevant guides for your destination.
        </p>
      </header>

      <aside
        className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6"
        aria-labelledby="resources-tldr"
      >
        <h2 id="resources-tldr" className="text-lg font-semibold text-neutral-900">
          TL;DR
        </h2>
        <p className="mt-2 text-neutral-700">
          Long-form explainers aligned to regulatory themes—use them alongside your
          internal QA and legal review for outbound shipments.
        </p>
        <table className="mt-4 w-full max-w-lg text-left text-sm">
          <caption className="sr-only">At a glance: Resources</caption>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Format
              </th>
              <td className="py-2 text-neutral-600">Articles + downloadable refs</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Related
              </th>
              <td className="py-2 text-neutral-600">
                <Link href="/site/newsroom" className="font-medium underline">
                  Newsroom updates
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </aside>

      <div className="mb-8 mt-10 aspect-[3/1] overflow-hidden rounded-lg bg-neutral-100 shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop"
          alt="Warehouse and logistics planning environment for export compliance content"
          className="h-full w-full object-cover"
        />
      </div>

      <ResourcesList resources={resources} allTags={allTags} />
    </section>
  );
}
