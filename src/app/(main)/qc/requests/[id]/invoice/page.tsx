'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { getQcRequestById } from '@/lib/qc-db';
import { QcInvoiceContent } from '@/components/qc/qc-invoice-content';
import type { QcRequest } from '@/lib/qc-types';

export default function LabQcInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<QcRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setRequest(await getQcRequestById(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-center py-8 text-red-500">Request not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link href={`/qc/requests/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Request
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
      </div>

      <div className="mx-auto max-w-4xl">
        <QcInvoiceContent request={request} />
      </div>
    </div>
  );
}
