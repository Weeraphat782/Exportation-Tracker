"use client";

import { useState } from "react";
import ResourceCard from "./ResourceCard";
import type { ResourceItem } from "@/data/marketing-resources";

interface ResourcesListProps {
    resources: ResourceItem[];
    allTags: string[];
}

export default function ResourcesList({
    resources,
    allTags,
}: ResourcesListProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const filteredResources =
        selectedTag === null
            ? resources
            : resources.filter((r) => r.tags.includes(selectedTag));

    return (
        <div>
            <div className="mb-8 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition min-h-[44px] ${selectedTag === null
                            ? "text-white"
                            : "border border-neutral-300 text-neutral-700 hover:border-neutral-400"
                        }`}
                    style={
                        selectedTag === null
                            ? { backgroundColor: "var(--color-primary-ref)" }
                            : undefined
                    }
                >
                    All
                </button>
                {allTags.map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition min-h-[44px] ${selectedTag === tag
                                ? "text-white"
                                : "border border-neutral-300 text-neutral-700 hover:border-neutral-400"
                            }`}
                        style={
                            selectedTag === tag
                                ? { backgroundColor: "var(--color-primary-ref)" }
                                : undefined
                        }
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <div className="space-y-8">
                {filteredResources.map((item) => (
                    <ResourceCard key={item.slug} {...item} />
                ))}
            </div>
        </div>
    );
}
