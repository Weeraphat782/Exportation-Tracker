'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { QcRequest } from '@/lib/qc-types';

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB');
}

export interface QcInvoicePreviewProps {
  request: QcRequest;
  onViewFull?: () => void;
}

export function QcInvoicePreview({ request, onViewFull }: QcInvoicePreviewProps) {
  const finalized = Boolean(request.price_finalized);
  const discountAmount = Number(request.discount_amount) || 0;

  return (
    <Card
      className={`h-full border shadow-sm overflow-hidden ${
        finalized
          ? 'border-slate-200 bg-white cursor-pointer hover:border-slate-300 hover:shadow-md transition-shadow'
          : 'border-amber-200 bg-amber-50/50'
      }`}
      onClick={finalized ? onViewFull : undefined}
      role={finalized ? 'button' : undefined}
      tabIndex={finalized ? 0 : undefined}
      onKeyDown={
        finalized
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewFull?.();
              }
            }
          : undefined
      }
    >
      <CardContent className="p-3 h-full flex flex-col space-y-2.5">
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/QC form LOgo.png"
              alt="Lab logo"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">QC INVOICE</p>
              <p className="text-[10px] text-slate-500 truncate">
                {request.qc_templates?.name || 'Lab testing'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 shrink-0 bg-slate-900 hover:bg-slate-800 text-[11px] px-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewFull?.();
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            ดูใบแจ้งหนี้
          </Button>
        </div>

        {!finalized ? (
          <p className="text-xs text-amber-800 leading-relaxed">
            ราคากำลังตรวจสอบ — ยอดชำระจะแสดงหลังยืนยัน Invoice
          </p>
        ) : (
          <>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p className="truncate">{request.company_name_address?.split('\n')[0] || request.contact_name}</p>
              {request.invoice_no && (
                <p className="font-mono">Invoice: {request.invoice_no}</p>
              )}
              <p>
                วันที่: {formatDate(request.finalized_at || request.created_at)}
              </p>
            </div>

            <div className="rounded-md border border-slate-100 bg-slate-50/80 p-2.5 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">ค่าตรวจรวม</span>
                <span className="font-medium tabular-nums">{formatMoney(request.subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between gap-2 text-emerald-700">
                  <span>ส่วนลด ({formatMoney(request.discount_percent)}%)</span>
                  <span className="tabular-nums">−{formatMoney(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-600">VAT 7%</span>
                <span className="tabular-nums">{formatMoney(request.vat)}</span>
              </div>
              <div className="flex justify-between gap-2 font-medium">
                <span className="text-slate-700">Grand Total</span>
                <span className="tabular-nums">{formatMoney(request.grand_total)}</span>
              </div>
              <div className="flex justify-between gap-2 text-amber-800">
                <span>หัก WHT 3%</span>
                <span className="tabular-nums">−{formatMoney(request.wht_amount)}</span>
              </div>
              <div className="flex justify-between gap-2 font-bold text-emerald-800 border-t border-slate-200 pt-1 mt-1">
                <span>ยอดสุทธิชำระ</span>
                <span className="tabular-nums">{formatMoney(request.net_payable)} THB</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">คลิกเพื่อดูใบแจ้งหนี้เต็ม</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
