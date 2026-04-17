'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProformaInvoiceContent } from '@/components/proforma/proforma-invoice-content';
import { getProformaInvoiceById, getQuotationById, type ProformaInvoice, type Quotation } from '@/lib/db';
import { MobileMenuButton } from '@/components/ui/mobile-menu-button';

export default function ProformaPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
  const [quote, setQuote] = useState<Quotation | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProformaInvoiceById(id);
      if (!p) {
        setProforma(null);
        setQuote(null);
        return;
      }
      setProforma(p);
      const q = await getQuotationById(p.quotation_id);
      setQuote(q);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!proforma || !quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">Could not load proforma invoice.</p>
        <Button variant="outline" asChild>
          <Link href="/shipping-calculator">Back to Shipping Calculator</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <MobileMenuButton />
          <Button variant="outline" size="icon" asChild>
            <Link href="/shipping-calculator">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">Proforma Invoice</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push(`/proforma-invoices/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handlePrint}>
            <FileText className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
        </div>
      </div>

      <ProformaInvoiceContent proforma={proforma} quote={quote} mode="preview" />
    </div>
  );
}
