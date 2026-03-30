import Image from "next/image";
import Link from "next/link";

interface NewsCardProps {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    imageUrl?: string;
}

export default function NewsCard({ slug, title, date, excerpt, imageUrl }: NewsCardProps) {
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <article className="flex flex-col gap-6 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:shadow-md md:flex-row">
            {imageUrl && (
                <div className="relative h-48 w-full shrink-0 md:h-48 md:w-64">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 256px"
                        loading="lazy"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col p-6 md:p-8">
                <time
                    dateTime={date}
                    className="block text-sm font-medium"
                    style={{ color: "var(--color-primary-ref)" }}
                >
                    {formattedDate}
                </time>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-neutral-900">
                    <Link
                        href={`/site/newsroom/${slug}`}
                        className="hover:underline"
                        style={{ color: "inherit" }}
                    >
                        {title}
                    </Link>
                </h2>
                <p className="mt-3 leading-relaxed text-neutral-600">{excerpt}</p>
                <Link
                    href={`/site/newsroom/${slug}`}
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-md py-2 text-sm font-medium"
                    style={{ color: "var(--color-accent-ref)" }}
                >
                    Read more
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
