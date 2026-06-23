import { computeProformaTotals } from '@/lib/db';
import type { QcSelectedItem } from '@/lib/qc-types';

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function qcItemsToLineItems(items: QcSelectedItem[]) {
  return items.map((item) => ({
    description: item.group_label
      ? `${item.group_label}: ${item.name} (${item.qty} ${item.unit_label || 'unit'})`
      : `${item.name} (${item.qty} ${item.unit_label || 'unit'})`,
    amount: item.subtotal,
    taxable: true,
  }));
}

export function computeQcInvoiceTotals(items: QcSelectedItem[]) {
  return computeQcTotalsWithDiscount(items, 0);
}

export interface QcInvoiceTotals {
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  vat: number;
  grand_total: number;
  wht_amount: number;
  net_payable: number;
}

/** Apply discount % on subtotal, then VAT 7% and WHT 3% on discounted taxable base. */
export function computeQcTotalsWithDiscount(
  items: QcSelectedItem[],
  discountPercent: number
): QcInvoiceTotals {
  const lineItems = qcItemsToLineItems(items);
  const base = computeProformaTotals(lineItems, true);
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discount_amount = roundMoney(base.subtotal * (pct / 100));
  const discountedSubtotal = roundMoney(base.subtotal - discount_amount);
  const vat = roundMoney(discountedSubtotal * 0.07);
  const grand_total = roundMoney(discountedSubtotal + vat);
  const wht_amount = roundMoney(discountedSubtotal * 0.03);
  const net_payable = roundMoney(grand_total - wht_amount);
  return {
    subtotal: base.subtotal,
    discount_percent: pct,
    discount_amount,
    vat,
    grand_total,
    wht_amount,
    net_payable,
  };
}

export function buildSelectedItem(
  item: {
    id: string;
    name: string;
    group_label?: string | null;
    unit_label?: string | null;
    price?: number | null;
  },
  qty: number
): QcSelectedItem {
  const price = Number(item.price) || 0;
  const safeQty = Math.max(0, qty);
  return {
    test_item_id: item.id,
    name: item.name,
    group_label: item.group_label,
    unit_label: item.unit_label,
    price,
    qty: safeQty,
    subtotal: Math.round(price * safeQty * 100) / 100,
  };
}

export function generateQcCode(): string {
  const d = new Date();
  const ymd =
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `QC${ymd}-${rand}`;
}

/** Net amount customer pays (grand total − WHT). Matches QC invoice "Net Payable". */
export function getQcPayableTotal(req: {
  net_payable?: number | null;
  grand_total?: number | null;
  wht_amount?: number | null;
}): number {
  if (req.net_payable != null && !Number.isNaN(Number(req.net_payable))) {
    return Number(req.net_payable);
  }
  const grand = Number(req.grand_total) || 0;
  const wht = Number(req.wht_amount) || 0;
  return roundMoney(grand - wht);
}
