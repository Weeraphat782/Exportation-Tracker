'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Edit, Upload, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Quotation, getQuotationById, generateShareToken } from '@/lib/db';
import { QuotationPreviewContent, type QuotationPreviewData } from '@/components/quotations/quotation-preview-content';
import { toast } from 'sonner';

interface EnhancedQuotation extends Quotation {
  totalFreightCost?: number;
  totalVolumeWeight?: number;
  totalActualWeight?: number;
  chargeableWeight?: number;
  clearanceCost?: number;
  deliveryCost?: number;
  freightRate?: number;
}

export default function QuotationPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <QuotationPreviewPageInner />
    </Suspense>
  );
}

function QuotationPreviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotationData, setQuotationData] = useState<EnhancedQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const quotationRef = useRef<HTMLDivElement>(null);
  const [copyingLink, setCopyingLink] = useState(false);

  useEffect(() => {
    const loadQuotation = async () => {
      try {
        const quotationId = searchParams.get('id');

        if (quotationId) {
          const dbQuotation = await getQuotationById(quotationId);
          if (dbQuotation) {
            setQuotationData(dbQuotation as EnhancedQuotation);
            setLoading(false);
            return;
          }
        }

        const storedData = sessionStorage.getItem('quotationData');
        if (storedData) {
          setQuotationData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error retrieving quotation data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [searchParams]);

  const handleSaveAsPdf = () => {
    window.print();
  };

  const editQuotation = () => {
    if (!quotationData || !quotationData.id) return;
    sessionStorage.setItem('quotationDataForEdit', JSON.stringify(quotationData));
    router.push(`/shipping-calculator/new?id=${quotationData.id}`);
  };

  const handleCopySignLink = async () => {
    if (!quotationData?.id) return;
    setCopyingLink(true);
    try {
      const token = await generateShareToken(quotationData.id);
      if (!token) {
        toast.error('Could not create share link');
        return;
      }
      const url = `${window.location.origin}/quotation/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Sign link copied', { description: 'Send this link to the customer to e-sign.' });
    } finally {
      setCopyingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading quotation data...</div>
      </div>
    );
  }

  if (!quotationData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-red-600">Failed to load quotation data.</p>
        <Link href="/shipping-calculator">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/shipping-calculator">
            <Button variant="outline" size="icon" className="print:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Quotation Preview</h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href="/shipping-calculator">
            <Button variant="outline" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Page
            </Button>
          </Link>
          <Button variant="outline" onClick={handleCopySignLink} disabled={copyingLink}>
            <Link2 className="h-4 w-4 mr-2" />
            {copyingLink ? 'Copying…' : 'Copy sign link'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/proforma-invoices/new?quotation_id=${quotationData.id}`}>Proforma Invoice</Link>
          </Button>
          <Button onClick={handleSaveAsPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
        </div>
      </div>

      <div ref={quotationRef} id="quotation-content">
        <QuotationPreviewContent quotation={quotationData as QuotationPreviewData} mode="staff" />
      </div>

      <div className="flex justify-end mt-6 print:hidden">
        <div className="flex gap-2">
          <Button
            onClick={() =>
              router.push(
                `/documents-upload/${quotationData?.id}?company=${encodeURIComponent(quotationData?.company_name || '')}&destination=${encodeURIComponent(quotationData?.destination || '')}`
              )
            }
            variant="outline"
            className="h-9"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
          <Button onClick={editQuotation} variant="outline" className="h-9">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
