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

  const contactDetails = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: "Email",
      value: "info@omgexp.com",
      href: "mailto:info@omgexp.com",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: "Phone",
      value: "+66 2 XXX XXXX",
      href: "tel:+6620000000",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Location",
      value: "Bangkok, Thailand",
      href: null,
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Response time",
      value: "Within 1 business day",
      href: null,
    },
  ];

  return (
    <div className="bg-neutral-50 min-h-screen">
      <JsonLd data={ld} />
      <SeoBreadcrumbsJsonLd
        items={[
          { name: "Home", path: "/site" },
          { name: "Contact", path: "/site/contact" },
        ]}
      />

      {/* Hero strip */}
      <div className="border-b border-neutral-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="accent-bar mb-4" />
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">Contact Us</h1>
          <p className="mt-3 max-w-xl text-neutral-500">
            Request a quote for air freight, customs clearance, warehousing, or cold chain transport.
            Our team responds within one business day.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">

          {/* Left: contact details */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-neutral-400">
                  Get in touch
                </h2>
                <div className="space-y-5">
                  {contactDetails.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "rgba(33,84,151,0.08)", color: "var(--color-primary-ref)" }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="mt-0.5 text-sm font-medium text-neutral-800 hover:underline"
                            style={{ color: "var(--color-primary-ref)" }}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="mt-0.5 text-sm font-medium text-neutral-800">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services quick list */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-400">
                  Our services
                </h2>
                <ul className="space-y-2 text-sm text-neutral-600">
                  {["Specialized Air Freight", "Shipping & Customs", "GDP Warehousing", "Cold Chain Transport"].map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--color-accent-ref)" }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Right: form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-1 text-lg font-bold text-neutral-900">Send us a message</h2>
              <p className="mb-6 text-sm text-neutral-500">Fill in the form and we&apos;ll get back to you promptly.</p>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
