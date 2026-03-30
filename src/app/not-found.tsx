import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-neutral-50 px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-neutral-900">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-neutral-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/site"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Marketing home
        </Link>
        <Link
          href="/site/contact"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-white"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
