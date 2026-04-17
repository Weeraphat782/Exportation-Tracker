'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getQuotationByShareToken,
  submitQuotationSignature,
  type Quotation,
  type DocumentSubmission,
} from '@/lib/db';
import { QuotationPreviewContent, type QuotationPreviewData } from '@/components/quotations/quotation-preview-content';
import { SignaturePadDialog } from '@/components/quotations/signature-pad-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicQuotationSignPage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<(Quotation & { documents?: DocumentSubmission[] }) | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getQuotationByShareToken(token);
      setQuotation(data);
    } catch {
      setQuotation(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirmSign = async (dataUrl: string, companyName: string) => {
    if (!token) return;
    setBusy(true);
    try {
      const result = await submitQuotationSignature(token, dataUrl, companyName);
      if (result.success) {
        toast.success('Signature submitted. Thank you.');
        setSignOpen(false);
        await load();
      } else {
        toast.error(result.error || 'Failed to submit signature');
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading quotation…</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <p className="text-center text-red-600">Quotation not found or link is invalid.</p>
      </div>
    );
  }

  const previewData = quotation as QuotationPreviewData;
  const isSigned = Boolean(quotation.customer_signature);

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center print:hidden">
          <h1 className="text-xl font-bold text-slate-900">Quotation</h1>
          {isSigned ? (
            <p className="text-sm text-emerald-700 font-medium mt-1">Signed — thank you.</p>
          ) : (
            <p className="text-sm text-slate-600 mt-1">Review the quotation below, then sign to accept.</p>
          )}
        </div>

        <QuotationPreviewContent
          quotation={previewData}
          mode="public"
          onSignClick={() => setSignOpen(true)}
          signBusy={busy}
        />
      </div>

      <SignaturePadDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        defaultCompanyName={quotation.company_name || ''}
        onConfirm={handleConfirmSign}
        busy={busy}
      />
    </div>
  );
}
