import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { newsroomData } from "@/data/marketing-news";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return newsroomData.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const item = newsroomData.find((i) => i.slug === slug);
    if (!item) return {};
    return {
        title: `${item.title} | OMG Experience`,
        description: item.excerpt,
    };
}

export default async function NewsroomArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const item = newsroomData.find((i) => i.slug === slug);
    if (!item) notFound();

    const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-2">
                <Link
                    href="/site/newsroom"
                    className="inline-flex w-fit items-center text-sm font-medium transition hover:opacity-80"
                    style={{ color: "var(--color-primary-ref)" }}
                >
                    <svg
                        className="mr-2 h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to Newsroom
                </Link>
                <time
                    dateTime={item.date}
                    className="block text-sm font-medium"
                    style={{ color: "var(--color-primary-ref)" }}
                >
                    {formattedDate}
                </time>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-neutral-900">{item.title}</h1>
            <div className="prose prose-neutral mt-8 max-w-none">
                <p className="text-lg leading-relaxed text-neutral-600">{item.excerpt}</p>
                <p className="mt-4 leading-relaxed text-neutral-600">
                    Full article content will be managed via CMS integration.
                </p>
            </div>
        </article>
    );
}
