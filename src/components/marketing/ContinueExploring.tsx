import Link from "next/link";

export function ContinueExploring() {
  return (
    <section
      className="mt-16 border-t border-neutral-200 pt-12"
      aria-labelledby="continue-exploring-heading"
    >
      <h2
        id="continue-exploring-heading"
        className="text-xl font-semibold text-neutral-900"
      >
        Continue exploring
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/site/resources"
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-white"
        >
          Regulatory &amp; export resources
        </Link>
        <Link
          href="/site/newsroom"
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-white"
        >
          Latest newsroom updates
        </Link>
        <Link
          href="/site/contact"
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-white"
        >
          Talk to our logistics team
        </Link>
      </div>
    </section>
  );
}
