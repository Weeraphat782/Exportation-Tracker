import type { SupabaseClient } from '@supabase/supabase-js';
import { buildBookingDocumentListUrl } from '@/lib/email-templates';
import { absoluteUrl } from '@/lib/site';
import { getFileUrl } from '@/lib/storage';
import type { DocumentSubmission, Pallet, Quotation } from '@/lib/db';
import { productLabelFromCommodity, summarizePallets } from '@/lib/mcp/booking-draft';

export interface QuotationCreatedPayload {
  event: 'quotation.created';
  emitted_at: string;
  quotation_id: string;
  omg_number: string | null;
  status: string;
  created_at: string;
  shipper: string | null;
  consignee: string | null;
  product: string;
  commodity_type: string | null;
  destination: string | null;
  requested_destination: string | null;
  declared_net_weight_kg: number | null;
  chargeable_weight_kg: number | null;
  pieces_summary: string;
  pallet_dimensions: string;
  airline_preference: string | null;
  document_list_url: string | null;
  attachments: Array<{
    id: string;
    document_type: string;
    file_name: string;
    download_url: string | null;
  }>;
}

async function ensureBookingShareToken(
  supabase: SupabaseClient,
  quotationId: string,
  existing?: string | null
): Promise<string | null> {
  if (existing) return existing;
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from('quotations')
    .update({ booking_share_token: token })
    .eq('id', quotationId);
  return error ? null : token;
}

async function attachmentUrls(
  docs: DocumentSubmission[]
): Promise<QuotationCreatedPayload['attachments']> {
  return Promise.all(
    docs.map(async (doc) => ({
      id: doc.id,
      document_type: doc.document_type,
      file_name: doc.original_file_name || doc.file_name,
      download_url: doc.file_path
        ? await getFileUrl(doc.file_path, doc.storage_provider || 'r2')
        : doc.file_url || null,
    }))
  );
}

/** Build webhook payload from a quotation row + linked docs. */
export async function buildQuotationCreatedPayload(
  supabase: SupabaseClient,
  quote: Quotation,
  docs: DocumentSubmission[] = []
): Promise<QuotationCreatedPayload> {
  const pallets = (Array.isArray(quote.pallets) ? quote.pallets : []) as Pallet[];
  const { declaredNetWeightKg, piecesSummary, palletDimensions } = summarizePallets(pallets);
  const bookingDetails =
    quote.booking_details && typeof quote.booking_details === 'object'
      ? (quote.booking_details as Record<string, unknown>)
      : null;
  const token = await ensureBookingShareToken(supabase, quote.id, quote.booking_share_token);
  const documentListUrl = token ? buildBookingDocumentListUrl(absoluteUrl(''), token) : null;

  return {
    event: 'quotation.created',
    emitted_at: new Date().toISOString(),
    quotation_id: quote.id,
    omg_number: quote.quotation_no || null,
    status: quote.status,
    created_at: quote.created_at,
    shipper: quote.company_name || null,
    consignee: quote.consignee_name || null,
    product: productLabelFromCommodity(quote.commodity_type),
    commodity_type: quote.commodity_type || null,
    destination: quote.destination || quote.requested_destination || null,
    requested_destination: quote.requested_destination || null,
    declared_net_weight_kg: declaredNetWeightKg,
    chargeable_weight_kg: quote.chargeable_weight ?? null,
    pieces_summary: piecesSummary,
    pallet_dimensions: palletDimensions,
    airline_preference:
      (typeof bookingDetails?.airline === 'string' ? bookingDetails.airline : null) || 'TG',
    document_list_url: documentListUrl,
    attachments: await attachmentUrls(docs),
  };
}

/** Fire-and-forget outbound webhook; never throws to caller. */
export async function emitQuotationCreated(
  supabase: SupabaseClient,
  quote: Quotation,
  docs: DocumentSubmission[] = []
): Promise<void> {
  const url = process.env.QUOTATION_WEBHOOK_URL?.trim();
  // Grok routine webhook key (crsr_...), provided BY Grok — not invented by us.
  const webhookKey = process.env.WEBHOOK_SIGNING_SECRET?.trim();
  if (!url || !webhookKey) return;

  try {
    const payload = await buildQuotationCreatedPayload(supabase, quote, docs);
    const body = JSON.stringify(payload);
    // ponytail: Grok expects Authorization Bearer; swap header if routine format changes.
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookKey}`,
        'X-OMG-Event': 'quotation.created',
      },
      body,
    });
  } catch (err) {
    console.error('[webhook] quotation.created failed:', err);
  }
}
