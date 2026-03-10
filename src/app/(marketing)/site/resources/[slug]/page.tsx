import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resourcesData } from "@/data/marketing-resources";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return resourcesData.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const item = resourcesData.find((i) => i.slug === slug);
    if (!item) return {};
    return {
        title: `${item.title} | OMG Experience`,
        description: item.excerpt,
        openGraph: {
            title: item.title,
            description: item.excerpt,
        },
    };
}

export default async function ResourceArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const item = resourcesData.find((i) => i.slug === slug);
    if (!item) notFound();

    return (
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <Link
                href="/site/resources"
                className="mb-8 inline-flex items-center text-sm font-medium transition hover:opacity-80"
                style={{ color: "var(--color-primary-ref)" }}
            >
                <svg
                    className="mr-2 h-4 w-4"
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
                Back to Resources
            </Link>
            <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
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
            <h1 className="mt-4 text-3xl font-bold text-neutral-900">{item.title}</h1>
            <div className="prose prose-neutral mt-8 max-w-none">
                <p className="text-lg text-neutral-600">{item.excerpt}</p>
                <p className="mt-4 text-neutral-600">
                    Full reading instructions content will be managed via CMS integration.
                </p>
            </div>
        </article>
    );
}
