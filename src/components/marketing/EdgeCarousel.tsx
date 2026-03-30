'use client';

import Image from "next/image";
import React, { useEffect, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

const IMAGES = [
    {
        url: "https://pub-8bcc4f3b024b4819ba737865d58e9664.r2.dev/Carousel/Screenshot%202026-03-10%20161213.png",
        alt: "AI Technology Integration"
    },
    {
        url: "https://pub-8bcc4f3b024b4819ba737865d58e9664.r2.dev/Carousel/Screenshot%202026-03-10%20161257.png",
        alt: "Cybersecurity & Data Protection"
    },
    {
        url: "https://pub-8bcc4f3b024b4819ba737865d58e9664.r2.dev/Carousel/Screenshot%202026-03-10%20161314.png",
        alt: "Business Intelligence Analysis"
    }
];

export default function EdgeCarousel() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        return () => { emblaApi.off('select', onSelect); };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        const timer = setInterval(scrollNext, 4000);
        return () => clearInterval(timer);
    }, [scrollNext]);

    return (
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-xl">
            {/* Browser chrome frame */}
            <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1.5 text-sm text-neutral-400">
                    app.omgexp.com
                </div>
            </div>

            {/* Carousel */}
            <div className="relative aspect-video overflow-hidden" ref={emblaRef}>
                <div className="flex h-full">
                    {IMAGES.map((img, index) => (
                        <div key={index} className="relative min-w-0 flex-[0_0_100%] h-full min-h-[200px]">
                            <Image
                                src={img.url}
                                alt={img.alt}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                loading={index === 0 ? "eager" : "lazy"}
                                priority={index === 0}
                            />
                        </div>
                    ))}
                </div>

                {/* Gradient overlay at bottom */}
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"
                    aria-hidden
                />

                {/* Dots/Indicators */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {IMAGES.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => emblaApi?.scrollTo(index)}
                            className={`h-2 rounded-full transition-all duration-200 ${
                                index === selectedIndex
                                    ? 'w-6 bg-white'
                                    : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
