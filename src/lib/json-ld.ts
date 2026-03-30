import {
  absoluteUrl,
  BRAND_NAME,
  BRAND_LEGAL_NAME,
  getSiteUrl,
} from "@/lib/site";

type JsonLdGraph = Record<string, unknown>;

export function jsonLdScript(graph: JsonLdGraph | JsonLdGraph[]) {
  const data = Array.isArray(graph)
    ? { "@context": "https://schema.org", "@graph": graph }
    : graph;
  return JSON.stringify(data);
}

export function organizationSchema(): JsonLdGraph {
  return {
    "@type": "Organization",
    "@id": `${getSiteUrl()}/#organization`,
    name: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    url: getSiteUrl(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo.png"),
    },
    description:
      "Specialized air freight and pharmaceutical-grade logistics for time-sensitive, temperature-controlled, and compliance-critical cargo.",
    sameAs: [
      "https://www.linkedin.com/company/omgexp",
      "https://x.com/omgexp",
    ],
  };
}

export function websiteSchema(): JsonLdGraph {
  return {
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: BRAND_NAME,
    url: getSiteUrl(),
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    inLanguage: "en-US",
  };
}

export function breadcrumbListSchema(
  items: { name: string; path: string }[],
): JsonLdGraph {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingSchema(input: {
  headline: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string | null;
  wordCount?: number;
}): JsonLdGraph {
  const url = absoluteUrl(`/site/newsroom/${input.slug}`);
  return {
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: {
      "@type": "Organization",
      name: `${BRAND_NAME} Editorial`,
    },
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    inLanguage: "en-US",
    ...(input.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: input.imageUrl,
          },
        }
      : {}),
    ...(input.wordCount != null ? { wordCount: input.wordCount } : {}),
  };
}

export function articleSchema(input: {
  headline: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string | null;
}): JsonLdGraph {
  const url = absoluteUrl(`/site/resources/${input.slug}`);
  return {
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(input.datePublished
      ? { datePublished: input.datePublished }
      : {}),
    ...(input.dateModified
      ? { dateModified: input.dateModified }
      : {}),
    author: {
      "@type": "Organization",
      name: `${BRAND_NAME} Editorial`,
    },
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    inLanguage: "en-US",
    ...(input.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: input.imageUrl,
          },
        }
      : {}),
  };
}

export function webPageSchema(input: {
  path: string;
  name: string;
  description: string;
}): JsonLdGraph {
  const url = absoluteUrl(input.path);
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    inLanguage: "en-US",
  };
}

export function itemListSchema(
  name: string,
  items: { name: string; url: string }[],
): JsonLdGraph {
  return {
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
