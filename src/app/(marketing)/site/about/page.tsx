import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import { jsonLdScript, webPageSchema } from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { BRAND_NAME } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "About Us",
  description:
    "From GSA and airline distribution heritage to specialized pharmaceutical-grade logistics—industry expertise and routing intelligence at OMG Experience.",
  path: "/site/about",
});

export const dynamic = "force-static";

export default function AboutPage() {
  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/about",
      name: `About ${BRAND_NAME}`,
      description:
        "Heritage in airline distribution and GSA, now focused on pharmaceutical-grade logistics and AI-assisted documentation.",
    }),
  ]);

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "About", path: "/site/about" },
        ]}
      />
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">About Us</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
      </header>

      <div className="relative mt-8 aspect-video overflow-hidden rounded-xl bg-neutral-100 shadow-md">
        <Image
          src="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=1200&auto=format&fit=crop"
          alt="International air freight hub with cargo aircraft and ground handling equipment"
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
          loading="lazy"
        />
      </div>

      <section className="mt-12" aria-labelledby="about-heritage">
        <h2 id="about-heritage" className="text-xl font-semibold text-neutral-900">
          From airline distribution to specialized logistics
        </h2>
        <p className="mt-4 text-neutral-600">
          {BRAND_NAME} has built its expertise on a foundation of traditional airline
          distribution and GSA (General Sales Agent) heritage. Our deep understanding
          of aviation networks and cargo operations has enabled us to transition into
          specialized pharmaceutical-grade logistics.
        </p>
        <p className="mt-4 text-neutral-600">
          Today, we combine that legacy with modern technology to deliver speed,
          compliance, and traceability for every shipment.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="about-intel">
        <h2 id="about-intel" className="text-xl font-semibold text-neutral-900">
          What does routing intelligence mean for you?
        </h2>
        <p className="mt-4 text-neutral-600">
          Our parent company&apos;s airline knowledge provides unique access to routing
          intelligence and capacity insights. This translates into documentation and
          visibility via the Export Portal for your most critical shipments—whether
          time-sensitive pharmaceuticals, specialized equipment, or high-value cargo.
        </p>
        <p className="mt-4 text-neutral-600">
          We leverage industry data and relationships to optimize every route,
          document, and handoff.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="about-values">
        <h2 id="about-values" className="text-xl font-semibold text-neutral-900">
          Our values
        </h2>
        <ul className="mt-4 space-y-2 text-neutral-600">
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-accent-ref)" }}
            />
            <span>Professionalism and reliability</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-accent-ref)" }}
            />
            <span>Regulatory compliance and transparency</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-accent-ref)" }}
            />
            <span>Technology-driven traceability</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--color-accent-ref)" }}
            />
            <span>Customer-focused service</span>
          </li>
        </ul>
      </section>

      <p className="mt-12 text-center">
        <Link
          href="/site/contact"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary-ref)" }}
        >
          Contact {BRAND_NAME}
        </Link>
      </p>
    </article>
  );
}
