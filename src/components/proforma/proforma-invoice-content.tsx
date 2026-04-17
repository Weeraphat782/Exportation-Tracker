'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { ProformaInvoice, Quotation } from '@/lib/db';

function formatNumber(num: number | string | undefined | null) {
  if (num === undefined || num === null) return '0.00';
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return '0.00';
  return parsedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB');
}

export interface ProformaInvoiceContentProps {
  proforma: ProformaInvoice;
  quote: Quotation;
  mode: 'preview' | 'print';
}

/** Proforma-only issuer letterhead (hardcoded) */
const OMG_LETTERHEAD_LINES = [
  'บริษัท โอ เอ็ม จี เอ็กซ์พีเรียนซ์ จำกัด',
  'OMG Experience Co.,Ltd.',
  '10/12-13 ถนนคอนแวนต์ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500.',
  'Tel. : 02-630-4600-1 Fax : 02-632-1929',
  'Email : Cargo@omgexp.com',
  'เลขประจำตัวผู้เสียภาษีอาการ 010556088127',
] as const;

const BANK_ACCOUNT = '051-2-51692-0';

export function ProformaInvoiceContent({ proforma, quote, mode }: ProformaInvoiceContentProps) {
  const displayCompanyName =
    quote.signed_company_name?.trim() || quote.company_name?.trim() || 'N/A';
  const hasSignature = Boolean(quote.customer_signature?.trim());

  return (
    <Card
      data-mode={mode}
      className="p-4 sm:p-8 max-w-4xl mx-auto bg-white shadow-sm print:shadow-none print:border-none print:p-0 print:min-h-[calc(297mm-30mm)] flex flex-col"
    >
      <CardContent className="p-0 flex-1 flex flex-col print:min-h-[calc(297mm-30mm)]">
        <div className="shrink-0">
        {/* Section 1 — Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 sm:mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4 max-w-[640px]">
            <Image
              src="/proforma-logo.png"
              alt="OMG Experience logo"
              width={224}
              height={224}
              priority
              className="shrink-0 h-24 w-24 sm:h-28 sm:w-28 object-contain"
            />
            <div className="text-slate-800 space-y-1 min-w-0">
              {OMG_LETTERHEAD_LINES.map((line, i) => (
                <p
                  key={i}
                  className={
                    (i === 0
                      ? 'text-xl font-bold text-slate-900 leading-snug'
                      : i === 1
                        ? 'text-lg font-semibold text-slate-800 leading-snug'
                        : 'text-sm text-slate-700 leading-relaxed') +
                    ' whitespace-nowrap'
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="text-right space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">PROFORMA INVOICE</h2>
            <div className="border border-slate-300 rounded-md p-3 text-left text-xs sm:text-sm space-y-1 min-w-[220px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Invoice No.</span>
                <span className="font-medium">{proforma.invoice_no || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Date</span>
                <span className="font-medium">{formatDate(proforma.invoice_date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Quotation No.</span>
                <span className="font-medium">{quote.quotation_no || quote.id?.slice(0, 8) || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Customer Code</span>
                <span className="font-medium">{proforma.customer_code || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Customer / Consignee / Ship */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-2 uppercase text-xs">Customer</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{proforma.customer_name || '—'}</p>
              <p className="text-slate-600 whitespace-pre-wrap">{proforma.customer_address || '—'}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-2 uppercase text-xs">Consignee</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{proforma.consignee_name || '—'}</p>
              <p className="text-slate-600 whitespace-pre-wrap">{proforma.consignee_address || '—'}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-2 uppercase text-xs">Ship details</h3>
            <table className="w-full text-xs sm:text-sm">
              <tbody>
                <tr>
                  <td className="py-0.5 pr-2 text-slate-500">Freight Type</td>
                  <td className="py-0.5 font-medium capitalize">{proforma.freight_type || '—'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2 text-slate-500">Est. Shipped</td>
                  <td className="py-0.5">{formatDate(proforma.est_shipped_date)}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2 text-slate-500">Est. Gross Wt.</td>
                  <td className="py-0.5">
                    {proforma.est_gross_weight != null ? `${formatNumber(proforma.est_gross_weight)} kg` : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2 text-slate-500">Est. Net Wt.</td>
                  <td className="py-0.5">
                    {proforma.est_net_weight != null ? `${formatNumber(proforma.est_net_weight)} kg` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 — Header row + line items + bank + totals */}
        <div className="mb-6 sm:mb-8">
          <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">Charges &amp; logistics</h3>
          <div className="overflow-x-auto -mx-1 sm:mx-0 mb-4">
            <table className="w-full text-xs border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-2 px-1 text-left font-semibold">Carrier</th>
                  <th className="py-2 px-1 text-left font-semibold">MAWB</th>
                  <th className="py-2 px-1 text-right font-semibold">QTY/WT</th>
                  <th className="py-2 px-1 text-right font-semibold">Chargeable Wt.</th>
                  <th className="py-2 px-1 text-left font-semibold">Airport</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-1">{proforma.carrier || '—'}</td>
                  <td className="py-2 px-1">{proforma.mawb || '—'}</td>
                  <td className="py-2 px-1 text-right whitespace-pre-wrap">{proforma.qty_wt || '—'}</td>
                  <td className="py-2 px-1 text-right">
                    {proforma.chargeable_weight != null ? `${formatNumber(proforma.chargeable_weight)} kg` : '—'}
                  </td>
                  <td className="py-2 px-1">{proforma.airport_destination || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[320px]">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left w-12">ลำดับ</th>
                  <th className="py-2 text-left">รายการ</th>
                  <th className="py-2 text-right">จำนวนเงิน (THB)</th>
                </tr>
              </thead>
              <tbody>
                {(proforma.line_items ?? []).map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 align-top">{index + 1}</td>
                    <td className="py-2">{row.description || '—'}</td>
                    <td className="py-2 text-right align-top">{formatNumber(row.amount)}</td>
                  </tr>
                ))}
                {(!proforma.line_items || proforma.line_items.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400 italic">
                      No line items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="text-sm w-full sm:max-w-[320px]">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 text-left sm:text-right pr-4 text-slate-600">Sub Total</td>
                    <td className="py-1 text-right font-medium">{formatNumber(proforma.subtotal)} THB</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-left sm:text-right pr-4 text-slate-600">VAT 7%</td>
                    <td className="py-1 text-right font-medium">{formatNumber(proforma.vat)} THB</td>
                  </tr>
                  <tr className="font-bold text-base border-t border-slate-300">
                    <td className="py-2 text-left sm:text-right pr-4">Grand Total</td>
                    <td className="py-2 text-right">{formatNumber(proforma.grand_total)} THB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 w-full border border-slate-300 rounded-md px-4 py-3 sm:px-6 sm:py-4 text-sm bg-slate-50 print:bg-white">
            <p className="font-semibold text-slate-900 uppercase tracking-wide text-xs mb-2 sm:mb-3">
              Bank transfer
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1.5">
              <p className="sm:col-span-1">
                <strong>Bank:</strong> KASIKORN BANK
              </p>
              <p className="sm:col-span-2">
                <strong>Account Name:</strong> บจก. โอ เอ็ม จี เอ็กซ์พีเรียนซ์ สาขาจักรวรรดิ
              </p>
              <p className="sm:col-span-3">
                <strong>Account Number:</strong> {BANK_ACCOUNT}
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Bottom block — sits right under bank box with small breathing room */}
        <div className="shrink-0 mt-auto pt-3 sm:pt-4 print:pt-3">

        {/* Disclaimer — price may be adjusted */}
        <div className="mb-4 sm:mb-5 break-inside-avoid print:break-inside-avoid">
          <div className="border border-slate-300 rounded-md bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed print:bg-white">
            <p className="font-semibold text-slate-900 uppercase tracking-wide text-xs mb-1">
              หมายเหตุ / Remark
            </p>
            <p>
              เอกสารนี้เป็น <strong>ใบแจ้งราคา (Proforma Invoice)</strong> มิใช่ใบกำกับภาษี
              ราคาเป็นประมาณการ บริษัทฯ ขอสงวนสิทธิ์ปรับเปลี่ยนภายหลังตามอัตราค่าระวาง
              อัตราแลกเปลี่ยน หรือค่าใช้จ่ายที่เปลี่ยนแปลง
            </p>
          </div>
        </div>

        {/* Section 4 — Signatures (reuse quote signature) */}
        <div className="pt-4 sm:pt-6 break-inside-avoid print:break-inside-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            <div className="text-center">
              <p className="text-sm text-slate-700 mb-2">Yours sincerely,</p>
              <div className="h-14 flex items-end justify-center">
                <p className="text-3xl text-slate-900 italic leading-none [font-family:var(--font-quotation-signature)]">
                  Shivek Sachdev
                </p>
              </div>
              <div className="border-t border-slate-800 mt-1 mb-2" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">OMG Experience</p>
              <p className="text-xs italic text-slate-600">Authorized Signature</p>
              <p className="text-xs italic text-slate-600">Director</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-700 mb-2">Customer</p>
              <div className="h-14 flex items-end justify-center">
                {hasSignature && quote.customer_signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={quote.customer_signature}
                    alt="Customer signature"
                    className="block object-contain object-bottom"
                    style={{ maxHeight: '56px', maxWidth: '240px' }}
                  />
                ) : null}
              </div>
              <div className="border-t border-slate-800 mt-1 mb-2" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">{displayCompanyName}</p>
              <p className="text-xs italic text-slate-600">Authorized Signature / Date</p>
            </div>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
