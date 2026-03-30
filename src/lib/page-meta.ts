import type { Metadata } from "next";
import {
  BRAND_NAME,
  absoluteUrl,
  getDefaultOgImageUrl,
} from "@/lib/site";

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogImageAlt?: string;
  robots?: Metadata["robots"];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
  };
}): Metadata {
  const title = opts.title;
  const description = opts.description;
  const url = absoluteUrl(opts.path);
  const og = opts.ogImage || getDefaultOgImageUrl();
  const imgAlt = opts.ogImageAlt || opts.title;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.article ? "article" : "website",
      title,
      description,
      url,
      siteName: BRAND_NAME,
      locale: "en_US",
      images: [
        {
          url: og,
          width: 1200,
          height: 630,
          alt: imgAlt,
        },
      ],
      ...(opts.article?.publishedTime
        ? { publishedTime: opts.article.publishedTime }
        : {}),
      ...(opts.article?.modifiedTime
        ? { modifiedTime: opts.article.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: og, alt: imgAlt }],
    },
    ...(opts.robots ? { robots: opts.robots } : {}),
  };
}
