import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContinueExploring } from "@/components/marketing/ContinueExploring";
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
import { getSupabasePublicSiteClient } from "@/lib/supabase/server";

export const metadata: Metadata = pageMeta({
  title: "Resources",
  description:
    "Long-form guides for Thailand medical cannabis export to Europe: B.E. 2568 licensing, GACP, EU-GMP Annex 7, QP batch release, GDP cold chain, Ph. Eur. specifications, Germany market access, and digital traceability.",
  path: "/site/resources",
});

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const supabase = getSupabasePublicSiteClient();
  let resources: {
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    imageUrl?: string;
  }[] = [];
  let allTags: string[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from("resources")
      .select("slug, title, excerpt, tags, image_url")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("[resources] Supabase select failed:", error.message);
    }

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
        "Deep-dive articles on Thai controlled-herb export, EU GMP and QP expectations, GDP logistics, pharmacopoeia-aligned specs, and EU market strategy.",
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
        <h1 id="resources-heading" className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">Resources</h1>
        <div className="mt-4 space-y-3 text-neutral-600">
          <p>
            Reading instructions and compliance explainers for teams moving medical-grade
            cannabis from Thailand toward European markets. Topics span controlled-herb
            licensing intent, DTAM-facing traceability, farm-level GACP, when post-harvest
            becomes EU-GMP manufacturing, Qualified Person batch folders, long-haul GDP cold
            chain evidence, Ph. Eur.-style specifications, Germany import dynamics, and
            roadmaps that treat digital traceability as part of the core stack—not an
            afterthought.
          </p>
          <p>
            Filter by category to narrow guides for your role—regulatory, quality,
            operations, or logistics—and use each article alongside your own legal and QA
            review; these resources are educational context, not jurisdiction-specific
            legal advice.
          </p>
        </div>
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
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[min(100%,20rem)] max-w-lg text-left text-sm">
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
        </div>
      </aside>

      <div className="relative mb-8 mt-10 aspect-[3/1] overflow-hidden rounded-lg bg-neutral-100 shadow-md">
        <Image
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop"
          alt="Warehouse and logistics planning environment for export compliance content"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1024px"
          loading="lazy"
        />
      </div>

      {resources.length === 0 ? (
        <p className="mt-10 py-8 text-center text-neutral-500">
          {supabase
            ? "No published guides yet. In CMS, turn on Publish for each resource, or run npm run seed:eu-resources for this Supabase project."
            : "Resources are unavailable (missing Supabase URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or service role on the server)."}
        </p>
      ) : (
        <ResourcesList resources={resources} allTags={allTags} />
      )}

      <ContinueExploring />
    </section>
  );
}
