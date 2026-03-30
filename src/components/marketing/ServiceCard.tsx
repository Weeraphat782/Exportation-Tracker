import Image from "next/image";
import Link from "next/link";

interface ServiceCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    imageUrl?: string;
    href?: string;
}

export default function ServiceCard({
    title,
    description,
    icon,
    imageUrl,
    href = "/site/contact",
}: ServiceCardProps) {
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-8px_rgba(33,84,151,0.15),0_8px_16px_-4px_rgba(0,0,0,0.08)]">
            {/* Top accent line that reveals on hover */}
            <div
                className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ background: "linear-gradient(90deg, var(--color-primary-ref), var(--color-accent-ref))" }}
            />

            {imageUrl && (
                <div className="relative h-32 overflow-hidden sm:h-44">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                    />
                    {/* Gradient overlay on image */}
                    <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-40"
                        style={{ background: "linear-gradient(to top, var(--color-primary-ref), transparent)" }}
                    />
                </div>
            )}

            <div className="flex flex-1 flex-col p-4 sm:p-6">
                {/* Icon with gradient background */}
                <div
                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 sm:h-11 sm:w-11"
                    style={{
                        background: "linear-gradient(135deg, var(--color-primary-ref) 0%, #3a7bd5 100%)",
                        boxShadow: "0 4px 12px rgba(33,84,151,0.25)",
                    }}
                >
                    <span className="text-white">{icon}</span>
                </div>

                <h3 className="text-base font-bold text-neutral-900 leading-snug transition-colors group-hover:text-[var(--color-primary-ref)] sm:text-lg">
                    {title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-neutral-500 leading-relaxed">{description}</p>

                <Link
                    href={href}
                    className="group/link mt-5 inline-flex min-h-[44px] items-center gap-1 self-start rounded-md py-2 text-sm font-semibold transition-all hover:gap-2"
                    style={{ color: "var(--color-accent-ref)" }}
                >
                    Learn more
                    <svg
                        className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
