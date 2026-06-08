import { getQuotationPayableTotalThb } from '@/lib/db';

export type ShipmentOpStatus =
  | 'awaiting_payment'
  | 'paid_ready_to_ship'
  | 'shipped_unpaid'
  | 'shipped_and_paid';

export interface ShipmentQuotationRow {
  id: string;
  quotation_no?: string | null;
  company_name?: string | null;
  total_cost?: number | null;
  vat_amount?: number | null;
  wht_amount?: number | null;
  wht_enabled?: boolean | null;
  awb_number?: string | null;
  status?: string | null;
}

export interface RawOpportunityForShipment {
  id: string;
  topic?: string | null;
  customer_name?: string | null;
  stage?: string | null;
  closure_status?: 'won' | 'lost' | null;
  payment_date?: string | null;
  pickup_date?: string | null;
  quotations?: ShipmentQuotationRow[] | null;
}

export interface ShipmentStatusRow {
  id: string;
  topic: string;
  companyName: string;
  customerName: string;
  stage: string;
  paymentDate: string | null;
  pickupDate: string | null;
  amountThb: number;
  isPaid: boolean;
  isShipped: boolean;
  opStatus: ShipmentOpStatus;
  quotations: ShipmentQuotationRow[];
  awbNumbers: string[];
  shipmentLabel: string;
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentOpStatus, string> = {
  awaiting_payment: 'Awaiting Payment',
  paid_ready_to_ship: 'Paid — Ready to Ship',
  shipped_unpaid: 'Shipped — Unpaid',
  shipped_and_paid: 'Shipped & Paid',
};

export function deriveShipmentOpStatus(isPaid: boolean, isShipped: boolean): ShipmentOpStatus {
  if (!isPaid && !isShipped) return 'awaiting_payment';
  if (!isPaid && isShipped) return 'shipped_unpaid';
  if (isPaid && !isShipped) return 'paid_ready_to_ship';
  return 'shipped_and_paid';
}

function buildShipmentLabel(pickupDate: string | null, awbNumbers: string[]): string {
  if (awbNumbers.length > 0) {
    return awbNumbers.length === 1 ? `AWB ${awbNumbers[0]}` : `AWB: ${awbNumbers.join(', ')}`;
  }
  if (pickupDate) return 'Picked up';
  return 'Not shipped';
}

export function mapOpportunitiesToShipmentRows(
  opportunities: RawOpportunityForShipment[]
): ShipmentStatusRow[] {
  return opportunities
    .filter((op) => op.closure_status !== 'lost')
    .filter((op) => (op.quotations?.length ?? 0) > 0)
    .map((op) => {
      const quotations = op.quotations ?? [];
      const amountThb = quotations.reduce(
        (sum, q) =>
          sum +
          getQuotationPayableTotalThb({
            total_cost: q.total_cost ?? 0,
            vat_amount: q.vat_amount ?? null,
            grand_total_with_vat: null,
            wht_amount: q.wht_amount ?? null,
            wht_enabled: q.wht_enabled,
          }),
        0
      );
      const isPaid = !!op.payment_date?.trim();
      const awbNumbers = quotations
        .map((q) => (q.awb_number || '').trim())
        .filter(Boolean);
      const isShipped = !!op.pickup_date?.trim() || awbNumbers.length > 0;
      const isPaidBool = isPaid;
      const isShippedBool = isShipped;
      const companyName =
        quotations.find((q) => q.company_name?.trim())?.company_name?.trim() ||
        op.customer_name?.trim() ||
        '—';

      return {
        id: op.id,
        topic: op.topic || 'Untitled',
        companyName,
        customerName: op.customer_name || '—',
        stage: op.stage || '—',
        paymentDate: op.payment_date?.trim() || null,
        pickupDate: op.pickup_date?.trim() || null,
        amountThb,
        isPaid: isPaidBool,
        isShipped: isShippedBool,
        opStatus: deriveShipmentOpStatus(isPaidBool, isShippedBool),
        quotations,
        awbNumbers,
        shipmentLabel: buildShipmentLabel(op.pickup_date?.trim() || null, awbNumbers),
      };
    });
}

export function summarizeShipmentRows(rows: ShipmentStatusRow[]) {
  const byStatus = (status: ShipmentOpStatus) => rows.filter((r) => r.opStatus === status);
  const totalAmount = (list: ShipmentStatusRow[]) =>
    list.reduce((sum, r) => sum + r.amountThb, 0);

  return {
    awaiting_payment: { count: byStatus('awaiting_payment').length, amount: totalAmount(byStatus('awaiting_payment')) },
    paid_ready_to_ship: { count: byStatus('paid_ready_to_ship').length, amount: totalAmount(byStatus('paid_ready_to_ship')) },
    shipped_unpaid: { count: byStatus('shipped_unpaid').length, amount: totalAmount(byStatus('shipped_unpaid')) },
    shipped_and_paid: { count: byStatus('shipped_and_paid').length, amount: totalAmount(byStatus('shipped_and_paid')) },
    total: { count: rows.length, amount: totalAmount(rows) },
  };
}
