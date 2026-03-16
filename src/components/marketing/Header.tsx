"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
    { href: "/site", label: "Home" },
    { href: "/site/services", label: "Services" },
    { href: "/site/newsroom", label: "Newsroom" },
    { href: "/site/resources", label: "Resources" },
    { href: "/site/about", label: "About Us" },
    { href: "/site/contact", label: "Contact Us" },
];

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-white/90 backdrop-blur-md shadow-md border-b border-neutral-200/60"
                    : "bg-white border-b border-neutral-200"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3 sm:px-8 lg:px-10">
                {/* Logo */}
                <Link href="/site" className="flex shrink-0 items-center">
                    <Image
                        src="/logo.png"
                        alt="OMGEXP"
                        width={360}
                        height={112}
                        priority
                        className="h-10 w-auto sm:h-12 lg:h-14 xl:h-[60px] xl:w-auto transition-all duration-300"
                    />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-8 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="nav-link inline-block text-sm font-medium"
                            style={{ color: "var(--color-primary-ref)" }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href="/site/register"
                        className="hidden rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-sm sm:inline-block"
                        style={{
                            borderColor: "var(--color-primary-ref)",
                            color: "var(--color-primary-ref)",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-primary-ref)";
                            (e.currentTarget as HTMLAnchorElement).style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "";
                            (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-primary-ref)";
                        }}
                    >
                        Register
                    </Link>
                    <Link
                        href="/site/login"
                        className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-sm active:scale-95 sm:inline-block"
                        style={{
                            backgroundColor: "var(--color-accent-ref)",
                        }}
                    >
                        Login
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-neutral-100 md:hidden"
                        style={{ color: "var(--color-primary-ref)" }}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <svg
                            className={`h-6 w-6 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className={`overflow-hidden transition-all duration-300 md:hidden ${
                    mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="border-t border-neutral-200 bg-white/95 backdrop-blur-sm px-4 py-4">
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-neutral-50"
                                style={{ color: "var(--color-primary-ref)" }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
                            <Link
                                href="/site/register"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 block rounded-lg px-4 py-3 text-center text-sm font-semibold border transition"
                                style={{
                                    borderColor: "var(--color-primary-ref)",
                                    color: "var(--color-primary-ref)",
                                }}
                            >
                                Register
                            </Link>
                            <Link
                                href="/site/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 block rounded-lg px-4 py-3 text-center text-sm font-semibold text-white"
                                style={{ backgroundColor: "var(--color-accent-ref)" }}
                            >
                                Login
                            </Link>
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}
