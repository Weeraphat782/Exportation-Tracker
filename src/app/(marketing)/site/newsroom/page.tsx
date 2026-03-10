import type { Metadata } from "next";
import NewsCard from "@/components/marketing/NewsCard";
import { newsroomData } from "@/data/marketing-news";

export const metadata: Metadata = {
    title: "Newsroom | OMG Experience",
    description:
        "Company announcements, route updates, and industry news from OMG Experience.",
};

export default function NewsroomPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Photo banner */}
            <div className="mb-8 aspect-[21/9] overflow-hidden rounded-xl bg-neutral-100 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/newsroom-hero.jpg"
                    alt="Logistics Industry News"
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-neutral-900">Newsroom</h1>
                <p className="mt-4 text-neutral-600">
                    Company announcements, route updates, and logistics industry news.
                </p>
            </div>
            <div className="space-y-8">
                {newsroomData.map((item) => (
                    <NewsCard key={item.slug} {...item} />
                ))}
            </div>
        </div>
    );
}
