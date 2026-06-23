'use client';

import { Card, CardContent } from '@/components/ui/card';
import { QC_LAB_LETTERHEAD } from '@/lib/qc-types';
import type { QcRequest } from '@/lib/qc-types';

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

export interface QcInvoiceContentProps {
  request: QcRequest;
  mode?: 'preview' | 'print';
}

const LAB_LETTERHEAD_LINES = [
  'บริษัท สยาม เฮอเบิล เทค จำกัด',
  'Siam Herbal Tech Co., Ltd.',
  '288/8 หมู่ที่ 4 ตำบลบางหญ้าแพรก อำเภอเมืองสมุทรสาคร จ.สมุทรสาคร 74000',
  'Tel. : +6691-782-9291',
  `Form: ${QC_LAB_LETTERHEAD.formCode}`,
] as const;

export function QcInvoiceContent({ request, mode = 'preview' }: QcInvoiceContentProps) {
  const items = request.selected_items ?? [];
  const finalized = Boolean(request.price_finalized);
  const subtotal = Number(request.subtotal) || 0;
  const discountPercent = Number(request.discount_percent) || 0;
  const discountAmount = Number(request.discount_amount) || 0;
  const vat = Number(request.vat) || 0;
  const grandTotal = Number(request.grand_total) || 0;
  const whtAmount = Number(request.wht_amount) || 0;
  const netPayable = Number(request.net_payable) || 0;

  return (
    <Card
      data-mode={mode}
      className="p-4 sm:p-8 max-w-4xl mx-auto bg-white shadow-sm print:shadow-none print:border-none print:p-0 flex flex-col"
    >
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mb-6 border-b border-slate-200 pb-6 items-start">
          <div className="text-slate-800 space-y-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/QC form LOgo.png"
              alt="Lab logo"
              className="h-16 w-auto object-contain mb-2 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
            />
            {LAB_LETTERHEAD_LINES.map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'text-xl font-bold text-slate-900'
                    : i === 1
                      ? 'text-lg font-semibold text-slate-800'
                      : 'text-sm text-slate-700'
                }
              >
                {line}
              </p>
            ))}
          </div>
          <div className="text-right space-y-2 shrink-0 sm:justify-self-end w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap">QC INVOICE</h2>
            <div className="border border-slate-300 rounded-md p-3 text-left text-xs sm:text-sm space-y-1 min-w-[240px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Invoice No.</span>
                <span className="font-medium font-mono">
                  {request.invoice_no || (finalized ? '—' : 'ออกเลขเมื่อยืนยันราคา')}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Date</span>
                <span className="font-medium">
                  {formatDate(finalized ? request.finalized_at : request.created_at)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Template</span>
                <span className="font-medium">{request.qc_templates?.name || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-slate-200 rounded-md p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</h3>
            <p className="text-sm whitespace-pre-wrap">{request.company_name_address || '—'}</p>
            <p className="text-sm mt-2">{request.contact_name}</p>
            <p className="text-sm text-slate-600">{request.phone}</p>
            <p className="text-sm text-slate-600">{request.email}</p>
          </div>
          <div className="border border-slate-200 rounded-md p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Sample</h3>
            <p className="text-sm"><span className="text-slate-500">Name:</span> {request.sample_name || '—'}</p>
            <p className="text-sm"><span className="text-slate-500">Lot:</span> {request.lot_no || '—'}</p>
            <p className="text-sm"><span className="text-slate-500">Manufacturer:</span> {request.manufacturer || '—'}</p>
            <p className="text-sm"><span className="text-slate-500">Qty:</span> {request.sample_qty || '—'}</p>
            {request.estimated_coa_date && (
              <p className="text-sm">
                <span className="text-slate-500">Est. COA:</span>{' '}
                {formatDate(request.estimated_coa_date)}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-slate-100 border border-slate-200">
              <th className="text-left p-2 border border-slate-200">#</th>
              <th className="text-left p-2 border border-slate-200">Test Item</th>
              <th className="text-right p-2 border border-slate-200">Qty</th>
              <th className="text-right p-2 border border-slate-200">Unit Price</th>
              <th className="text-right p-2 border border-slate-200">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.test_item_id + idx}>
                <td className="p-2 border border-slate-200">{idx + 1}</td>
                <td className="p-2 border border-slate-200">
                  {item.group_label ? `${item.group_label}: ` : ''}
                  {item.name}
                </td>
                <td className="p-2 border border-slate-200 text-right">
                  {item.qty} {item.unit_label || ''}
                </td>
                <td className="p-2 border border-slate-200 text-right">{formatNumber(item.price)}</td>
                <td className="p-2 border border-slate-200 text-right">{formatNumber(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          {finalized ? (
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatNumber(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({formatNumber(discountPercent)}%)</span>
                  <span>−{formatNumber(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">VAT 7%</span>
                <span>{formatNumber(vat)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>{formatNumber(grandTotal)} THB</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>WHT 3%</span>
                <span>−{formatNumber(whtAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 text-emerald-800">
                <span>Net Payable</span>
                <span>{formatNumber(netPayable)} THB</span>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">ราคากำลังตรวจสอบ</p>
              <p className="mt-1 text-amber-800">
                ยอดชำระและ QR จะแสดงหลังห้องแล็บยืนยันราคาและออกเลขที่ Invoice
              </p>
            </div>
          )}
        </div>

        {finalized && (
          <div className="border border-slate-200 rounded-md p-4 text-sm text-slate-700">
            <p className="font-semibold mb-1">Payment</p>
            <p className="text-slate-500">
              Scan the payment QR on the portal, transfer the net payable amount, then upload your payment slip.
              The lab will verify payment before testing begins.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
