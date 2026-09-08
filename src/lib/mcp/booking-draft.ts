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

export function summarizePallets(
  pallets: Pallet[],
  quote?: Pick<Quotation, 'total_actual_weight' | 'chargeable_weight'>
): {
  declaredNetWeightKg: number | null;
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
  if (weight === 0 && quote) {
    weight = quote.total_actual_weight || quote.chargeable_weight || 0;
  }
  if (pallets.length > 0) {
    const first = pallets[0];
    dims = `${first.length || 0} × ${first.width || 0} × ${first.height || 0} cm`;
  }

  return {
    declaredNetWeightKg: weight > 0 ? weight : null,
    piecesSummary: pieces > 0 ? `${pieces} Pallets` : '',
    palletDimensions: dims,
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
