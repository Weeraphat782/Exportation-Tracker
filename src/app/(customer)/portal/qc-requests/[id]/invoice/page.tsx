'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { getQcRequestById } from '@/lib/qc-db';
import { QcInvoiceContent } from '@/components/qc/qc-invoice-content';
import type { QcRequest } from '@/lib/qc-types';

export default function PortalQcInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useCustomerAuth();
  const [request, setRequest] = useState<QcRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getQcRequestById(id);
    if (data && user && data.customer_user_id !== user.id) {
      setRequest(null);
    } else {
      setRequest(data);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-center py-8 text-red-500">Request not found</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link href={`/portal/qc-requests/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Request
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" />
          พิมพ์ / Save as PDF
        </Button>
      </div>

      <p className="text-sm text-slate-500 print:hidden">
        กดปุ่มด้านบนเพื่อเปิดหน้าต่างพิมพ์ — ปรับ Scale / ขนาดได้ก่อน Save as PDF
      </p>

      <div className="qc-print-sheet mx-auto max-w-4xl">
        <QcInvoiceContent request={request} mode="print" />
      </div>
    </div>
  );
}
