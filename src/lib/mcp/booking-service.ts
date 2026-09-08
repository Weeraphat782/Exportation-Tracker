import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildBookingDocumentListUrl,
  mergeBookingDetailsFromQuotation,
  type EmailBookingData,
} from '@/lib/email-templates';
import { getBookingRecipients } from '@/lib/booking-recipients';
import {
  assembleBookingDraft,
  productLabelFromCommodity,
  summarizePallets,
  type BookingEmailDraft,
} from '@/lib/mcp/booking-draft';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/site';
import { getFileUrl } from '@/lib/storage';
import type { DocumentSubmission, Pallet, Quotation } from '@/lib/db';

export type { BookingEmailDraft } from '@/lib/mcp/booking-draft';
export { assembleBookingDraft, productLabelFromCommodity, summarizePallets };

export interface ExtractedBookingFields {
  quotation_id: string;
  omg_number: string | null;
  product: string;
  destination: string;
  net_weight_kg: number | null;
  net_weight_source: string;
  net_weight_confidence: 'low' | 'medium' | 'high';
  airline: string;
  shipper: string;
  consignee: string;
  pieces_summary: string;
  pallet_dimensions: string;
  routing: string;
  origin: string;
  verify_from_documents: Array<{
    document_type: string;
    file_name: string;
    download_url: string | null;
    note: string;
  }>;
}

const QUOTATION_SELECT = `
  *,
  company:companies(name, address, tax_id, contact_person, contact_email, contact_phone),
  destination_country:destinations(country, port),
  product:products(name)
`;

const WEIGHT_DOC_TYPES = new Set(['packing-list', 'commercial-invoice']);

