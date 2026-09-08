import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildBookingDocumentListUrl,
  mergeBookingDetailsFromQuotation,
  type EmailBookingData,
} from '@/lib/email-templates';
import { getBookingRecipients } from '@/lib/booking-recipients';
import {
  assembleBookingDraft,
  buildOpCardPayload,
  buildRouting,
  piecesLabel,
  productLabelFromCommodity,
  summarizePallets,
  type BookingEmailDraft,
  type PackagingType,
} from '@/lib/mcp/booking-draft';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/site';
import { getFileUrl } from '@/lib/storage';
import type { DocumentSubmission, Pallet, Quotation } from '@/lib/db';

export type { BookingEmailDraft } from '@/lib/mcp/booking-draft';
export { assembleBookingDraft, piecesLabel, productLabelFromCommodity, summarizePallets };

export type QuotationWithPort = Quotation & { destination_port?: string | null };

export interface BuildBookingEmailDraftRef {
  quotation_id?: string;
  omg_number?: string;
  net_weight_kg?: number;
  routing?: string;
  airline?: string;
  preferred_shipment_date?: string;
  mawb?: string;
  consignee?: string;
  number_of_pieces?: string;
  pallet_dimensions?: string;
  origin?: string;
  product?: string;
  destination?: string;
  packaging_type?: PackagingType;
  pieces?: number;
}

export interface UpdateQuotationNetWeightRef {
  quotation_id?: string;
  omg_number?: string;
  net_weight_kg: number;
  source: string;
  note?: string;
}

export interface CreateOpCardRef {
  quotation_id?: string;
  omg_number?: string;
  topic?: string;
  stage?: string;
  notes?: string;
  owner_email?: string;
  owner_id?: string;
}

export interface GetOpCardRef {
  quotation_id?: string;
  omg_number?: string;
  op_card_id?: string;
}

const DEFAULT_OPPORTUNITY_OWNER_EMAIL = 'vieww.weeraphat@gmail.com';

