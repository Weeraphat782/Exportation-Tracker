import Link from "next/link";

const pinnedAnnouncement = {
    title: "OMG Experience Expands European Air Freight Routes — New direct services to Zurich, Lisbon, and Warsaw",
    slug: "new-european-routes-2025",
};

export default function TopBar() {
    return (
        <div
            className="flex min-h-[40px] items-center justify-center border-b border-white/20 px-6 py-2 text-center text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary-ref)" }}
        >
            <span className="flex items-center gap-2 line-clamp-1">
                <svg className="h-3.5 w-3.5 shrink-0 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-semibold" style={{ color: "var(--color-accent-ref)" }}>New:&nbsp;</span>
                {pinnedAnnouncement.title}{" "}
                <Link
                    href={`/site/newsroom/${pinnedAnnouncement.slug}`}
                    className="shrink-0 font-bold underline underline-offset-2 transition hover:opacity-90 active:opacity-80"
                    style={{ color: "var(--color-accent-ref)" }}
                >
                    Read more →
                </Link>
            </span>
        </div>
    );
}
