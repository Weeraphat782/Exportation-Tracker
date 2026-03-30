import type { Metadata } from "next";
import ContactForm from "@/components/marketing/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoBreadcrumbsJsonLd } from "@/components/seo/SeoBreadcrumbsJsonLd";
import { jsonLdScript, webPageSchema } from "@/lib/json-ld";
import { pageMeta } from "@/lib/page-meta";
import { BRAND_NAME } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Contact Us",
  description:
    "Request a quote for air freight, customs clearance, warehousing, or controlled temperature transport. The OMG Experience team responds within one business day.",
  path: "/site/contact",
});

export const dynamic = "force-static";

export default function ContactPage() {
  const ld = jsonLdScript([
    webPageSchema({
      path: "/site/contact",
      name: `Contact ${BRAND_NAME}`,
      description:
        "Request quotes and speak with the logistics team about air freight, customs, GDP warehousing, and cold chain.",
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Contact", path: "/site/contact" },
        ]}
      />
      <article>
        <header>
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">Contact Us</h1>
          <p className="mt-6 text-neutral-600">
            Request a quote for your air freight, customs clearance, warehousing, or
            controlled temperature transport requirements. Our team will respond within
            one business day.
          </p>
        </header>
        <section className="mt-10" aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="sr-only">
            Contact form
          </h2>
          <ContactForm />
        </section>
      </article>
    </div>
  );
}
