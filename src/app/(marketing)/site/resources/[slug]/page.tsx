import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContinueExploring } from "@/components/marketing/ContinueExploring";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import { MarkdownBody } from "@/components/marketing/MarkdownBody";
import {
  articleSchema,
  extractFaqsFromMarkdown,
  faqPageSchema,
  jsonLdScript,
} from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { absoluteUrl } from "@/lib/site";
import { getSupabasePublicSiteClient } from "@/lib/supabase/server";

/** Always fetch from Supabase so CMS/seed updates appear immediately (no ISR stale window). */
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const supabase = getSupabasePublicSiteClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("resources")
    .select("slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((row: { slug: string }) => ({ slug: row.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabasePublicSiteClient();
  if (!supabase) return {};
  const { data: item } = await supabase
    .from("resources")
    .select("title, excerpt, image_url, published_at, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (!item) return {};

  const ogImage = item.image_url?.startsWith("http")
    ? item.image_url
    : item.image_url
      ? absoluteUrl(item.image_url)
      : undefined;

  return pageMeta({
    title: item.title,
    description: item.excerpt,
    path: `/site/resources/${slug}`,
    ogImage,
    ogImageAlt: item.title,
    article: {
      publishedTime: item.published_at || undefined,
      modifiedTime: item.updated_at || item.published_at || undefined,
    },
  });
}

export default async function ResourceArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getSupabasePublicSiteClient();
  if (!supabase) notFound();

  const { data: item } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!item) notFound();

  const publishedFormatted = item.published_at
    ? new Date(item.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const updatedFormatted = item.updated_at
    ? new Date(item.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const faqs =
    typeof item.content === "string"
      ? extractFaqsFromMarkdown(item.content)
      : [];
  const faqLd = faqPageSchema(faqs);

  const jsonLdImageUrl =
    item.image_url &&
    (item.image_url.startsWith("http")
      ? item.image_url
      : absoluteUrl(item.image_url));

  const ld = jsonLdScript([
    articleSchema({
      headline: item.title,
      description: item.excerpt,
      slug,
      datePublished: item.published_at || undefined,
      dateModified: item.updated_at || item.published_at || undefined,
      imageUrl: jsonLdImageUrl || undefined,
    }),
    ...(faqLd ? [faqLd] : []),
  ]);

  const heroSrc =
    item.image_url?.startsWith("http") ? item.image_url : item.image_url || "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Resources", path: "/site/resources" },
          { name: item.title, path: `/site/resources/${slug}` },
        ]}
      />

      <Link
        href="/site/resources"
        className="mb-8 inline-flex items-center text-sm font-medium transition hover:opacity-80"
        style={{ color: "var(--color-primary-ref)" }}
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Resources
      </Link>

      <div className="flex flex-wrap gap-2" aria-label="Resource tags">
        {(item.tags || []).map((tag: string) => (
          <span
            key={tag}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "var(--color-primary-ref)",
              color: "white",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {heroSrc && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-neutral-100 shadow-sm">
          <Image
            src={heroSrc}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            loading="lazy"
          />
        </div>
      )}
      <header className="mt-4">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{item.title}</h1>
        <div className="mt-2 flex flex-col gap-1 text-sm text-neutral-500 sm:flex-row sm:flex-wrap sm:gap-x-6">
          {item.published_at && publishedFormatted && (
            <time dateTime={item.published_at}>
              Published {publishedFormatted}
            </time>
          )}
          {item.updated_at && updatedFormatted && (
            <time dateTime={item.updated_at}>
              Last updated {updatedFormatted}
            </time>
          )}
        </div>
      </header>

      <aside
        className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        aria-labelledby="resource-tldr"
      >
        <h2 id="resource-tldr" className="text-base font-semibold text-neutral-900">
          TL;DR
        </h2>
        <p className="mt-2 text-sm text-neutral-700">{item.excerpt}</p>
      </aside>

      <div className="mt-8 max-w-none">
        <p className="text-lg text-neutral-600">{item.excerpt}</p>
        {item.content && (
          <MarkdownBody className="mt-6">{item.content}</MarkdownBody>
        )}
        {item.file_url && (
          <div className="mt-8 rounded-lg bg-blue-50 p-4">
            <a
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-primary-ref)" }}
            >
              Download document
            </a>
          </div>
        )}
      </div>

      <ContinueExploring />
    </article>
  );
}
