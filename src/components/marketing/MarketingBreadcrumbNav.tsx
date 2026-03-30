"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  site: "Home",
  about: "About",
  contact: "Contact",
  services: "Services",
  newsroom: "Newsroom",
  resources: "Resources",
  login: "Login",
  register: "Register",
  "air-freight": "Air Freight",
  "customs-documents": "Customs & Documents",
};

function labelForSegment(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  return seg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function MarketingBreadcrumbNav() {
  const pathname = usePathname() || "";
  if (!pathname.startsWith("/site")) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const items: { href: string; label: string }[] = [{ href: "/site", label: "Home" }];

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    if (i === 0) continue;
    items.push({
      href: acc,
      label: labelForSegment(segments[i]),
    });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-neutral-100 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
          {items.map((item, idx) => (
            <li key={item.href} className="flex items-center gap-2">
              {idx > 0 && (
                <span className="text-neutral-400" aria-hidden>
                  /
                </span>
              )}
              {idx === items.length - 1 ? (
                <span className="font-medium text-neutral-900">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="transition hover:text-neutral-900 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
