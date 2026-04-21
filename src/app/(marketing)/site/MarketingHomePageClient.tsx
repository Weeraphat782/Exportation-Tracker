'use client';

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import ServiceCard from "@/components/marketing/ServiceCard";
import { services } from "@/data/marketing-services";
import { ContinueExploring } from "@/components/marketing/ContinueExploring";
import PartnerSection from "@/components/marketing/PartnerSection";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { trackCtaClick } from "@/lib/analytics";

import WorldMapDeferred from "@/components/marketing/WorldMapDeferred";
/** Embla + indicators must be client-only to avoid SSR/client HTML mismatch (hydration errors). */
const EdgeCarousel = dynamic(() => import("@/components/marketing/EdgeCarousel"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video animate-pulse rounded-xl bg-neutral-200" aria-hidden />
  ),
});
/** Client-only: CarrierBoard uses next/image + fetch; SSR vs first paint can mismatch (hydration warnings). */
const CarrierBoard = dynamic(() => import("@/components/marketing/CarrierBoard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[280px] w-full animate-pulse rounded-xl bg-white/5" aria-hidden />
  ),
});

const serviceIcons: Record<string, React.ReactNode> = {
  "specialized-air-freight": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  "shipping-customs": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "gdp-warehousing": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  "controlled-temperature-transport": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
  ),
};

const stats = [
  {
    value: "7+",
    label: "Countries Served",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "GDP",
    label: "Certified Handling",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    value: "AI",
    label: "Document Intelligence",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function MarketingHomePageClient() {
  useScrollReveal();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] overflow-hidden sm:min-h-[80vh]">
        <Image
          src="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=2000&auto=format&fit=crop"
          alt="Cargo aircraft on airport tarmac"
          fill
          priority
          fetchPriority="high"
          className="object-cover opacity-55 animate-fade-in"
          sizes="100vw"
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/80 via-neutral-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left animate-fade-in-up">
              {/* Trust badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-accent-ref)" }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  GDP Certified · Pharma Grade Logistics
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Specialized Air Freight
                <br />
                <span className="gradient-text-accent">
                  & Global Logistics
                </span>
              </h1>
              <p className="mt-6 text-lg text-neutral-300 leading-relaxed">
                End-to-end logistics solutions for time-sensitive and
                temperature-controlled cargo. From air freight and customs clearance
                to GDP warehousing—we deliver reliability, compliance, and documented
                handling across your supply chain.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/site/contact"
                  onClick={() => trackCtaClick("Request a Quote", "hero")}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-7 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 animate-pulse-glow"
                  style={{
                    backgroundColor: "var(--color-accent-ref)",
                  }}
                >
                  Request a Quote
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/site/services"
                  onClick={() => trackCtaClick("View Services", "hero")}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/30 px-7 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/50 active:scale-95"
                >
                  View Services
                </Link>
              </div>
            </div>

            {/* Shipping Status Board */}
            <CarrierBoard />
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-900 to-transparent" />
      </section>

      {/* Stats Strip */}
      <section className="bg-neutral-900 py-10 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-px sm:grid-cols-3 rounded-xl overflow-hidden">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`stat-card bg-neutral-800/50 px-4 py-5 text-center reveal-on-scroll stagger-${i + 1} sm:px-8 sm:py-8 flex flex-col items-center`}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(91,191,33,0.15)", color: "var(--color-accent-ref)" }}
                >
                  {stat.icon}
                </div>
                <div
                  className="text-3xl font-black tracking-tight"
                  style={{ color: "var(--color-accent-ref)" }}
                >
                  {stat.value}
                </div>
                <div className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside
        className="border-b border-neutral-200 bg-neutral-50"
        aria-labelledby="home-tldr-heading"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h2 id="home-tldr-heading" className="sr-only">
            Quick links
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/site/newsroom"
              className="group flex min-h-[44px] flex-1 flex-col justify-center rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
            >
              <span className="text-base font-semibold text-neutral-900">
                Newsroom
              </span>
              <span className="mt-1 text-sm text-neutral-600">
                Latest logistics updates
              </span>
              <span
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--color-accent-ref)" }}
              >
                Read more
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </Link>
            <Link
              href="/site/resources"
              className="group flex min-h-[44px] flex-1 flex-col justify-center rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
            >
              <span className="text-base font-semibold text-neutral-900">
                Resources
              </span>
              <span className="mt-1 text-sm text-neutral-600">
                Regulatory and export guides
              </span>
              <span
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--color-accent-ref)" }}
              >
                Browse guides
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Services Grid */}
      <section className="bg-neutral-50 py-12 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center reveal-on-scroll">
            <div className="accent-bar mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Our Services
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
              Comprehensive logistics solutions tailored to pharmaceutical,
              perishable, and time-critical cargo.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`reveal-on-scroll stagger-${(index % 4) + 1}`}
              >
                <ServiceCard
                  title={service.title}
                  description={service.shortDescription}
                  icon={serviceIcons[service.id]}
                  imageUrl={service.imageUrl}
                  href={`/site/services#${service.id}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/site/services"
              className="group inline-flex min-h-[44px] items-center gap-1 rounded-md px-1 py-2 text-sm font-semibold transition hover:opacity-80"
              style={{ color: "var(--color-accent-ref)" }}
            >
              View all services
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Our Edge - AI Document Management */}
      <section className="relative py-12 overflow-hidden sm:py-24" style={{ background: "linear-gradient(160deg, #f8faff 0%, #ffffff 50%, #f0f7f0 100%)" }}>
        {/* Decorative background blobs */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "var(--color-primary-ref)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "var(--color-accent-ref)" }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            {/* Carousel */}
            <div className="reveal-slide-left">
              <EdgeCarousel />
            </div>
            <div className="reveal-slide-right">
              <div className="accent-bar mb-5" />
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Our Edge: AI-Powered
                <br />
                <span style={{ color: "var(--color-primary-ref)" }}>
                  Document Intelligence
                </span>
              </h2>
              <p className="mt-6 text-neutral-600 leading-relaxed">
                Before your shipment departs, our AI-powered platform manages,
                reviews, and verifies every document in your export workflow.
                From customs declarations to compliance permits, the system
                identifies errors, flags missing requirements, and ensures
                complete documentation—reducing delays and border rejections.
              </p>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                The platform interprets regional regulations, learns from your
                shipping history, and proactively suggests corrections. Ship with
                confidence knowing your documentation is verified before it
                reaches customs.
              </p>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                Integrated with Cantrak for batch verification, we streamline
                high-volume document processing to support scalable operations.
              </p>

              {/* Feature pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["Error Detection", "Compliance Check", "Batch Processing", "Region Rules"].map((f) => (
                  <span
                    key={f}
                    className="rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{
                      borderColor: "var(--color-primary-ref)",
                      color: "var(--color-primary-ref)",
                      backgroundColor: "rgba(33,84,151,0.05)",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <Link
                href="/site/contact"
                onClick={() => trackCtaClick("Discuss your requirements", "edge-section")}
                className="group mt-8 inline-flex min-h-[44px] items-center gap-1 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-primary-ref)" }}
              >
                Discuss your requirements
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="bg-white py-8 reveal-on-scroll sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="accent-bar mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Destinations We Serve
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
              Connecting Thailand to global markets across Europe, Oceania, and Africa —
              with compliant, documented air freight on every route.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(33,84,151,0.25),0_8px_24px_-8px_rgba(0,0,0,0.15)]">
            <WorldMapDeferred />
          </div>
        </div>
      </section>

      {/* NIA Partner Section */}
      <PartnerSection />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ContinueExploring />
      </div>
    </>
  );
}
