import {
  formatBookingEmail,
  generateEmailSubject,
  type EmailBookingData,
} from '../email-templates';
import type { BookingRecipients } from '../booking-recipients';
import type { Pallet, Quotation } from '../db';

export interface BookingEmailDraft {
  subject: string;
  body: string;
  to: string;
  cc: string[];
  from: string;
  quotation_id: string;
  omg_number: string;
  already_drafted: boolean;
  document_list_url: string | null;
}

export interface OpCardOverrides {
  topic?: string;
  stage?: string;
  notes?: string;
}

export interface OpCardInsertPayload {
  topic: string;
  customer_name: string;
  company_id: string | null;
  amount: number;
  currency: string;
  stage: string;
  probability: number;
  close_date: string | null;
  vehicle_type: string | null;
  container_size: string | null;
  product_details: string | null;
  notes: string | null;
  destination_id: string | null;
  owner_id: string | null;
  pickup_date: string | null;
}

export function productLabelFromCommodity(commodity?: string | null): string {
  switch (commodity) {
    case 'hemp':
      return 'HEMP';
    case 'kratom':
      return 'Kratom';
    case 'general':
      return 'General Freight';
    default:
      return 'Dried Cannabis Flower';
  }
}

export function airportCodeFromPort(port?: string | null): string {
  if (!port) return '';
  const t = port.trim();
  const paren = t.match(/\(([A-Za-z]{3})\)/);
  if (paren) return paren[1].toUpperCase();
  if (/^[A-Za-z]{3}$/.test(t)) return t.toUpperCase();
  return t;
}

export function buildRouting(originCode: string, port?: string | null): string {
  const dest = airportCodeFromPort(port);
  return dest ? `${(originCode || 'BKK').trim()}-${dest}` : '';
}

export function summarizePallets(
  pallets: Pallet[],
  actualWeightKg?: number | null
): {
  declaredNetWeightKg: number | null;
  netWeightSource: 'quotation_pallets' | 'quotation_actual_weight' | 'unavailable';
  piecesSummary: string;
  palletDimensions: string;
} {
  let weight = 0;
  let pieces = 0;
  let dims = '';

  for (const p of pallets) {
    const qty = Number(p.quantity) || 1;
    pieces += qty;
    weight += (Number(p.weight) || 0) * qty;
  }
  if (pallets.length > 0) {
    const first = pallets[0];
    dims = `${first.length || 0} × ${first.width || 0} × ${first.height || 0} cm`;
  }

  const piecesSummary = pieces > 0 ? `${pieces} Pallets` : '';
  const palletDimensions = dims;

  if (weight > 0) {
    return {
      declaredNetWeightKg: weight,
      netWeightSource: 'quotation_pallets',
      piecesSummary,
      palletDimensions,
    };
  }

  const stored = Number(actualWeightKg) || 0;
  if (stored > 0) {
    return {
      declaredNetWeightKg: stored,
      netWeightSource: 'quotation_actual_weight',
      piecesSummary,
      palletDimensions,
    };
  }

  return {
    declaredNetWeightKg: null,
    netWeightSource: 'unavailable',
    piecesSummary,
    palletDimensions,
  };
}

/** Mirror handleSaveOpportunity insert payload from opportunities/page.tsx */
export function buildOpCardPayload(
  quotation: Quotation,
  overrides?: OpCardOverrides
): OpCardInsertPayload {
  const customerName = (quotation.company_name || quotation.customer_name || '').trim();
  if (!customerName) {
    throw new Error(
      'Missing required fields: customer_name (set company_name or customer_name on quotation)'
    );
  }

  const topic =
    overrides?.topic?.trim() ||
    quotation.quotation_no ||
    customerName ||
    `Quote ${quotation.id.slice(0, 8)}`;

  return {
    topic,
    customer_name: customerName,
    company_id: quotation.company_id || null,
    amount: quotation.total_cost || 0,
    currency: 'THB',
    stage: overrides?.stage?.trim() || 'inquiry',
    probability: 10,
    close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    vehicle_type: quotation.delivery_vehicle_type || null,
    container_size: null,
    product_details: null,
    notes: overrides?.notes?.trim() || quotation.notes || null,
    destination_id: quotation.destination_id || null,
    owner_id: quotation.user_id || null,
    pickup_date: null,
  };
}

export function assembleBookingDraft(
  quotation: Quotation,
  emailData: EmailBookingData,
  recipients: BookingRecipients,
  opts?: { alreadyDrafted?: boolean }
): BookingEmailDraft {
  const merged: EmailBookingData = {
    ...emailData,
    recipientName: emailData.recipientName || recipients.recipientName,
    senderName: emailData.senderName || recipients.senderName,
  };
  return {
    subject: generateEmailSubject(merged),
    body: formatBookingEmail(merged),
    to: recipients.to,
    cc: recipients.cc,
    from: recipients.from,
    quotation_id: quotation.id,
    omg_number: quotation.quotation_no || quotation.id.slice(0, 8),
    already_drafted: !!opts?.alreadyDrafted,
    document_list_url: merged.documentListUrl || null,
  };
}
