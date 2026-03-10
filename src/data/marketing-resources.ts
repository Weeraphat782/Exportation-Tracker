export interface ResourceItem {
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    imageUrl?: string;
}

export const resourcesData: ResourceItem[] = [
    {
        slug: "compliance-portugal",
        title: "Export Compliance Guide: Portugal",
        excerpt: "Requirements for shipments to Portugal. Covers customs documentation, import permits, and EU compliance for pharmaceutical and specialized cargo.",
        tags: ["EU Compliance", "Destination: Portugal"],
    },
    {
        slug: "switzerland-customs",
        title: "Reading Instructions: Switzerland Customs",
        excerpt: "Guide to Swiss customs clearance, including document templates and verification checklists for time-sensitive air freight.",
        tags: ["EU Compliance", "Destination: Switzerland"],
    },
    {
        slug: "cold-chain-documentation",
        title: "Cold-Chain Documentation Requirements",
        excerpt: "Temperature monitoring, packing verification, and GDP-compliant documentation requirements for pharmaceutical logistics.",
        tags: ["GDP Warehousing", "EU Compliance"],
    },
];

export const allTags = Array.from(
    new Set(resourcesData.flatMap((r) => r.tags))
).sort();
