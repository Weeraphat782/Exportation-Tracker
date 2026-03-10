'use client';

import React, { useEffect, useCallback } from 'react';
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
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    useEffect(() => {
        const timer = setInterval(() => {
            scrollNext();
        }, 4000);
        return () => clearInterval(timer);
    }, [scrollNext]);

    return (
        <div className="relative aspect-video overflow-hidden rounded-xl shadow-xl" ref={emblaRef}>
            <div className="flex h-full">
                {IMAGES.map((img, index) => (
                    <div key={index} className="relative min-w-0 flex-[0_0_100%] h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={img.url}
                            alt={img.alt}
                            className="h-full w-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Dots/Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {IMAGES.map((_, index) => (
                    <div
                        key={index}
                        className="h-1.5 w-1.5 rounded-full bg-white/50"
                    />
                ))}
            </div>
        </div>
    );
}
