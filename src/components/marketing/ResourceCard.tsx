import Link from "next/link";

interface ResourceCardProps {
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    imageUrl?: string;
}

export default function ResourceCard({
    slug,
    title,
    excerpt,
    tags,
    imageUrl,
}: ResourceCardProps) {
    return (
        <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:shadow-md lg:flex">
            {imageUrl && (
                <div className="shrink-0 lg:w-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={title}
                        className="h-48 w-full object-cover lg:h-full"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                                backgroundColor: "var(--color-primary-ref)",
                                color: "white",
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-neutral-900">
                    <Link
                        href={`/site/resources/${slug}`}
                        className="hover:underline"
                        style={{ color: "inherit" }}
                    >
                        {title}
                    </Link>
                </h2>
                <p className="mt-3 text-neutral-600">{excerpt}</p>
                <Link
                    href={`/site/resources/${slug}`}
                    className="mt-4 inline-flex items-center text-sm font-medium"
                    style={{ color: "var(--color-accent-ref)" }}
                >
                    Read instructions
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
        </article>
    );
}