export interface ExtractedBookingFields {
  quotation_id: string;
  omg_number: string | null;
  product: string;
  destination: string;
  net_weight_kg: number | null;
  net_weight_source: string;
  net_weight_confidence: 'low' | 'medium' | 'high';
  chargeable_weight: number | null;
  packaging_type: PackagingType;
  pieces: number;
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
const WEIGHT_DOC_ORDER = ['commercial-invoice', 'packing-list'];
// ponytail: Grok (vision LLM) reads these doc URLs and persists via update_quotation_net_weight.
const VERIFY_DOC_NOTE =
  'Read total net KG from Commercial Invoice first, then Export Packing List; then call update_quotation_net_weight. Never use chargeable weight.';

function mapQuotationRow(data: Record<string, unknown>): QuotationWithPort {
  const company = data.company as { name?: string } | null;
  const dest = data.destination_country as { country?: string; port?: string } | null;
  return {
    ...(data as unknown as Quotation),
    company_name: company?.name ?? (data.company_name as string | null),
    destination: dest
      ? `${dest.country || ''}${dest.port ? `, ${dest.port}` : ''}`.trim()
      : (data.destination as string | null),
    destination_port: dest?.port ?? null,
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

async function resolveOpportunityOwnerId(
  supabase: SupabaseClient,
  ref: { owner_id?: string; owner_email?: string }
): Promise<string> {
  if (ref.owner_id?.trim()) return ref.owner_id.trim();

  const email =
    ref.owner_email?.trim() ||
    process.env.OPPORTUNITY_OWNER_EMAIL?.trim() ||
    DEFAULT_OPPORTUNITY_OWNER_EMAIL;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.id) return data.id;

  throw new Error(
    'Set OPPORTUNITY_OWNER_EMAIL (or pass owner_email/owner_id) to a staff profile so the Op card shows in the Opportunities UI'
  );
}

async function fetchQuotationByRef(
  supabase: SupabaseClient,
  ref: { quotation_id?: string; omg_number?: string }
): Promise<QuotationWithPort | null> {
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
  quotation: QuotationWithPort
): Promise<EmailBookingData> {
  const saved = quotation.booking_details as EmailBookingData | null;
  const product = productLabelFromCommodity(quotation.commodity_type);
  const base = mergeBookingDetailsFromQuotation(quotation, saved);
  const token = await ensureBookingShareToken(supabase, quotation.id, quotation.booking_share_token);
  const documentListUrl = token ? buildBookingDocumentListUrl(absoluteUrl(''), token) : '';
  const destination = quotation.destination || quotation.requested_destination || base.destination || '';
  const origin = saved?.origin || 'BKK';
  const routing = saved?.routing || buildRouting(origin, quotation.destination_port);

  return {
    ...base,
    product: saved?.product || product,
    destination,
    origin,
    routing,
    consignee: saved?.consignee || quotation.consignee_name || '',
    airline: saved?.airline || 'TG',
    documentListUrl,
    recipientName: saved?.recipientName || getBookingRecipients().recipientName,
    senderName: saved?.senderName || getBookingRecipients().senderName,
  };
}

function applyDraftOverrides(
  emailData: EmailBookingData,
  ref: BuildBookingEmailDraftRef
): EmailBookingData {
  const out = { ...emailData };
  if (ref.net_weight_kg != null) out.netWeight = ref.net_weight_kg;
  if (ref.routing) out.routing = ref.routing;
  if (ref.airline) out.airline = ref.airline;
  if (ref.preferred_shipment_date) out.preferredShipmentDate = ref.preferred_shipment_date;
  if (ref.mawb) out.mawb = ref.mawb;
  if (ref.consignee) out.consignee = ref.consignee;
  if (ref.number_of_pieces) out.numberOfPieces = ref.number_of_pieces;
  if (ref.pallet_dimensions) out.palletDimensions = ref.pallet_dimensions;
  if (ref.origin) out.origin = ref.origin;
  if (ref.product) out.product = ref.product;
  if (ref.destination) out.destination = ref.destination;
  if (ref.packaging_type && ref.pieces != null && ref.pieces > 0) {
    out.numberOfPieces = piecesLabel(ref.pieces, ref.packaging_type);
  }
  return out;
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
  const packagingType: PackagingType = 'pallet';
  const { declaredNetWeightKg, netWeightSource, piecesSummary, palletDimensions, pieces } =
    summarizePallets(pallets, quotation.total_actual_weight, packagingType);
  const saved = quotation.booking_details as EmailBookingData | null;
  const origin = saved?.origin || 'BKK';
  const routing = saved?.routing || buildRouting(origin, quotation.destination_port);

  const weightDocs = documents
    .filter((d) => WEIGHT_DOC_TYPES.has(d.document_type))
    .sort(
      (a, b) =>
        WEIGHT_DOC_ORDER.indexOf(a.document_type) - WEIGHT_DOC_ORDER.indexOf(b.document_type)
    );

  const verifyDocs = await Promise.all(
    weightDocs.map(async (d) => ({
      document_type: d.document_type,
      file_name: d.original_file_name || d.file_name,
      download_url: d.file_path
        ? await getFileUrl(d.file_path, d.storage_provider || 'r2')
        : d.file_url || null,
      note: VERIFY_DOC_NOTE,
    }))
  );

  // Net from quotation only. If pallets are 0, Grok reads verify_from_documents and
  // persists via update_quotation_net_weight (confidence stays low until then).
  const confidence: ExtractedBookingFields['net_weight_confidence'] =
    declaredNetWeightKg != null ? 'high' : 'low';

  return {
    quotation_id: quotation.id,
    omg_number: quotation.quotation_no || null,
    product: productLabelFromCommodity(quotation.commodity_type),
    destination: quotation.destination || quotation.requested_destination || '',
    net_weight_kg: declaredNetWeightKg,
    net_weight_source: netWeightSource,
    net_weight_confidence: confidence,
    chargeable_weight: quotation.chargeable_weight ?? null,
    packaging_type: packagingType,
    pieces,
    airline: saved?.airline || 'TG',
    shipper: quotation.company_name || '',
    consignee: quotation.consignee_name || saved?.consignee || '',
    pieces_summary: piecesSummary,
    pallet_dimensions: palletDimensions,
    routing,
    origin,
    verify_from_documents: verifyDocs,
  };
}

export async function buildBookingEmailDraft(
  ref: BuildBookingEmailDraftRef
): Promise<BookingEmailDraft | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const quotation = await fetchQuotationByRef(supabase, ref);
  if (!quotation) return null;

  // Net from quotation pallets / total_actual_weight or explicit override.
  // If still empty, Grok should pass net_weight_kg (read from CI) or call
  // update_quotation_net_weight first, else the draft shows [Weight] KG.
  const emailData = applyDraftOverrides(
    await buildEmailDataForQuotation(supabase, quotation),
    ref
  );
  const recipients = getBookingRecipients();
  const draftedAt = quotation.booking_email_drafted_at;

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

  if (quotation.booking_email_drafted_at) {
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

export async function updateQuotationNetWeight(ref: UpdateQuotationNetWeightRef): Promise<{
  ok: boolean;
  quotation_id: string;
  omg_number: string | null;
  net_weight_kg: number;
  previous_net_weight_kg: number | null;
  source: string;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const quotation = await fetchQuotationByRef(supabase, ref);
  if (!quotation) throw new Error('Quotation not found.');

  const forbiddenSources = ['chargeable', 'chargeable_weight', 'manual_chargeable_weight', 'volume'];
  const src = ref.source.trim().toLowerCase();
  if (forbiddenSources.some((f) => src.includes(f))) {
    throw new Error(
      'source must not be chargeable/volume — use commercial-invoice, packing-list, or quotation_pallets'
    );
  }

  const previous = quotation.total_actual_weight ?? null;
  const updatePayload: Record<string, unknown> = {
    total_actual_weight: ref.net_weight_kg,
    updated_at: new Date().toISOString(),
  };

  if (ref.note?.trim()) {
    const stamp = `[MCP net ${new Date().toISOString()}] ${ref.source}: ${ref.note.trim()}`;
    updatePayload.internal_remark = quotation.internal_remark
      ? `${quotation.internal_remark}\n${stamp}`
      : stamp;
  }

  const { error } = await supabase
    .from('quotations')
    .update(updatePayload)
    .eq('id', quotation.id);

  if (error) throw new Error(error.message);

  return {
    ok: true,
    quotation_id: quotation.id,
    omg_number: quotation.quotation_no || null,
    net_weight_kg: ref.net_weight_kg,
    previous_net_weight_kg: previous,
    source: ref.source,
  };
}

export async function createOpCard(ref: CreateOpCardRef): Promise<{
  ok: boolean;
  quotation_id: string;
  omg_number: string | null;
  op_card_id: string;
  url: string;
  created: boolean;
  owner_id: string;
  repaired: boolean;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  const quotation = await fetchQuotationByRef(supabase, ref);
  if (!quotation) throw new Error('Quotation not found.');

  const ownerId = await resolveOpportunityOwnerId(supabase, ref);

  if (quotation.opportunity_id) {
    let repaired = false;
    const { data: existing, error: fetchError } = await supabase
      .from('opportunities')
      .select('id, owner_id')
      .eq('id', quotation.opportunity_id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);

    if (existing && existing.owner_id !== ownerId) {
      const { error: repairError } = await supabase
        .from('opportunities')
        .update({ owner_id: ownerId })
        .eq('id', existing.id);

      if (repairError) throw new Error(repairError.message);
      repaired = true;
    }

    return {
      ok: true,
      quotation_id: quotation.id,
      omg_number: quotation.quotation_no || null,
      op_card_id: quotation.opportunity_id,
      url: `/opportunities/${quotation.opportunity_id}`,
      created: false,
      owner_id: ownerId,
      repaired,
    };
  }

  const payload = buildOpCardPayload(
    quotation,
    ownerId,
    {
      topic: ref.topic,
      stage: ref.stage,
      notes: ref.notes,
    }
  );

  const { data, error } = await supabase
    .from('opportunities')
    .insert([payload])
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create opportunity.');

  const { error: linkError } = await supabase
    .from('quotations')
    .update({
      opportunity_id: data.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quotation.id);

  if (linkError) throw new Error(linkError.message);

  return {
    ok: true,
    quotation_id: quotation.id,
    omg_number: quotation.quotation_no || null,
    op_card_id: data.id,
    url: `/opportunities/${data.id}`,
    created: true,
    owner_id: ownerId,
    repaired: false,
  };
}

export async function getOpCard(ref: GetOpCardRef): Promise<Record<string, unknown> | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Server configuration error.');

  let opCardId = ref.op_card_id?.trim();
  let linkedQuotationId: string | null = null;
  let quotationNo: string | null = null;

  if (!opCardId) {
    const quotation = await fetchQuotationByRef(supabase, ref);
    if (!quotation) return null;
    linkedQuotationId = quotation.id;
    quotationNo = quotation.quotation_no || null;
    if (!quotation.opportunity_id) return null;
    opCardId = quotation.opportunity_id;
  }

  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opCardId)
    .maybeSingle();

  if (oppError) throw new Error(oppError.message);
  if (!opp) return null;

  if (!linkedQuotationId) {
    const { data: quotes, error: quoteError } = await supabase
      .from('quotations')
      .select('id, quotation_no')
      .eq('opportunity_id', opp.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (quoteError) {
      console.error('[getOpCard] reverse quotation lookup failed:', quoteError.message);
    }
    linkedQuotationId = quotes?.[0]?.id ?? null;
    quotationNo = quotes?.[0]?.quotation_no ?? null;
  }

  return {
    ...opp,
    op_card_id: opp.id,
    linked_quotation_id: linkedQuotationId,
    quotation_no: quotationNo,
    omg_number: quotationNo,
    url: `/opportunities/${opp.id}`,
  };
}
