'use client';

import { useState, useEffect } from 'react';
import { getQuotationById, Quotation } from '@/lib/db';
import { useParams } from 'next/navigation';
import { QuotationPreviewContent, type QuotationPreviewData } from '@/components/quotations/quotation-preview-content';

export default function PrintQuotationPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotation() {
      try {
        const quotation = await getQuotationById(id);
        if (quotation) {
          setData(quotation);
        }
      } catch (error) {
        console.error('Error fetching quotation:', error);
      } finally {
        setLoading(false);
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }

    if (id) {
      fetchQuotation();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-lg">Loading quotation data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Quotation not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white min-h-screen print:p-4">
      <QuotationPreviewContent quotation={data as QuotationPreviewData} mode="print" />
    </div>
  );
}
