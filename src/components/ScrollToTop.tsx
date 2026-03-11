'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Force scroll to top on initial load/refresh
        if (typeof window !== 'undefined') {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }

            // Use a small timeout to ensure it runs after browser restoration
            const timer = setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }, 0);

            // Also handle the 'beforeunload' to ensure scroll is reset if they just hit refresh
            const handleBeforeUnload = () => {
                window.scrollTo(0, 0);
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, []);

    useEffect(() => {
        // Also scroll to top on route change
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
