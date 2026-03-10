import type { Metadata } from "next";
import ResourcesList from "@/components/marketing/ResourcesList";
import { resourcesData, allTags } from "@/data/marketing-resources";

export const metadata: Metadata = {
    title: "Resources | OMG Experience",
    description:
        "Export and customs reading instructions. Guides for EU compliance, destination requirements, and documentation.",
};

export default function ResourcesPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Photo banner */}
            <div className="mb-8 aspect-[3/1] overflow-hidden rounded-lg bg-neutral-100 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop"
                    alt="Logistics Information Hub"
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-neutral-900">Resources</h1>
                <p className="mt-4 text-neutral-600">
                    Reading instructions for export and customs requirements. Filter by
                    category to find relevant guides for your destination.
                </p>
            </div>
            <ResourcesList resources={resourcesData} allTags={allTags} />
        </div>
    );
}
