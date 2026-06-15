import { computeProformaTotals } from '@/lib/db';
import type { QcSelectedItem } from '@/lib/qc-types';

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
  const lineItems = qcItemsToLineItems(items);
  return computeProformaTotals(lineItems, false);
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
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QC${ymd}-${rand}`;
}
