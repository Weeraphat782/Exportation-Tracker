import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import {
  itemListSchema,
  jsonLdScript,
  webPageSchema,
} from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { absoluteUrl, BRAND_NAME } from "@/lib/site";
import { ContinueExploring } from "@/components/marketing/ContinueExploring";
import { services } from "@/data/marketing-services";

export const metadata: Metadata = pageMeta({
  title: "Services",
  description:
    "Specialized air freight, shipping & customs, GDP warehousing, and controlled temperature transport—end-to-end logistics from OMG Experience.",
  path: "/site/services",
});

export const dynamic = "force-static";

export default function ServicesPage() {
  const reviewed = new Date().toISOString().slice(0, 10);
  const serviceSlugMap: Record<string, string> = {
    "specialized-air-freight": "/site/services/air-freight",
    "shipping-customs": "/site/services/customs-documents",
  };
  const listItems = services.map((s) => ({
    name: s.title,
    url: absoluteUrl(serviceSlugMap[s.id] || `/site/services#${s.id}`),
  }));

  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/services",
      name: `${BRAND_NAME} services overview`,
      description:
        "Air freight, customs and documents, GDP warehousing, and cold-chain transport.",
    }),
    itemListSchema(`${BRAND_NAME} service lines`, listItems),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Services", path: "/site/services" },
        ]}
      />

      <header>
        <p className="text-sm text-neutral-500">Last updated: {reviewed}</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">Our Services</h1>
        <p className="mt-4 text-lg text-neutral-600">
          {BRAND_NAME} delivers end-to-end logistics for specialized air freight, customs
          clearance, pharmaceutical-grade warehousing, and controlled temperature
          transport.
        </p>
      </header>

      <aside
        className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6"
        aria-labelledby="services-tldr"
      >
        <h2 id="services-tldr" className="text-lg font-semibold text-neutral-900">
          TL;DR
        </h2>
        <p className="mt-2 text-neutral-700">
          Four pillars—air freight, customs &amp; documents, GDP warehousing, and
          cold-chain transport—with documented handling and AI-assisted export
          documentation where applicable.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[min(100%,20rem)] max-w-lg text-left text-sm">
          <caption className="sr-only">At a glance: OMG Experience services</caption>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Modes
              </th>
              <td className="py-2 text-neutral-600">Air + bonded warehousing + road feeder</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Compliance
              </th>
              <td className="py-2 text-neutral-600">GDP-minded processes, traceability</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 font-medium text-neutral-800">
                Next step
              </th>
              <td className="py-2 text-neutral-600">
                <Link href="/site/contact" className="font-medium underline">
                  Request a quote
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </aside>

      <div className="relative mb-8 mt-10 aspect-[21/9] overflow-hidden rounded-xl bg-neutral-100 shadow-md">
        <Image
          src="https://images.unsplash.com/photo-1767868280782-fc108d087050?q=80&w=1600&auto=format&fit=crop"
          alt="Air cargo terminal with freight handling equipment and infrastructure"
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
          loading="lazy"
        />
      </div>

      <nav aria-label="Dedicated service landing pages" className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/site/services/air-freight"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
        >
          Air freight hub page
        </Link>
        <Link
          href="/site/services/customs-documents"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
        >
          Customs &amp; documents hub page
        </Link>
      </nav>

      <nav className="mb-16 flex flex-wrap gap-2" aria-label="Jump to service sections">
        {services.map((service) => (
          <a
            key={service.id}
            href={`#${service.id}`}
            className="inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition active:scale-95"
            style={{
              backgroundColor: "var(--color-primary-ref)",
              color: "white",
            }}
          >
            {service.title}
          </a>
        ))}
      </nav>

      <div className="space-y-24">
        {services.map((service) => (
          <section
            key={service.id}
            id={service.id}
            className="scroll-mt-24"
            aria-labelledby={`heading-${service.id}`}
          >
            <h2
              id={`heading-${service.id}`}
              className="text-2xl font-bold text-neutral-900"
            >
              {service.title}
            </h2>
            <p className="mt-4 text-neutral-600">{service.shortDescription}</p>
            <div className="mt-6 space-y-4 text-neutral-600">
              {service.fullDescription.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <Link
              href="/site/contact"
              className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold transition hover:opacity-80"
              style={{ color: "var(--color-accent-ref)" }}
            >
              Request a quote
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </section>
        ))}
      </div>

      <ContinueExploring />
    </div>
  );
}