function mapQuotationRow(data: Record<string, unknown>): Quotation {
  const company = data.company as { name?: string } | null;
  const dest = data.destination_country as { country?: string; port?: string } | null;
  return {
    ...(data as unknown as Quotation),
    company_name: company?.name ?? (data.company_name as string | null),
    destination: dest
      ? `${dest.country || ''}${dest.port ? `, ${dest.port}` : ''}`.trim()
      : (data.destination as string | null),
  };
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

async function fetchQuotationByRef(
  supabase: SupabaseClient,
  ref: { quotation_id?: string; omg_number?: string }
): Promise<Quotation | null> {
  if (ref.quotation_id) {
    const { data, error } = await supabase
      .from('quotations')
      .select(QUOTATION_SELECT)
      .eq('id', ref.quotation_id)
      .maybeSingle();
    if (error || !data) return null;
    return mapQuotationRow(data as Record<string, unknown>);
  }
  if (ref.omg_number) {
    const { data, error } = await supabase
      .from('quotations')
      .select(QUOTATION_SELECT)
      .eq('quotation_no', ref.omg_number)
      .maybeSingle();
    if (error || !data) return null;
    return mapQuotationRow(data as Record<string, unknown>);
  }
  return null;
}

async function buildEmailDataForQuotation(
  supabase: SupabaseClient,
  quotation: Quotation
): Promise<EmailBookingData> {
  const saved = quotation.booking_details as EmailBookingData | null;
  const product = productLabelFromCommodity(quotation.commodity_type);
  const base = mergeBookingDetailsFromQuotation(quotation, saved);
  const token = await ensureBookingShareToken(supabase, quotation.id, quotation.booking_share_token);
  const documentListUrl = token ? buildBookingDocumentListUrl(absoluteUrl(''), token) : '';
  const destination = quotation.destination || quotation.requested_destination || base.destination || '';

  return {
    ...base,
    product: saved?.product || product,
    destination,
    consignee: saved?.consignee || quotation.consignee_name || '',
    airline: saved?.airline || 'TG',
    documentListUrl,
    recipientName: saved?.recipientName || getBookingRecipients().recipientName,
    senderName: saved?.senderName || getBookingRecipients().senderName,
  };
}

export async function listNewQuotations(opts?: {
  status?: string;
  since?: string;
  exclude_drafted?: boolean;
  limit?: number;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const status = opts?.status || 'pending_approval';
  const limit = Math.min(opts?.limit ?? 50, 100);
  let query = supabase
    .from('quotations')
    .select(
      'id, quotation_no, status, created_at, company_name, consignee_name, destination, requested_destination, commodity_type, pallets, booking_email_drafted_at'
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts?.since) query = query.gte('created_at', opts.since);
  if (opts?.exclude_drafted !== false) query = query.is('booking_email_drafted_at', null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getQuotationDetail(ref: {
  quotation_id?: string;
  omg_number?: string;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const quotation = await fetchQuotationByRef(supabase, ref);
  if (!quotation) return null;

  const { data: docs } = await supabase
    .from('document_submissions')
    .select('*')
    .eq('quotation_id', quotation.id)
    .order('submitted_at', { ascending: false });

  return { quotation, documents: (docs ?? []) as DocumentSubmission[] };
}

export async function getQuotationDocuments(ref: {
  quotation_id?: string;
  omg_number?: string;
}) {
  const detail = await getQuotationDetail(ref);
  if (!detail) return null;

  const attachments = await Promise.all(
    detail.documents.map(async (doc) => ({
      id: doc.id,
      document_type: doc.document_type,
      document_type_name: doc.document_type_name,
      file_name: doc.original_file_name || doc.file_name,
      download_url: doc.file_path
        ? await getFileUrl(doc.file_path, doc.storage_provider || 'r2')
        : doc.file_url || null,
    }))
  );
  return { quotation_id: detail.quotation.id, omg_number: detail.quotation.quotation_no, attachments };
}

export async function extractBookingFields(ref: {
  quotation_id?: string;
  omg_number?: string;
}): Promise<ExtractedBookingFields | null> {
  const detail = await getQuotationDetail(ref);
  if (!detail) return null;

  const { quotation, documents } = detail;
  const pallets = (Array.isArray(quotation.pallets) ? quotation.pallets : []) as Pallet[];
  const { declaredNetWeightKg, piecesSummary, palletDimensions } = summarizePallets(pallets, quotation);
  const saved = quotation.booking_details as EmailBookingData | null;

  const verifyDocs = await Promise.all(
    documents
      .filter((d) => WEIGHT_DOC_TYPES.has(d.document_type))
      .map(async (d) => ({
        document_type: d.document_type,
        file_name: d.original_file_name || d.file_name,
        download_url: d.file_path
          ? await getFileUrl(d.file_path, d.storage_provider || 'r2')
          : d.file_url || null,
        note: 'Preferred source of truth for net weight — verify against declared quotation weight.',
      }))
  );

  const confidence: ExtractedBookingFields['net_weight_confidence'] =
    verifyDocs.length > 0 ? 'medium' : declaredNetWeightKg ? 'low' : 'low';

  return {
    quotation_id: quotation.id,
    omg_number: quotation.quotation_no || null,
    product: productLabelFromCommodity(quotation.commodity_type),
    destination: quotation.destination || quotation.requested_destination || '',
    net_weight_kg: declaredNetWeightKg,
    net_weight_source: 'quotation_pallets',
    net_weight_confidence: confidence,
    airline: saved?.airline || 'TG',
    shipper: quotation.company_name || '',
    consignee: quotation.consignee_name || saved?.consignee || '',
    pieces_summary: piecesSummary,
    pallet_dimensions: palletDimensions,
    routing: saved?.routing || '',
    origin: saved?.origin || 'BKK',
    verify_from_documents: verifyDocs,
  };
}

export async function buildBookingEmailDraft(ref: {
  quotation_id?: string;
  omg_number?: string;
}): Promise<BookingEmailDraft | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const quotation = await fetchQuotationByRef(supabase, ref);
  if (!quotation) return null;

  const emailData = await buildEmailDataForQuotation(supabase, quotation);
  const recipients = getBookingRecipients();
  const draftedAt = (quotation as Quotation & { booking_email_drafted_at?: string | null })
    .booking_email_drafted_at;

  return assembleBookingDraft(quotation, emailData, recipients, {
    alreadyDrafted: !!draftedAt,
  });
}

export async function markBookingEmailDrafted(ref: {
  quotation_id?: string;
  omg_number?: string;
  drafted_by?: string;
}): Promise<{ ok: boolean; already_drafted: boolean; quotation_id?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const quotation = await fetchQuotationByRef(supabase, ref);
  if (!quotation) return { ok: false, already_drafted: false };

  const row = quotation as Quotation & { booking_email_drafted_at?: string | null };
  if (row.booking_email_drafted_at) {
    return { ok: true, already_drafted: true, quotation_id: quotation.id };
  }

  const { error } = await supabase
    .from('quotations')
    .update({
      booking_email_drafted_at: new Date().toISOString(),
      booking_email_drafted_by: ref.drafted_by?.trim() || 'mcp',
    })
    .eq('id', quotation.id)
    .is('booking_email_drafted_at', null);

  if (error) throw new Error(error.message);
  return { ok: true, already_drafted: false, quotation_id: quotation.id };
}
