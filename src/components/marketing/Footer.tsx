"use client";

import Link from "next/link";
import Image from "next/image";
import { BRAND_NAME } from "@/lib/site";
import { trackCtaClick } from "@/lib/analytics";

const navLinks = [
    { href: "/site", label: "Home" },
    { href: "/site/services", label: "Services" },
    { href: "/site/newsroom", label: "Newsroom" },
    { href: "/site/resources", label: "Resources" },
    { href: "/site/about", label: "About Us" },
    { href: "/site/contact", label: "Contact Us" },
];

const serviceLinks = [
    { href: "/site/services/air-freight", label: "Air Freight" },
    { href: "/site/services/customs-documents", label: "Customs & Documents" },
    { href: "/site/services#gdp-warehousing", label: "GDP Warehousing" },
    { href: "/site/services#controlled-temperature-transport", label: "Cold Chain Transport" },
];

const linkedInUrl = "https://www.linkedin.com/company/omgexp";
const xUrl = "https://x.com/omgexp";

export default function Footer() {
    return (
        <footer style={{ backgroundColor: "var(--color-primary-ref)" }}>
            {/* Top accent line */}
            <div
                className="h-0.5 w-full"
                style={{ background: "linear-gradient(90deg, var(--color-accent-ref), #86ef6c, var(--color-accent-ref))" }}
            />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-3 sm:gap-12">
                    {/* Brand Column */}
                    <div>
                        <Link href="/site" className="inline-block mb-4">
                            <Image
                                src="/logo.png"
                                alt={`${BRAND_NAME} logo`}
                                width={220}
                                height={68}
                                className="h-12 w-auto brightness-0 invert"
                            />
                        </Link>
                        <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
                            Specialized air freight and global logistics for time-sensitive,
                            temperature-controlled, and compliance-critical cargo.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <a
                                href={linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
                                aria-label="LinkedIn"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                            <a
                                href={xUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
                                aria-label="X (Twitter)"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
                            Navigation
                        </h3>
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group inline-flex min-h-[44px] items-center gap-1.5 text-sm text-white/80 transition-all hover:text-white"
                                >
                                    <span
                                        className="h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-3"
                                        style={{ backgroundColor: "var(--color-accent-ref)" }}
                                    />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Services Column */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">
                            Services
                        </h3>
                        <nav className="flex flex-col gap-2 mb-8">
                            {serviceLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group inline-flex min-h-[44px] items-center gap-1.5 text-sm text-white/80 transition-all hover:text-white"
                                >
                                    <span
                                        className="h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-3"
                                        style={{ backgroundColor: "var(--color-accent-ref)" }}
                                    />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <Link
                            href="/site/contact"
                            onClick={() => trackCtaClick("Request a Quote", "footer")}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg"
                            style={{ backgroundColor: "var(--color-accent-ref)" }}
                        >
                            Request a Quote
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                    <p className="text-xs text-white/50">
                        &copy; {new Date().getFullYear()} OMG Experience Co., Ltd. All rights reserved.
                    </p>
                    <p className="text-xs text-white/30">
                        Supported by the National Innovation Agency (NIA), Thailand
                    </p>
                </div>
            </div>
        </footer>
    );
}
