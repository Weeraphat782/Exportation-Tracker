'use client';

import { useEffect } from 'react';

export function useScrollReveal() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -250px 0px',
            threshold: 0.05,
        };

        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersect, observerOptions);
        const targets = document.querySelectorAll('.reveal-on-scroll');

        targets.forEach((target) => observer.observe(target));

        return () => observer.disconnect();
    }, []);
}
