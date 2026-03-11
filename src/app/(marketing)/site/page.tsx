'use client';

import Link from "next/link";
import ServiceCard from "@/components/marketing/ServiceCard";
import { services } from "@/data/marketing-services";
import WorldMap from "@/components/marketing/WorldMap";
import EdgeCarousel from "@/components/marketing/EdgeCarousel";
import PartnerSection from "@/components/marketing/PartnerSection";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import CarrierBoard from "@/components/marketing/CarrierBoard";

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

export default function MarketingHomePage() {
  useScrollReveal();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=2000&auto=format&fit=crop"
          alt="Cargo aircraft on airport tarmac"
          className="absolute inset-0 h-full w-full object-cover opacity-60 animate-fade-in"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/60 to-transparent"
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left animate-fade-in-up">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Specialized Air Freight
                <br />
                <span style={{ color: "#86ef6c" }}>
                  & Global Logistics
                </span>
              </h1>
              <p className="mt-6 text-lg text-neutral-300 stagger-1">
                End-to-end logistics solutions for time-sensitive and
                temperature-controlled cargo. From air freight and customs clearance
                to GDP warehousing—we deliver reliability, compliance, and documented
                handling across your supply chain.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start stagger-2">
                <Link
                  href="/site/contact"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-6 py-3 text-base font-semibold text-white transition hover:brightness-110 active:scale-95"
                  style={{
                    backgroundColor: "var(--color-accent-ref)",
                  }}
                >
                  Request a Quote
                </Link>
                <Link
                  href="/site/services"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 active:scale-95"
                >
                  View Services
                </Link>
              </div>
            </div>

            {/* Shipping Status Board */}
            <CarrierBoard />
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900">
              Our Services
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
              Comprehensive logistics solutions tailored to pharmaceutical,
              perishable, and time-critical cargo. Click any service below to
              learn more.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
              className="inline-flex items-center text-sm font-semibold transition hover:opacity-80"
              style={{ color: "var(--color-accent-ref)" }}
            >
              View all services
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
          </div>
        </div>
      </section>

      {/* Our Edge - AI Document Management & Cantrak */}
      <section className="bg-white py-20 reveal-on-scroll">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Carousel */}
            <EdgeCarousel />
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                Our Edge: AI-Powered Document Intelligence
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
              <Link
                href="/site/contact"
                className="mt-6 inline-flex items-center text-sm font-semibold transition hover:opacity-80"
                style={{ color: "var(--color-accent-ref)" }}
              >
                Discuss your requirements
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
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="bg-white py-20 reveal-on-scroll">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold uppercase tracking-wider text-neutral-500">
            Destinations We Serve
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600">
            We have shipped to Switzerland, Portugal, Australia, Czech Republic,
            North Macedonia, South Africa, and Uganda.
          </p>
          <div className="mt-12">
            <WorldMap />
          </div>
        </div>
      </section>

      {/* NIA Partner Section */}
      <PartnerSection />
    </>
  );
}
