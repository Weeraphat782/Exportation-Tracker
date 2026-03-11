"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

    return (
        <header className="border-b border-neutral-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4 sm:px-8 lg:px-10">
                {/* Logo - large, on white for prominence */}
                <Link href="/site" className="flex shrink-0 items-center">
                    <Image
                        src="/logo.png"
                        alt="OMGEXP"
                        width={360}
                        height={112}
                        priority
                        className="h-12 w-auto sm:h-14 lg:h-16 xl:h-[68px] xl:w-auto"
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
                        className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 sm:inline-block"
                        style={{
                            backgroundColor: "var(--color-primary-ref)",
                            color: "white",
                        }}
                    >
                        Register
                    </Link>
                    <Link
                        href="/site/login"
                        className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 sm:inline-block"
                        style={{
                            backgroundColor: "var(--color-accent-ref)",
                            color: "white",
                        }}
                    >
                        Login
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex h-11 w-11 items-center justify-center rounded md:hidden"
                        style={{ color: "var(--color-primary-ref)" }}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <svg
                            className="h-6 w-6"
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
            {mobileMenuOpen && (
                <div
                    className="border-t border-neutral-200 bg-neutral-50 px-4 py-4 md:hidden"
                >
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded px-4 py-3 transition hover:bg-neutral-100"
                                style={{ color: "var(--color-primary-ref)" }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/site/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="mt-4 block rounded-lg px-4 py-3 text-center font-semibold text-white"
                            style={{ backgroundColor: "var(--color-accent-ref)" }}
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
