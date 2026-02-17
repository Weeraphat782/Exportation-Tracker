'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotationDetailRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/portal');
    }, [router]);
    return null;
}
