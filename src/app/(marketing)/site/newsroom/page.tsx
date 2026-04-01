import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContinueExploring } from "@/components/marketing/ContinueExploring";
import NewsCard from "@/components/marketing/NewsCard";
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
  title: "Newsroom",
  description:
    "Company announcements, route updates, and logistics industry news from OMG Experience.",
  path: "/site/newsroom",
});

export const dynamic = "force-dynamic";

export default async function NewsroomPage() {
  const supabase = getSupabasePublicSiteClient();
  let articles: {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    imageUrl?: string;
    pinned?: boolean;
  }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("news_articles")
      .select("slug, title, excerpt, image_url, is_pinned, published_at")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    articles = (data || []).map((item) => ({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      date: item.published_at || "",
      imageUrl: item.image_url || undefined,
      pinned: item.is_pinned,
    }));
  }

  const reviewed = new Date().toISOString().slice(0, 10);

  const listItems = articles.map((a) => ({
    name: a.title,
    url: absoluteUrl(`/site/newsroom/${a.slug}`),
  }));

  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/newsroom",
      name: `${BRAND_NAME} Newsroom`,
      description:
        "Updates on logistics operations, industry context, and company announcements.",
    }),
    ...(listItems.length
      ? [itemListSchema(`${BRAND_NAME} news articles`, listItems)]
      : []),
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="newsroom-heading">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Newsroom", path: "/site/newsroom" },
        ]}
      />

      <header>
        <p className="text-sm text-neutral-500">Last updated: {reviewed}</p>
        <h1 id="newsroom-heading" className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">Newsroom</h1>
        <p className="mt-4 text-neutral-600">
          Company announcements, route updates, and logistics industry news.
        </p>
      </header>

      <aside
        className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6"
        aria-labelledby="newsroom-tldr"
      >
        <h2 id="newsroom-tldr" className="text-lg font-semibold text-neutral-900">
          TL;DR
        </h2>
        <p className="mt-2 text-neutral-700">
          Curated updates on air cargo, compliance, and export programs—written for
          operators and partners tracking {BRAND_NAME} activity.
        </p>
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[min(100%,20rem)] max-w-lg text-left text-sm">
          <caption className="sr-only">At a glance: Newsroom</caption>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Scope
              </th>
              <td className="py-2 text-neutral-600">Logistics, regulation, network</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Deeper reading
              </th>
              <td className="py-2 text-neutral-600">
                <Link href="/site/resources" className="font-medium underline">
                  Resource library
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </aside>

      <div className="relative mb-8 mt-10 aspect-[21/9] overflow-hidden rounded-xl bg-neutral-100 shadow-md">
        <Image
          src="/images/newsroom-hero.jpg"
          alt="Newsroom hero — logistics and global trade context"
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
          loading="lazy"
        />
      </div>

      <div className="space-y-8">
        {articles.length === 0 ? (
          <p className="py-8 text-center text-neutral-400">
            No articles published yet.
          </p>
        ) : (
          articles.map((item) => (
            <NewsCard
              key={item.slug}
              slug={item.slug}
              title={item.title}
              date={item.date}
              excerpt={item.excerpt}
              imageUrl={item.imageUrl}
            />
          ))
        )}
      </div>

      <ContinueExploring />
    </section>
  );
}
