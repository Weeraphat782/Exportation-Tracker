'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getQuotationById, Quotation } from '@/lib/db';

export default function PrintDebitNotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationId = params.id as string;
  const remarks = searchParams.get('remarks') || '';
  const debitNoteNo = searchParams.get('debitNoteNo') || '';
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQuotation = useCallback(async () => {
    try {
      const quotationData = await getQuotationById(quotationId);
      setQuotation(quotationData);
    } catch (error) {
      console.error('Error loading quotation:', error);
    } finally {
      setLoading(false);
      // Auto-trigger print when data is loaded
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [quotationId]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  // Remove unused formatCurrency function

  const formatDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalActualWeight = () => {
    if (!quotation?.pallets?.length) return 0;
    if (quotation.total_actual_weight) return quotation.total_actual_weight;
    
    return quotation.pallets.reduce((total, pallet) => {
      const weight = typeof pallet.weight === 'number' ? pallet.weight : parseFloat(pallet.weight) || 0;
      const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
      return total + (weight * quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Quotation not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white min-h-screen print:p-2">
      <style jsx global>{`
        @media print {
          body { margin: 0; font-size: 12px; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          table { font-size: 11px; }
          .compact-table th, .compact-table td { padding: 2px 4px; }
        }
      `}</style>

      {/* Company Header with Logo - Compact */}
      <div className="flex items-center mb-4 border-b border-black pb-2">
        {/* Logo */}
        <div className="flex-shrink-0 mr-4">
          <Image 
            src="/icons/handle-logo.png" 
            alt="Handle Inter Freight Logistics" 
            width={144}
            height={144}
            className="h-36 w-auto"
          />
        </div>
        
        {/* Company Info */}
        <div className="flex-1 text-left">
          <h1 className="text-lg font-bold mb-1">Handle Inter Freight Logistics Co., Ltd.</h1>
          <p className="text-xs">
            132/15,16 Soi Ramkhamhaeng 24 (Seri Village), Huamark, Bangkapi, Bangkok 10250<br/>
            Tel. +66 (0) 2253-5995 (5 auto lines) Fax : +66 (0) 2653-6885
          </p>
        </div>
      </div>

      {/* Header Information - Compact */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-base font-bold mb-2">DEBIT NOTE</h2>
            <div className="text-xs space-y-1">
              <p><span className="font-semibold">To:</span> {quotation.company_name}</p>
              {quotation.customer_name && (
                <p><span className="font-semibold">Customer:</span> {quotation.customer_name}</p>
              )}
            </div>
          </div>
          
          <div className="text-right text-xs">
            <p><span className="font-semibold">DEBIT NOTE NO.:</span> {debitNoteNo || quotation.id}</p>
            <p><span className="font-semibold">Date:</span> {formatDate()}</p>
            <p><span className="font-semibold">Destination:</span> {quotation.destination}</p>
          </div>
        </div>
      </div>

      {/* Main Table - Compact Format */}
      <div className="mb-4">
        <table className="w-full border-collapse border-2 border-black compact-table">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 text-center text-xs font-bold">TEXT</th>
              <th className="border border-black px-2 py-1 text-center text-xs font-bold">QTY</th>
              <th className="border border-black px-2 py-1 text-center text-xs font-bold">UNIT</th>
              <th className="border border-black px-2 py-1 text-center text-xs font-bold">@</th>
              <th className="border border-black px-2 py-1 text-center text-xs font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {/* Freight Cost */}
            <tr>
              <td className="border border-black px-2 py-1 text-xs">
                FREIGHT COST<br/>
                FROM BANGKOK TO {quotation.destination?.toUpperCase() || 'DESTINATION'}
              </td>
              <td className="border border-black px-2 py-1 text-xs text-center">
                {calculateTotalActualWeight().toFixed(0)}
              </td>
              <td className="border border-black px-2 py-1 text-xs text-center">KG</td>
              <td className="border border-black px-2 py-1 text-xs text-center">@</td>
              <td className="border border-black px-2 py-1 text-xs text-right">
                THB {(quotation.total_freight_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Delivery Service */}
            {quotation.delivery_service_required && quotation.delivery_cost && quotation.delivery_cost > 0 && (
              <tr>
                <td className="border border-black px-2 py-1 text-xs">
                  DELIVERY SERVICE ({quotation.delivery_vehicle_type?.toUpperCase() || 'PICKUP'})
                </td>
                <td className="border border-black px-2 py-1 text-xs text-center">1.00</td>
                <td className="border border-black px-2 py-1 text-xs text-center">SHP</td>
                <td className="border border-black px-2 py-1 text-xs text-center">@</td>
                <td className="border border-black px-2 py-1 text-xs text-right">
                  THB {(quotation.delivery_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}

            {/* Clearance Cost */}
            {quotation.clearance_cost && quotation.clearance_cost > 0 && (
              <tr>
                <td className="border border-black px-2 py-1 text-xs">CLEARANCE & HANDLING FEE</td>
                <td className="border border-black px-2 py-1 text-xs text-center">1.00</td>
                <td className="border border-black px-2 py-1 text-xs text-center">SHP</td>
                <td className="border border-black px-2 py-1 text-xs text-center">@</td>
                <td className="border border-black px-2 py-1 text-xs text-right">
                  THB {(quotation.clearance_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}

            {/* Additional Charges */}
            {quotation.additional_charges && quotation.additional_charges.length > 0 && 
              quotation.additional_charges.map((charge, index) => (
                <tr key={index}>
                  <td className="border border-black px-2 py-1 text-xs">{charge.description}</td>
                  <td className="border border-black px-2 py-1 text-xs text-center">1.00</td>
                  <td className="border border-black px-2 py-1 text-xs text-center">SHP</td>
                  <td className="border border-black px-2 py-1 text-xs text-center">@</td>
                  <td className="border border-black px-2 py-1 text-xs text-right">
                    THB {(typeof charge.amount === 'number' ? charge.amount : parseFloat(charge.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pallet Information - Compact */}
      {quotation.pallets && quotation.pallets.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-4 text-xs">
            {quotation.pallets.map((pallet, index) => (
              <div key={index}>
                <span className="font-semibold">Pallet {index + 1}:</span> {pallet.length} × {pallet.width} × {pallet.height}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mb-4">
        <div className="border-2 border-black p-2 text-right">
          <span className="text-sm font-bold">THB {quotation.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Remarks Section - Compact */}
      {remarks && (
        <div className="mb-4">
          <div className="border border-black p-2">
            <p className="text-xs font-semibold mb-1">REMARKS:</p>
            <p className="text-xs whitespace-pre-wrap">{remarks}</p>
          </div>
        </div>
      )}

      {/* Footer Information - Compact */}
      <div className="border-t border-black pt-2 mt-4">
        <div className="flex justify-between text-xs">
          <div>
            <p><span className="font-semibold">PREPARING BY:</span> MONTREE C.</p>
          </div>
          
          <div className="text-right">
            <p>Handle Inter Freight Logistics Co.,Ltd.</p>
            <p>Kasikorn Bank Public Co.,Ltd. | Thanon Phetchaburi 17</p>
            <p>Account: 771-2-02000-2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
