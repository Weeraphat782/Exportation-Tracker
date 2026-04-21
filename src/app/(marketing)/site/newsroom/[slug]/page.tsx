import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContinueExploring } from "@/components/marketing/ContinueExploring";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import { MarkdownBody } from "@/components/marketing/MarkdownBody";
import {
  blogPostingSchema,
  extractFaqsFromMarkdown,
  faqPageSchema,
  jsonLdScript,
} from "@/lib/json-ld";
import { getArticleBySlug, getPublishedArticlesList } from "@/lib/newsroom-data";
import { pageMeta } from "@/lib/page-meta";
import { absoluteUrl } from "@/lib/site";

/** Cached article HTML; use `revalidateTag('news:list')` + `revalidateTag('news:article:<slug>')` on publish. */
export const revalidate = 3600;

/** Normalize DB `image_url` for next/image (trim, protocol-relative, root-relative). */
function normalizeNewsImageSrc(url: string | null | undefined): string {
  if (url == null || typeof url !== "string") return "";
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("//")) return `https:${t}`;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

export async function generateStaticParams() {
  const rows = await getPublishedArticlesList();
  return rows.slice(0, 50).map((row) => ({ slug: row.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getArticleBySlug(slug);
  if (!item) return {};

  const rawImg = item.image_url?.trim();
  const ogImage = rawImg
    ? rawImg.startsWith("//")
      ? `https:${rawImg}`
      : /^https?:\/\//i.test(rawImg)
        ? rawImg
        : absoluteUrl(rawImg)
    : undefined;

  return pageMeta({
    title: item.title,
    description: item.excerpt,
    path: `/site/newsroom/${slug}`,
    ogImage,
    ogImageAlt: item.title,
    article: {
      publishedTime: item.published_at || undefined,
      modifiedTime: item.updated_at || item.published_at || undefined,
    },
  });
}

export default async function NewsroomArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getArticleBySlug(slug);
  if (!item) notFound();

  const formattedDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const formattedUpdated = item.updated_at
    ? new Date(item.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const wordCount =
    typeof item.content === "string"
      ? item.content.split(/\s+/).filter(Boolean).length
      : undefined;

  const faqs =
    typeof item.content === "string"
      ? extractFaqsFromMarkdown(item.content)
      : [];
  const faqLd = faqPageSchema(faqs);

  const normHero = normalizeNewsImageSrc(item.image_url);
  const jsonLdImageUrl =
    normHero &&
    (normHero.startsWith("http") ? normHero : absoluteUrl(normHero));

  const ld = jsonLdScript([
    blogPostingSchema({
      headline: item.title,
      description: item.excerpt,
      slug,
      datePublished: item.published_at || new Date().toISOString(),
      dateModified: item.updated_at || item.published_at || undefined,
      imageUrl: jsonLdImageUrl || undefined,
      wordCount,
    }),
    ...(faqLd ? [faqLd] : []),
  ]);

  const heroSrc = normHero;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Newsroom", path: "/site/newsroom" },
          { name: item.title, path: `/site/newsroom/${slug}` },
        ]}
      />

      <div className="mb-8 flex flex-col gap-2">
        <Link
          href="/site/newsroom"
          className="inline-flex w-fit items-center text-sm font-medium transition hover:opacity-80"
          style={{ color: "var(--color-primary-ref)" }}
        >
          <svg
            className="mr-2 h-4 w-4 shrink-0"
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
          Back to Newsroom
        </Link>
        {formattedDate && (
          <time
            dateTime={item.published_at ?? undefined}
            className="block text-sm font-medium"
            style={{ color: "var(--color-primary-ref)" }}
          >
            Published {formattedDate}
          </time>
        )}
        {item.updated_at && formattedUpdated && (
          <time
            dateTime={item.updated_at ?? undefined}
            className="block text-sm text-neutral-500"
          >
            Last updated {formattedUpdated}
          </time>
        )}
      </div>
      {heroSrc && (
        <div className="relative mb-8 w-full overflow-hidden rounded-xl bg-neutral-100 aspect-[16/9] min-h-[200px]">
          <Image
            src={heroSrc}
            alt={item.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}
      <header>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
          {item.title}
        </h1>
      </header>

      <aside
        className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        aria-labelledby="article-tldr"
      >
        <h2 id="article-tldr" className="text-base font-semibold text-neutral-900">
          TL;DR
        </h2>
        <p className="mt-2 text-sm text-neutral-700">{item.excerpt}</p>
      </aside>

      <div className="mt-8 max-w-none">
        <p className="text-lg leading-relaxed text-neutral-600">{item.excerpt}</p>
        {item.content && (
          <MarkdownBody className="mt-6">{item.content}</MarkdownBody>
        )}
      </div>

      <ContinueExploring />
    </article>
  );
}
