import {
  absoluteUrl,
  BRAND_NAME,
  BRAND_LEGAL_NAME,
  DEFAULT_AUTHOR_NAME,
  getSiteUrl,
} from "@/lib/site";

type JsonLdGraph = Record<string, unknown>;

function editorialAuthorPerson(): JsonLdGraph {
  return {
    "@type": "Person",
    name: DEFAULT_AUTHOR_NAME,
    url: absoluteUrl("/site/about"),
    worksFor: { "@id": `${getSiteUrl()}/#organization` },
  };
}

/**
 * Parse markdown for `## FAQ` / `## Frequently Asked Questions` then `###` Q + body until next `###`.
 */
export function extractFaqsFromMarkdown(markdown: string): {
  question: string;
  answer: string;
}[] {
  if (!markdown?.trim()) return [];
  const lines = markdown.split(/\r?\n/);
  let inFaq = false;
  const faqs: { question: string; answer: string }[] = [];
  let currentQ: string | null = null;
  let currentA: string[] = [];

  const flush = () => {
    if (currentQ && currentA.length) {
      const answer = currentA.join("\n").trim();
      if (answer) faqs.push({ question: currentQ, answer });
    }
    currentQ = null;
    currentA = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      const title = h2[1].trim().toLowerCase();
      const isFaq =
        title.includes("faq") || title.includes("frequently asked");
      if (isFaq) {
        flush();
        inFaq = true;
        continue;
      }
      if (inFaq) {
        flush();
        inFaq = false;
      }
      continue;
    }
    if (!inFaq) continue;

    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      flush();
      currentQ = h3[1].trim();
      currentA = [];
      continue;
    }
    if (currentQ) {
      currentA.push(line);
    }
  }
  if (inFaq) flush();
  return faqs;
}

export function faqPageSchema(
  faqs: { question: string; answer: string }[],
): JsonLdGraph | null {
  if (!faqs.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/** FAQs for /site/services/air-freight — keep in sync with visible FAQ on that page. */
export const airFreightServiceFaqs: { question: string; answer: string }[] = [
  {
    question: "What is GDP-compliant air freight?",
    answer:
      "GDP (Good Distribution Practice) air freight means your pharmaceutical and temperature-sensitive cargo is handled, documented, and transferred according to internationally recognized quality standards for distribution. This includes traceable handoffs, appropriate storage conditions before flight, and alignment with regulatory expectations for medicinal products in transit.",
  },
  {
    question: "How long does pharmaceutical air freight from Thailand take?",
    answer:
      "Typical airport-to-airport transit for standard air freight is often 3–5 business days depending on destination, carrier, and routing. Express priority services may reduce that to roughly 1–3 business days. Final door delivery depends on customs clearance and local handling at destination.",
  },
  {
    question: "What temperature ranges are supported for pharma cargo?",
    answer:
      "We support controlled-temperature logistics aligned with common pharmaceutical needs, including cold chain (approximately 2–8°C) and controlled room temperature (approximately 15–25°C), using validated packaging and monitoring approaches where required. Exact ranges and packaging should be confirmed per shipment with our operations team.",
  },
  {
    question: "What documents are required for pharmaceutical air freight?",
    answer:
      "Requirements vary by product, destination, and regulator. Commonly you will need commercial invoice, packing list, and product-specific certificates or permits. For exports from Thailand, Thai FDA and customs documentation may apply. Our team can guide you through the checklist and coordinate with our customs and document services.",
  },
  {
    question: "How is chargeable weight calculated?",
    answer:
      "Airlines bill using chargeable weight: the greater of actual gross weight and volumetric (volume) weight. Volume weight is typically computed from dimensions using an industry divisor (for example L×W×H in cm ÷ 6,000 for many routes). Your quote on our platform reflects this automatically so pricing stays transparent.",
  },
  {
    question: "Do you offer cold chain monitoring for air shipments?",
    answer:
      "Yes. For temperature-sensitive and pharmaceutical air freight we emphasize documented cold chain handling, appropriate packaging, and status visibility through the journey where available. Discuss data loggers, passive or active containers, and lane-specific SOPs with our team when you book.",
  },
];

export function airFreightServiceSchema(): JsonLdGraph {
  const url = absoluteUrl("/site/services/air-freight");
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name: `${BRAND_NAME} pharmaceutical air freight`,
    serviceType: "Pharmaceutical air freight",
    description:
      "GDP-oriented air freight from Thailand for pharmaceutical, temperature-sensitive, and time-critical cargo, with cold chain awareness, compliance documentation support, and transparent chargeable weight pricing.",
    url,
    provider: { "@id": `${getSiteUrl()}/#organization` },
    areaServed: [
      { "@type": "Country", name: "Thailand" },
      { "@type": "Place", name: "Bangkok" },
    ],
  };
}

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
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
    },
    areaServed: [
      { "@type": "Country", name: "Thailand" },
      { "@type": "AdministrativeArea", name: "Southeast Asia" },
    ],
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
    author: editorialAuthorPerson(),
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
    author: editorialAuthorPerson(),
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
