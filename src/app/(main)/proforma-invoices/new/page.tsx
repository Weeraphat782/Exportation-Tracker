'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createProformaInvoice } from '@/lib/db';
import { toast } from 'sonner';

/** Dedupe create in React Strict Mode (dev double-mount) */
const creationByQuotation = new Map<string, Promise<{ id: string } | null>>();

function NewProformaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const quotationId = searchParams.get('quotation_id');
    if (!quotationId) {
      toast.error('Missing quotation', { description: 'Add ?quotation_id= to the URL.' });
      router.replace('/shipping-calculator');
      return;
    }

    let p = creationByQuotation.get(quotationId);
    if (!p) {
      p = createProformaInvoice(quotationId).then((proforma) => (proforma ? { id: proforma.id } : null));
      creationByQuotation.set(quotationId, p);
      p.finally(() => {
        creationByQuotation.delete(quotationId);
      });
    }

    p.then((proforma) => {
      if (!proforma) {
        toast.error('Could not create proforma invoice');
        router.replace('/shipping-calculator');
        return;
      }
      router.replace(`/proforma-invoices/${proforma.id}/edit`);
    });
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Creating proforma invoice…</p>
    </div>
  );
}

export default function NewProformaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <NewProformaInner />
    </Suspense>
  );
}
